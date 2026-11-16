-- Smart-Shelf LMS - Add readable content, chapter breakdowns, and sample text
-- Adds preview_text and chapters JSONB columns to the public.books table.

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS preview_text TEXT,
ADD COLUMN IF NOT EXISTS chapters JSONB;

COMMENT ON COLUMN public.books.preview_text IS 'Full academic reading sample or introductory text for in-app reader';
COMMENT ON COLUMN public.books.chapters IS 'JSON array of structured chapters with titles, summaries, and excerpt passages';

-- Create an index to support fast full-text searching across preview texts
CREATE INDEX IF NOT EXISTS idx_books_preview_text_search ON public.books USING gin(to_tsvector('english', coalesce(preview_text, '')));
