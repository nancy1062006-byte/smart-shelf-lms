import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  X,
  BookmarkCheck,
  Tag,
  User,
  ArrowUp,
  Sparkles,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  BookA,
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

type ThemeMode = "paper" | "clean" | "night";

export function BookReader({ open, onClose, book }: BookReaderProps) {
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [theme, setTheme] = useState<ThemeMode>("paper");
  const [readingProgress, setReadingProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock background body scroll when reader is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setReadingProgress(0);
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Track reading progress on scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const progress = Math.min(100, Math.round((el.scrollTop / totalHeight) * 100));
      setReadingProgress(progress);
    }
  };

  // Close on Escape key
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Theme configuration
  const themeStyles = {
    paper: {
      modalBg: "bg-[#FAF7F2]",
      headerBg: "bg-[#F3EFE6]/90 border-[#E8E2D5]",
      contentBg: "bg-[#FAF7F2]",
      textPrimary: "text-[#2B2724]",
      textMuted: "text-[#6E675F]",
      divider: "border-[#E8E2D5]",
      cardBg: "bg-[#F3EFE6] border-[#E5DFD1]",
      chapterTag: "bg-[#EFE9DC] text-[#7A5B3E]",
    },
    clean: {
      modalBg: "bg-white",
      headerBg: "bg-slate-50/90 border-slate-200",
      contentBg: "bg-white",
      textPrimary: "text-slate-900",
      textMuted: "text-slate-600",
      divider: "border-slate-200",
      cardBg: "bg-slate-50 border-slate-200",
      chapterTag: "bg-purple-50 text-[#6C4AB6]",
    },
    night: {
      modalBg: "bg-[#181E29]",
      headerBg: "bg-[#131720]/95 border-[#283244]",
      contentBg: "bg-[#181E29]",
      textPrimary: "text-[#E6EDF3]",
      textMuted: "text-[#94A3B8]",
      divider: "border-[#283244]",
      cardBg: "bg-[#1F2737] border-[#2E3B52]",
      chapterTag: "bg-[#2D214E] text-[#C4B5FD]",
    },
  }[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Immersive Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main E-Reader Book Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Book Reader: ${book.title}`}
        className={cn(
          "relative z-10 flex flex-col w-full max-w-4xl h-[90vh] max-h-[920px] min-h-[500px]",
          "rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-200",
          themeStyles.modalBg,
          theme === "night" ? "border-slate-800" : "border-stone-300/80"
        )}
      >
        {/* ── Reading Progress Bar at very top edge ── */}
        <div className="h-1 w-full bg-slate-200/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6C4AB6] via-[#8B5CF6] to-[#15803D] transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* ── 1. TOP HEADER & READER TOOLBAR (Fixed) ── */}
        <header
          className={cn(
            "flex-none border-b px-5 sm:px-8 py-3.5 transition-colors duration-150",
            themeStyles.headerBg
          )}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Book Meta Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4AB6] to-[#8B5CF6] text-white shadow-xs shrink-0">
                <BookOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4AB6] bg-purple-100/70 px-2 py-0.5 rounded-full">
                    {book.category}
                  </span>
                  <span className={cn("text-[11px] font-mono", themeStyles.textMuted)}>
                    {book.isbn ? `ISBN ${book.isbn.slice(-6)}` : "Catalog Edition"}
                  </span>
                </div>
                <h2
                  className={cn(
                    "font-display text-sm sm:text-base font-bold leading-tight truncate mt-0.5",
                    themeStyles.textPrimary
                  )}
                >
                  {book.title}
                </h2>
              </div>
            </div>

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Font Size Selector */}
              <div
                className={cn(
                  "hidden sm:flex items-center border rounded-lg overflow-hidden shadow-2xs",
                  theme === "night" ? "border-slate-700 bg-slate-800" : "border-stone-200 bg-white"
                )}
              >
                <button
                  type="button"
                  onClick={() => setFontSize("sm")}
                  title="Small text"
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
                    fontSize === "sm"
                      ? "bg-[#6C4AB6] text-white"
                      : themeStyles.textMuted
                  )}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("base")}
                  title="Default text"
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold border-x transition-colors cursor-pointer",
                    theme === "night" ? "border-slate-700" : "border-stone-200",
                    fontSize === "base"
                      ? "bg-[#6C4AB6] text-white"
                      : themeStyles.textMuted
                  )}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("lg")}
                  title="Large text"
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
                    fontSize === "lg"
                      ? "bg-[#6C4AB6] text-white"
                      : themeStyles.textMuted
                  )}
                >
                  A+
                </button>
              </div>

              {/* Theme Selector (Paper / Clean / Night) */}
              <div
                className={cn(
                  "flex items-center border rounded-lg p-0.5 shadow-2xs",
                  theme === "night" ? "border-slate-700 bg-slate-800" : "border-stone-200 bg-white"
                )}
              >
                <button
                  type="button"
                  onClick={() => setTheme("paper")}
                  title="Warm Paper Mode"
                  className={cn(
                    "px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1",
                    theme === "paper" ? "bg-[#EDE6D8] text-stone-900 font-bold shadow-2xs" : themeStyles.textMuted
                  )}
                >
                  <BookA className="size-3.5" />
                  <span className="hidden md:inline text-[11px]">Paper</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("clean")}
                  title="Clean White Mode"
                  className={cn(
                    "px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1",
                    theme === "clean" ? "bg-white text-slate-900 font-bold shadow-2xs" : themeStyles.textMuted
                  )}
                >
                  <Sun className="size-3.5" />
                  <span className="hidden md:inline text-[11px]">Clean</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("night")}
                  title="Dark Focus Mode"
                  className={cn(
                    "px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1",
                    theme === "night" ? "bg-slate-700 text-white font-bold shadow-2xs" : themeStyles.textMuted
                  )}
                >
                  <Moon className="size-3.5" />
                  <span className="hidden md:inline text-[11px]">Dark</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-lg border transition-colors cursor-pointer",
                  theme === "night"
                    ? "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                    : "border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60"
                )}
                aria-label="Close reader"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Quick-Jump Section Navigation Bar */}
          <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <span className={cn("text-[11px] font-semibold shrink-0 uppercase tracking-wider", themeStyles.textMuted)}>
              Jump to:
            </span>
            <button
              type="button"
              onClick={() => scrollToSection("section-overview")}
              className={cn(
                "shrink-0 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-all hover:scale-105 cursor-pointer",
                theme === "night"
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400"
                  : "bg-white/80 border-stone-200 text-stone-700 hover:text-[#6C4AB6] hover:border-[#6C4AB6]"
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-takeaways")}
              className={cn(
                "shrink-0 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-all hover:scale-105 cursor-pointer",
                theme === "night"
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400"
                  : "bg-white/80 border-stone-200 text-stone-700 hover:text-[#6C4AB6] hover:border-[#6C4AB6]"
              )}
            >
              Key Themes
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-reading")}
              className={cn(
                "shrink-0 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-all hover:scale-105 cursor-pointer",
                theme === "night"
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400"
                  : "bg-white/80 border-stone-200 text-stone-700 hover:text-[#6C4AB6] hover:border-[#6C4AB6]"
              )}
            >
              Reading Sample
            </button>
            {content?.chapters?.map((ch, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToSection(`chapter-${idx + 1}`)}
                className={cn(
                  "shrink-0 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-all hover:scale-105 cursor-pointer",
                  theme === "night"
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-purple-400"
                    : "bg-white/80 border-stone-200 text-stone-700 hover:text-[#6C4AB6] hover:border-[#6C4AB6]"
                )}
              >
                Ch {ch.chapter_number}
              </button>
            ))}
          </div>
        </header>

        {/* ── 2. CONTINUOUS FULL-HEIGHT READING PANE (The Real Book Flow) ── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 min-h-0 w-full overflow-y-auto scroll-smooth overscroll-contain",
            "focus:outline-none transition-colors duration-150"
          )}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: theme === "night" ? "#334155 #0F172A" : "#CBD5E1 transparent",
          }}
          tabIndex={0}
        >
          {/* Centered Book Page Column with generous physical book gutters/margins */}
          <article className="max-w-3xl mx-auto px-6 sm:px-12 md:px-16 py-10 sm:py-14 space-y-12">
            
            {/* ── Book Frontispiece / Title Section ── */}
            <header className="text-center border-b pb-10 space-y-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#6C4AB6] bg-purple-100/60">
                <Sparkles className="size-3.5" /> Smart-Shelf Academic Edition
              </div>

              <h1
                className={cn(
                  "font-display font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.2]",
                  themeStyles.textPrimary
                )}
              >
                {book.title}
              </h1>

              <p className={cn("text-base sm:text-lg font-serif italic", themeStyles.textMuted)}>
                by <span className="font-semibold not-italic">{book.author}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
                <Badge variant="outline" className="font-semibold px-3 py-0.5 border-purple-300/60 text-[#6C4AB6] bg-purple-50/50">
                  {book.category}
                </Badge>
                <span className={themeStyles.textMuted}>•</span>
                <span className={cn("font-medium", themeStyles.textMuted)}>
                  {book.available_copies > 0
                    ? `${book.available_copies} of ${book.total_copies} Copies Available`
                    : "Currently on Loan"}
                </span>
                {book.isbn && (
                  <>
                    <span className={themeStyles.textMuted}>•</span>
                    <span className={cn("font-mono", themeStyles.textMuted)}>ISBN: {book.isbn}</span>
                  </>
                )}
              </div>
            </header>

            {/* ── Section: Preface & Overview ── */}
            <section id="section-overview" className="scroll-mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold uppercase tracking-widest text-[#6C4AB6]")}>
                  Introduction
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
              </div>

              <h2 className={cn("font-serif text-2xl font-bold tracking-tight", themeStyles.textPrimary)}>
                About this Work
              </h2>

              <div
                className={cn(
                  "font-serif leading-[1.85] text-justify",
                  fontSize === "sm" && "text-sm",
                  fontSize === "base" && "text-base sm:text-lg",
                  fontSize === "lg" && "text-lg sm:text-xl",
                  themeStyles.textPrimary
                )}
              >
                <p className="first-letter:float-left first-letter:text-5xl first-letter:pr-3 first-letter:font-bold first-letter:font-serif first-letter:text-[#6C4AB6]">
                  {content?.summary || book.description || "A central undergraduate reference volume."}
                </p>
              </div>
            </section>

            {/* ── Section: Key Learning Takeaways ── */}
            {content?.key_takeaways && content.key_takeaways.length > 0 && (
              <section id="section-takeaways" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-bold uppercase tracking-widest text-[#6C4AB6]")}>
                    Synthesis
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
                </div>

                <h2 className={cn("font-serif text-2xl font-bold tracking-tight", themeStyles.textPrimary)}>
                  Key Themes & Academic Takeaways
                </h2>

                <div className="space-y-3 pt-1">
                  {content.key_takeaways.map((point, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl p-4 border transition-colors flex items-start gap-3.5",
                        themeStyles.cardBg
                      )}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C4AB6] to-[#8B5CF6] text-white text-xs font-bold shadow-2xs">
                        {i + 1}
                      </span>
                      <p
                        className={cn(
                          "leading-relaxed font-serif",
                          fontSize === "sm" && "text-xs",
                          fontSize === "base" && "text-sm sm:text-base",
                          fontSize === "lg" && "text-base sm:text-lg",
                          themeStyles.textPrimary
                        )}
                      >
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section: Reading Sample ── */}
            {content?.preview_text && (
              <section id="section-reading" className="scroll-mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-bold uppercase tracking-widest text-[#6C4AB6]")}>
                    Excerpt
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
                </div>

                <h2 className={cn("font-serif text-2xl font-bold tracking-tight", themeStyles.textPrimary)}>
                  Curriculum Reading Passage
                </h2>

                <div
                  className={cn(
                    "font-serif leading-[1.9] space-y-4 text-justify",
                    fontSize === "sm" && "text-sm",
                    fontSize === "base" && "text-base sm:text-lg",
                    fontSize === "lg" && "text-lg sm:text-xl",
                    themeStyles.textPrimary
                  )}
                >
                  {content.preview_text.split("\n\n").map((para, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* ── Visual Flourish Divider ── */}
            <div className="py-4 flex items-center justify-center gap-3 text-[#6C4AB6]/60">
              <span className="h-px w-16 bg-[#6C4AB6]/30" />
              <span className="text-sm font-serif tracking-widest">❖  ❖  ❖</span>
              <span className="h-px w-16 bg-[#6C4AB6]/30" />
            </div>

            {/* ── Section: Full Continuous Chapters ── */}
            <section className="space-y-14">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#6C4AB6]">
                  Complete Study Guide
                </span>
                <h2 className={cn("font-serif text-2xl sm:text-3xl font-bold", themeStyles.textPrimary)}>
                  Chapter-by-Chapter Curriculum
                </h2>
                <p className={cn("text-xs sm:text-sm font-serif italic", themeStyles.textMuted)}>
                  All {content?.chapters?.length || 3} chapters flow continuously below for uninterrupted study.
                </p>
              </div>

              {content?.chapters && content.chapters.length > 0 ? (
                content.chapters.map((chapter, idx) => (
                  <section
                    key={idx}
                    id={`chapter-${chapter.chapter_number}`}
                    className="scroll-mt-8 pt-6 border-t space-y-5"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    {/* Chapter Header */}
                    <div className="text-center space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#6C4AB6]">
                        — Chapter {chapter.chapter_number} —
                      </span>
                      <h3
                        className={cn(
                          "font-serif text-2xl sm:text-3xl font-bold leading-tight",
                          themeStyles.textPrimary
                        )}
                      >
                        {chapter.title}
                      </h3>
                    </div>

                    {/* Chapter Summary Blockquote */}
                    {chapter.summary && (
                      <div
                        className={cn(
                          "rounded-xl p-4 sm:p-5 border-l-4 border-l-[#6C4AB6] italic font-serif",
                          themeStyles.cardBg
                        )}
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6C4AB6] not-italic mb-1">
                          Chapter Summary
                        </span>
                        <p
                          className={cn(
                            "leading-relaxed",
                            fontSize === "sm" && "text-xs",
                            fontSize === "base" && "text-sm sm:text-base",
                            fontSize === "lg" && "text-base",
                            themeStyles.textMuted
                          )}
                        >
                          "{chapter.summary}"
                        </p>
                      </div>
                    )}

                    {/* Chapter Prose Study Text */}
                    <div
                      className={cn(
                        "font-serif leading-[1.9] text-justify space-y-4 pt-2",
                        fontSize === "sm" && "text-sm",
                        fontSize === "base" && "text-base sm:text-lg",
                        fontSize === "lg" && "text-lg sm:text-xl",
                        themeStyles.textPrimary
                      )}
                    >
                      <p>{chapter.content}</p>
                    </div>

                    {/* Small chapter end flourish */}
                    <div className="pt-4 flex justify-center text-xs text-stone-300">
                      <span>• • •</span>
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <BookOpen className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">Chapter study guide available in the library stacks.</p>
                </div>
              )}
            </section>

            {/* ── Book Colophon & Back Matter ── */}
            <footer
              className="pt-10 pb-6 border-t text-center space-y-3"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            >
              <p className={cn("text-xs font-serif italic", themeStyles.textMuted)}>
                — End of Reading Preview —
              </p>
              <p className={cn("text-xs", themeStyles.textMuted)}>
                Smart-Shelf College Library System • Curated for Academic Study & Reference
              </p>
              <div className="pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToTop}
                  className={cn(
                    "text-xs font-medium cursor-pointer shadow-2xs",
                    theme === "night" ? "border-slate-700 text-slate-300" : "border-stone-300 text-stone-700"
                  )}
                >
                  <ArrowUp className="size-3.5 mr-1.5" /> Back to Top
                </Button>
              </div>
            </footer>
          </article>
        </div>

        {/* ── 3. BOTTOM FOOTER BAR (Fixed) ── */}
        <footer
          className={cn(
            "flex-none border-t px-5 sm:px-8 py-3 flex items-center justify-between text-xs transition-colors duration-150",
            themeStyles.headerBg
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", themeStyles.textMuted)}>Reading Progress:</span>
            <span className="font-bold text-[#6C4AB6]">{readingProgress}%</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className={cn(
                "text-xs font-semibold px-4 cursor-pointer",
                theme === "night"
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-stone-300 text-stone-700 hover:bg-stone-200/60"
              )}
            >
              <X className="size-3.5 mr-1" /> Close Book
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
