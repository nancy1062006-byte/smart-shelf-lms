import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BOOKS, type CatalogBook } from "@/data/booksCatalog";

export type IssueRecord = {
  id: string;
  book_id: string;
  user_id: string;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: "issued" | "returned";
  books: {
    title: string;
    author: string;
    category: string;
    isbn?: string | null;
    cover_url?: string | null;
  } | null;
};

const LOCAL_ISSUES_KEY = "smartshelf_local_issues_v2";
const INVENTORY_OVERRIDES_KEY = "smartshelf_inventory_overrides_v2";

/**
 * Normalizes an ISBN string by stripping spaces and hyphens.
 */
export function normalizeIsbn(isbn: string | null | undefined): string | null {
  if (!isbn) return null;
  const cleaned = isbn.replace(/[\s-]/g, "").trim();
  return cleaned || null;
}

/**
 * Retrieves local issue records stored in the browser.
 */
export function getLocalIssues(): IssueRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ISSUES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse local issues", e);
    return [];
  }
}

/**
 * Saves local issue records.
 */
export function saveLocalIssues(issues: IssueRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ISSUES_KEY, JSON.stringify(issues));
  } catch (e) {
    console.error("Failed to save local issues", e);
  }
}

/**
 * Retrieves local inventory overrides (available_copies adjustments).
 */
