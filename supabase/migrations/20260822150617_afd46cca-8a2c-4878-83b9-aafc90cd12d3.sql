CREATE TYPE public.app_role AS ENUM ('librarian', 'student');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'librarian'));

CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  isbn TEXT,
  description TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT ON public.books TO anon;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books public read" ON public.books FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "librarian insert books" ON public.books FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "librarian update books" ON public.books FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'librarian')) WITH CHECK (public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "librarian delete books" ON public.books FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'librarian'));

CREATE TABLE public.issued_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + 14),
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'issued'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issued_books TO authenticated;
GRANT ALL ON public.issued_books TO service_role;
ALTER TABLE public.issued_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues read" ON public.issued_books FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "issues insert" ON public.issued_books FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "issues update" ON public.issued_books FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'librarian'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'librarian'));
CREATE POLICY "librarian delete issues" ON public.issued_books FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'librarian'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role','student') = 'librarian'
    THEN 'librarian'::public.app_role ELSE 'student'::public.app_role END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.issue_book(_book_id UUID)
RETURNS public.issued_books LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rec public.issued_books;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.issued_books WHERE book_id = _book_id AND user_id = _uid AND status = 'issued') THEN
    RAISE EXCEPTION 'You already have this book issued';
  END IF;
  UPDATE public.books SET available_copies = available_copies - 1
    WHERE id = _book_id AND available_copies > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'No copies available'; END IF;
  INSERT INTO public.issued_books (book_id, user_id) VALUES (_book_id, _uid) RETURNING * INTO _rec;
  RETURN _rec;
END;
$$;

CREATE OR REPLACE FUNCTION public.return_book(_issue_id UUID)
RETURNS public.issued_books LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rec public.issued_books;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.issued_books SET returned_at = now(), status = 'returned'
    WHERE id = _issue_id AND status = 'issued'
      AND (user_id = _uid OR public.has_role(_uid, 'librarian'))
    RETURNING * INTO _rec;
  IF _rec.id IS NULL THEN RAISE EXCEPTION 'Issue record not found'; END IF;
  UPDATE public.books SET available_copies = LEAST(available_copies + 1, total_copies) WHERE id = _rec.book_id;
  RETURN _rec;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_book(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(UUID) TO authenticated;

INSERT INTO public.books (title, author, category, isbn, description, total_copies, available_copies) VALUES
('Introduction to Algorithms','Thomas H. Cormen','Computer Science','9780262046305','The definitive reference on algorithms and data structures.',4,4),
('Clean Code','Robert C. Martin','Computer Science','9780132350884','A handbook of agile software craftsmanship.',3,3),
('The Pragmatic Programmer','Andrew Hunt','Computer Science','9780201616224','Your journey to mastery, 20th anniversary edition.',2,2),
('Sapiens: A Brief History of Humankind','Yuval Noah Harari','History','9780062316097','A sweeping history of our species.',5,5),
('A Brief History of Time','Stephen Hawking','Science','9780553380163','From the Big Bang to black holes.',3,3),
('The Selfish Gene','Richard Dawkins','Science','9780198788607','A gene-centred view of evolution.',2,2),
('Pride and Prejudice','Jane Austen','Literature','9780141439518','A classic novel of manners.',4,4),
('One Hundred Years of Solitude','Gabriel Garcia Marquez','Literature','9780060883287','The multi-generational story of the Buendia family.',2,2),
('Principles of Economics','N. Gregory Mankiw','Economics','9780357038314','A standard introduction to modern economics.',3,3),
('Organic Chemistry','Paula Yurkanis Bruice','Chemistry','9780134042282','Core concepts of organic chemistry for undergraduates.',3,3),
('Fundamentals of Physics','David Halliday','Physics','9781118230718','Comprehensive undergraduate physics text.',4,4),
('Thinking, Fast and Slow','Daniel Kahneman','Psychology','9780374533557','How two systems drive the way we think.',3,3);