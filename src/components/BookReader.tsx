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
  ChevronsUpDown,
  ZoomIn,
  ZoomOut,
  ArrowUp,
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
  // Store expanded chapters (all expanded by default for effortless continuous reading)
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      // Ensure all chapters are expanded for natural reading
      setExpandedChapters({ 0: true, 1: true, 2: true, 3: true });
      // Reset scroll position to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !book) return null;

  const content = getBookContent(book.isbn) || getBookContent(book.title);
  const categoryStyle = CATEGORY_COLORS[book.category] ?? "bg-purple-100 text-purple-700 border-purple-200";
  const availabilityColor =
    book.available_copies > 0
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200";

  const toggleChapter = (index: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAllChapters = () => {
    const chaptersCount = content?.chapters?.length || 3;
    const allOpen = Array.from({ length: chaptersCount }).every((_, i) => expandedChapters[i]);
    const newState: Record<number, boolean> = {};
    for (let i = 0; i < chaptersCount; i++) {
      newState[i] = !allOpen;
    }
    setExpandedChapters(newState);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToChapter = (idx: number) => {
    // Ensure the chapter is expanded first
    setExpandedChapters((prev) => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      const el = document.getElementById(`reader-chapter-${idx}`);
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal Card — Fully Constrained Height with min-h-0 Flex Child */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reading: ${book.title}`}
        className={cn(
          "relative z-10 flex flex-col w-full max-w-3xl",
          "h-[88vh] max-h-[850px] min-h-[400px]",
          "bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        )}
      >
        {/* ── 1. HEADER (Fixed, never scrolls) ── */}
        <div className="flex-none border-b border-slate-200 bg-[#FCFBF8] px-5 sm:px-6 py-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Book Cover Thumbnail */}
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

              {/* Title, Author & Category Badges */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4AB6] bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
                    Study Guide & Preview
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug line-clamp-1 mt-0.5">
                  {book.title}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-600 font-medium truncate max-w-[200px]">
                    <User className="size-3 text-slate-400" />
                    {book.author}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold px-2 py-0", categoryStyle)}
                  >
                    <Tag className="size-3 mr-1" />
                    {book.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold px-2 py-0", availabilityColor)}
                  >
                    {book.available_copies}/{book.total_copies} on Shelf
                  </Badge>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex-none p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close reader"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── 2. READER TOOLBAR & CHAPTER JUMP BAR (Fixed, quick navigation) ── */}
        <div className="flex-none bg-slate-50/90 border-b border-slate-200 px-5 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Chapter Quick Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">Jump to:</span>
            {content?.chapters?.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => scrollToChapter(idx)}
                className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-[#6C4AB6] hover:text-[#6C4AB6] text-slate-700 text-[11px] font-medium transition-all shadow-2xs cursor-pointer"
              >
                Ch {ch.chapter_number}
              </button>
            ))}
          </div>

          {/* Reader Controls: Font Size & Expand All */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
              <button
                onClick={() => setFontSize("sm")}
                title="Smaller text"
                className={cn(
                  "px-2 py-1 text-xs font-semibold transition-colors cursor-pointer",
                  fontSize === "sm" ? "bg-purple-100 text-[#6C4AB6]" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("base")}
                title="Medium text"
                className={cn(
                  "px-2 py-1 text-xs font-semibold border-x border-slate-200 transition-colors cursor-pointer",
                  fontSize === "base" ? "bg-purple-100 text-[#6C4AB6]" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                title="Larger text"
                className={cn(
                  "px-2 py-1 text-xs font-semibold transition-colors cursor-pointer",
                  fontSize === "lg" ? "bg-purple-100 text-[#6C4AB6]" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                A+
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllChapters}
              className="h-7 text-xs text-slate-600 hover:text-[#6C4AB6] hover:bg-purple-50 px-2 cursor-pointer"
            >
              <ChevronsUpDown className="size-3.5 mr-1" />
              Toggle All
            </Button>
          </div>
        </div>

        {/* ── 3. SCROLLABLE READING BODY (The Key Scroll Container) ── */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex-1 min-h-0 w-full overflow-y-scroll overscroll-contain",
            "px-6 sm:px-8 py-6 space-y-7",
            "focus:outline-none scroll-smooth touch-pan-y"
          )}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#CBD5E1 #F8FAFC",
          }}
          tabIndex={0}
        >
          {/* Book Overview Section */}
          <section id="reader-overview" className="scroll-mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex size-6 items-center justify-center rounded-md bg-purple-100 text-[#6C4AB6]">
                <FileText className="size-3.5" />
              </span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Book Overview & Context
              </h3>
            </div>
            <div className="rounded-xl bg-[#F0EBFA]/70 border border-purple-200/80 p-4 shadow-2xs">
              <p
                className={cn(
                  "text-slate-800 leading-relaxed font-medium",
                  fontSize === "sm" && "text-xs",
                  fontSize === "base" && "text-sm",
                  fontSize === "lg" && "text-base"
                )}
              >
                {content?.summary || book.description || "Comprehensive academic reading content and curriculum synthesis."}
              </p>
            </div>
          </section>

          {/* Key Takeaways Section */}
          {content?.key_takeaways && content.key_takeaways.length > 0 && (
            <section id="reader-takeaways" className="scroll-mt-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                  <Lightbulb className="size-3.5" />
                </span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Core Learning Takeaways
                </h3>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {content.key_takeaways.map((point, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-xl bg-white border border-slate-200 p-3.5 shadow-2xs"
                  >
                    <span className="size-5 rounded-full bg-purple-100 text-[#6C4AB6] flex items-center justify-center text-[10px] font-bold mb-2">
                      0{i + 1}
                    </span>
                    <p
                      className={cn(
                        "text-slate-700 leading-snug",
                        fontSize === "sm" && "text-xs",
                        fontSize === "base" && "text-xs font-medium",
                        fontSize === "lg" && "text-sm"
                      )}
                    >
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Extended Reading Sample / Introduction */}
          {content?.preview_text && (
            <section id="reader-intro" className="scroll-mt-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <BookOpen className="size-3.5" />
                </span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Curriculum Reading Sample
                </h3>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
                <div
                  className={cn(
                    "text-slate-700 leading-relaxed space-y-3 font-serif",
                    fontSize === "sm" && "text-xs",
                    fontSize === "base" && "text-sm",
                    fontSize === "lg" && "text-base"
                  )}
                >
                  {content.preview_text.split("\n\n").map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="border-t border-slate-200 my-2" />

          {/* Chapter Study Guides */}
          <section id="reader-chapters" className="scroll-mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-purple-100 text-[#6C4AB6]">
                  <BookMarked className="size-3.5" />
                </span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Chapter-by-Chapter Study Guide
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {content?.chapters?.length || 0} Chapters
              </span>
            </div>

            {content?.chapters && content.chapters.length > 0 ? (
              <div className="space-y-4">
                {content.chapters.map((chapter, idx) => {
                  const isExpanded = !!expandedChapters[idx];
                  return (
                    <div
                      key={idx}
                      id={`reader-chapter-${idx}`}
                      className={cn(
                        "rounded-xl border transition-all duration-200 overflow-hidden",
                        isExpanded
                          ? "border-[#6C4AB6]/40 bg-white shadow-sm ring-1 ring-[#6C4AB6]/10"
                          : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      {/* Chapter Title Bar */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 cursor-pointer text-left"
                        onClick={() => toggleChapter(idx)}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "flex-none size-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-2xs transition-colors",
                              isExpanded ? "bg-[#6C4AB6] text-white" : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {chapter.chapter_number}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm sm:text-base font-semibold leading-tight truncate",
                                isExpanded ? "text-[#6C4AB6]" : "text-slate-800"
                              )}
                            >
                              {chapter.title}
                            </p>
                            {!isExpanded && chapter.summary && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {chapter.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                            {isExpanded ? "Hide" : "Read"}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-[#6C4AB6]" />
                          ) : (
                            <ChevronRight className="size-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Chapter Body Content */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-slate-100 bg-white">
                          {chapter.summary && (
                            <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200/70 p-3">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6C4AB6] mb-1">
                                Chapter Summary
                              </span>
                              <p
                                className={cn(
                                  "text-slate-600 italic leading-relaxed",
                                  fontSize === "sm" && "text-xs",
                                  fontSize === "base" && "text-xs sm:text-sm",
                                  fontSize === "lg" && "text-sm"
                                )}
                              >
                                {chapter.summary}
                              </p>
                            </div>
                          )}

                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Academic Study Notes & Excerpt
                          </span>
                          <p
                            className={cn(
                              "text-slate-800 leading-[1.85] font-serif",
                              fontSize === "sm" && "text-xs",
                              fontSize === "base" && "text-sm sm:text-base",
                              fontSize === "lg" && "text-base sm:text-lg"
                            )}
                          >
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
                  {book.description || "This title is available on library shelves."}
                </p>
              </div>
            )}
          </section>

          {/* Book Details Footer in Reading View */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center space-y-1">
            <p className="text-xs text-slate-600 font-medium">
              You are reading the official preview & study guide for{" "}
              <span className="font-semibold text-slate-900">{book.title}</span>.
            </p>
            {book.isbn && (
              <p className="text-[11px] font-mono text-slate-400">
                Official Catalog ISBN: {book.isbn}
              </p>
            )}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToTop}
                className="text-xs text-slate-600 hover:text-[#6C4AB6] border-slate-200"
              >
                <ArrowUp className="size-3 mr-1" /> Back to Top
              </Button>
            </div>
          </div>
        </div>

        {/* ── 4. FOOTER (Fixed, never scrolls) ── */}
        <div className="flex-none px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-[#FCFBF8] flex items-center justify-between gap-3 shadow-xs">
          <p className="text-xs text-slate-500 hidden sm:block">
            Smart-Shelf Library Study Guide • Scroll freely through chapters
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-4 cursor-pointer"
            >
              <X className="size-3.5 mr-1.5" /> Close Reader
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