export function getInventoryOverrides(): Record<string, { available: number; total: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INVENTORY_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves local inventory overrides.
 */
export function saveInventoryOverride(key: string, available: number, total: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = getInventoryOverrides();
    current[key] = { available, total };
    localStorage.setItem(INVENTORY_OVERRIDES_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save inventory override", e);
  }
}

/**
 * Looks up book metadata from catalog or existing list by id, isbn, or title.
 */
export function resolveBookMetadata(bookIdOrIsbn: string): {
  title: string;
  author: string;
  category: string;
  isbn?: string | null;
  cover_url?: string | null;
} {
  const normKey = bookIdOrIsbn.trim().toLowerCase();
  const cleanIsbn = normalizeIsbn(bookIdOrIsbn);

  const found = DEFAULT_BOOKS.find((b) => {
    if (b.id && b.id.toLowerCase() === normKey) return true;
    if (b.isbn && cleanIsbn && normalizeIsbn(b.isbn) === cleanIsbn) return true;
    if (b.title && b.title.trim().toLowerCase() === normKey) return true;
    return false;
  });

  if (found) {
    return {
      title: found.title,
      author: found.author,
      category: found.category,
      isbn: found.isbn,
      cover_url: found.cover_url,
    };
  }

  return {
    title: "Library Book",
    author: "Catalog Title",
    category: "General",
    isbn: cleanIsbn,
    cover_url: cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : null,
  };
}

/**
 * Fetches all issues for a user (or all issues for librarians), merging Supabase data with
 * local records and guaranteeing that the `books` property is never null or blank.
 */
export async function fetchMergedIssues(userId?: string, isLibrarian = false): Promise<IssueRecord[]> {
  const merged: IssueRecord[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch remote Supabase issues if user is authenticated
  if (userId) {
    try {
      let query = supabase
        .from("issued_books")
        .select("id, book_id, user_id, issued_at, due_date, returned_at, status, books(title, author, category, isbn, cover_url)")
        .order("issued_at", { ascending: false });

      if (!isLibrarian) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const item of data) {
          seenIds.add(item.id);
          const rawBooks = (item as any).books;
          const bookMeta = rawBooks && rawBooks.title ? rawBooks : resolveBookMetadata(item.book_id);

          merged.push({
            id: item.id,
            book_id: item.book_id,
            user_id: item.user_id,
            issued_at: item.issued_at,
            due_date: item.due_date,
            returned_at: item.returned_at,
            status: item.status as "issued" | "returned",
            books: bookMeta,
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote issues, falling back to local store:", e);
    }
  }

  // 2. Fetch and merge local issue records
  const localIssues = getLocalIssues();
  for (const item of localIssues) {
    if (seenIds.has(item.id)) continue;

    // Filter by user unless librarian
    if (!isLibrarian && userId && item.user_id !== userId) continue;

    const bookMeta = item.books && item.books.title ? item.books : resolveBookMetadata(item.book_id);
    merged.push({
      ...item,
      books: bookMeta,
    });
    seenIds.add(item.id);
  }

  // Sort by issued_at descending
  return merged.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
}

/**
 * Issues a book to a user. Tries Supabase RPC first if real UUID; otherwise handles locally.
 */
export async function executeIssueBook(
  book: CatalogBook,
  user: { id: string; email?: string; full_name?: string }
): Promise<void> {
  const cleanIsbn = normalizeIsbn(book.isbn);
  const bookKey = book.id || cleanIsbn || book.title;

  // Check if user already has an active issue for this book
  const currentIssues = await fetchMergedIssues(user.id);
  const alreadyIssued = currentIssues.some(
    (i) =>
      i.status === "issued" &&
      (i.book_id === bookKey ||
        (i.books?.title && i.books.title.toLowerCase() === book.title.toLowerCase()) ||
        (cleanIsbn && i.books?.isbn && normalizeIsbn(i.books.isbn) === cleanIsbn))
  );

  if (alreadyIssued) {
    throw new Error("You already have this book issued.");
  }

  // Check copies available
  const overrides = getInventoryOverrides();
  const override = overrides[bookKey] || overrides[cleanIsbn || ""] || overrides[book.title];
  const availableCopies = override ? override.available : book.available_copies;

  if (availableCopies < 1) {
    throw new Error("No copies available to issue.");
  }

  let remoteSuccess = false;

  // Check if book has a valid UUID (not "local-...")
  const isUuid = book.id && !book.id.startsWith("local-") && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(book.id);

  if (isUuid) {
    try {
      const { error } = await supabase.rpc("issue_book", { _book_id: book.id! });
      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn("Supabase issue_book RPC returned error, using local issue fallback:", error.message);
      }
    } catch (e) {
      console.warn("Supabase issue_book failed:", e);
    }
  }

  // If not handled by Supabase, record as a local issue record
  if (!remoteSuccess) {
    const localIssues = getLocalIssues();
    const newIssue: IssueRecord = {
      id: `local-issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      book_id: bookKey,
      user_id: user.id,
      issued_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      returned_at: null,
      status: "issued",
      books: {
        title: book.title,
        author: book.author,
        category: book.category,
        isbn: cleanIsbn,
        cover_url: book.cover_url || (cleanIsbn ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg` : null),
      },
    };

    localIssues.unshift(newIssue);
    saveLocalIssues(localIssues);

    // Decrement available copies locally
    const newAvailable = Math.max(0, availableCopies - 1);
    saveInventoryOverride(bookKey, newAvailable, book.total_copies);
    if (cleanIsbn) saveInventoryOverride(cleanIsbn, newAvailable, book.total_copies);
    saveInventoryOverride(book.title, newAvailable, book.total_copies);
  }
}

/**
 * Returns an issued book. Tries Supabase RPC first if real UUID; otherwise updates local record.
 */
export async function executeReturnBook(issueId: string, bookIdentifier?: string): Promise<void> {
  const isUuid = issueId && !issueId.startsWith("local-") && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(issueId);

  let remoteSuccess = false;
  if (isUuid) {
    try {
      const { error } = await supabase.rpc("return_book", { _issue_id: issueId });
      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn("Supabase return_book RPC error, falling back to local return:", error.message);
      }
    } catch (e) {
      console.warn("Supabase return_book failed:", e);
    }
  }

  // Update local issue record if it exists
  const localIssues = getLocalIssues();
  let updatedLocal = false;
  let targetBookKey = bookIdentifier;

  for (const item of localIssues) {
    if (item.id === issueId) {
      item.status = "returned";
      item.returned_at = new Date().toISOString();
      updatedLocal = true;
      if (!targetBookKey) targetBookKey = item.book_id;
      break;
    }
  }

  if (updatedLocal) {
    saveLocalIssues(localIssues);
  }

  // Increment available copies locally if inventory override exists
  if (targetBookKey) {
    const overrides = getInventoryOverrides();
    const ov = overrides[targetBookKey];
    if (ov) {
      const newAvail = Math.min(ov.total, ov.available + 1);
      saveInventoryOverride(targetBookKey, newAvail, ov.total);
    }
  }

  if (!remoteSuccess && !updatedLocal && !isUuid) {
    throw new Error("Loan record not found.");
  }
}
