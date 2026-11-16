import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  X,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BookMarked,
  Tag,
  User,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBookContent } from "@/data/bookContent";
import type { CatalogBook } from "@/data/booksCatalog";

type BookReaderProps = {
  open: boolean;
  onClose: () => void;
  book: CatalogBook | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  Psychology: "bg-violet-100 text-violet-700 border-violet-200",
  Biology: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Science: "bg-sky-100 text-sky-700 border-sky-200",
  Chemistry: "bg-orange-100 text-orange-700 border-orange-200",
  "Self-Help": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Computer Science": "bg-blue-100 text-blue-700 border-blue-200",
  Economics: "bg-green-100 text-green-700 border-green-200",
  History: "bg-amber-100 text-amber-700 border-amber-200",
  Literature: "bg-pink-100 text-pink-700 border-pink-200",
  Management: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Mathematics: "bg-red-100 text-red-700 border-red-200",
  Physics: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export function BookReader({ open, onClose, book }: BookReaderProps) {
  const [openChapter, setOpenChapter] = useState<number | null>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Reset to first chapter on each open
      setOpenChapter(0);
      // Scroll content to top
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !book) return null;

  const content = getBookContent(book.isbn) || getBookContent(book.title);
  const categoryStyle = CATEGORY_COLORS[book.category] ?? "bg-purple-100 text-purple-700 border-purple-200";
  const availabilityColor =
    book.available_copies > 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — full height flex column */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reading: ${book.title}`}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-3xl mx-4",
          "flex flex-col",
          "h-[90vh] max-h-[90vh]",           // ← fixed viewport height
          "bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        )}
      >
        {/* ── HEADER (fixed, never scrolls) ── */}
        <div className="flex-none border-b border-slate-100 bg-[#FCFBF8] px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Book cover thumbnail */}
              <div className="flex-none h-16 w-11 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                {book.cover_url || book.isbn ? (
                  <img
                    src={book.cover_url || `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (book.isbn && !t.dataset.triedGoogle) {
                        t.dataset.triedGoogle = "true";
                        t.src = `https://books.google.com/books/content?vid=isbn${book.isbn}&printsec=frontcover&img=1&zoom=1`;
                      } else {
                        t.style.display = "none";
                      }
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <BookOpen className="size-5 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Title & meta */}
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-slate-900 leading-snug line-clamp-2">
                  {book.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <User className="size-3" />
                    {book.author}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[11px] font-semibold px-2 py-0", categoryStyle)}
                  >
                    <Tag className="size-3 mr-1" />
                    {book.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[11px] font-semibold px-2 py-0", availabilityColor)}
                  >
                    {book.available_copies}/{book.total_copies} available
                  </Badge>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-none p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer mt-0.5"
              aria-label="Close reader"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY (takes all remaining height) ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="px-6 py-5 space-y-6">

            {/* Book Overview */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-4 text-[#6C4AB6]" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Book Overview
                </h3>
              </div>
              <div className="rounded-xl bg-[#F0EBFA]/60 border border-purple-100 px-4 py-3">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {content?.summary || book.description || "No overview available for this title."}
                </p>
              </div>
            </section>

            {/* Key Takeaways */}
            {content?.key_takeaways && content.key_takeaways.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="size-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Key Takeaways
                  </h3>
                </div>
                <ul className="space-y-2">
                  {content.key_takeaways.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 flex-none size-5 rounded-full bg-purple-100 text-[#6C4AB6] flex items-center justify-center text-[11px] font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Chapter Study Guide */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="size-4 text-[#6C4AB6]" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Chapter Study Guide
                </h3>
              </div>

              {content?.chapters && content.chapters.length > 0 ? (
                <div className="space-y-2">
                  {content.chapters.map((chapter, idx) => {
                    const isOpen = openChapter === idx;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-xl border transition-all duration-150",
                          isOpen
                            ? "border-[#6C4AB6]/30 bg-white shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        {/* Chapter toggle button */}
                        <button
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-left"
                          onClick={() => setOpenChapter(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                "flex-none size-7 rounded-lg flex items-center justify-center text-xs font-bold",
                                isOpen ? "bg-[#6C4AB6] text-white" : "bg-slate-200 text-slate-600"
                              )}
                            >
                              {chapter.chapter_number}
                            </span>
                            <div className="min-w-0">
                              <p className={cn(
                                "text-sm font-semibold truncate",
                                isOpen ? "text-[#6C4AB6]" : "text-slate-800"
                              )}>
                                {chapter.title}
                              </p>
                              {!isOpen && chapter.summary && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {chapter.summary}
                                </p>
                              )}
                            </div>
                          </div>
                          {isOpen
                            ? <ChevronDown className="flex-none size-4 text-[#6C4AB6]" />
                            : <ChevronRight className="flex-none size-4 text-slate-400" />
                          }
                        </button>

                        {/* Expanded chapter content */}
                        {isOpen && (
                          <div className="px-4 pb-5 border-t border-slate-100">
                            {chapter.summary && (
                              <>
                                <p className="mt-3 text-[11px] font-bold text-[#6C4AB6] uppercase tracking-widest">
                                  Summary
                                </p>
                                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed italic">
                                  {chapter.summary}
                                </p>
                              </>
                            )}
                            <p className="mt-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                              Study Notes
                            </p>
                            <p className="mt-1.5 text-sm text-slate-800 leading-[1.85] font-serif">
                              {chapter.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <BookOpen className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Detailed chapter guide coming soon.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {book.description || "This title is available in the physical library."}
                  </p>
                </div>
              )}
            </section>

            {/* ISBN footer */}
            {book.isbn && (
              <p className="text-[11px] text-slate-400 text-center pb-2 font-mono">
                ISBN: {book.isbn}
              </p>
            )}

          </div>
        </div>

        {/* ── FOOTER (fixed, never scrolls) ── */}
        <div className="flex-none px-6 py-3 border-t border-slate-100 bg-[#FCFBF8] flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Smart-Shelf Study Guide — Educational reference only.
          </p>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium"
          >
            <X className="size-3.5 mr-1.5" /> Close
          </Button>
        </div>
      </div>
    </>
  );
}
