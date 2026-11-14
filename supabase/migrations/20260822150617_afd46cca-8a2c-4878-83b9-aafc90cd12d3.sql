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
('One Hundred Years of Solitude','Gabriel Garcia Marquez','Literature','9780060883287','The multi-generational story of the Buendia family.',2,2),
('Principles of Economics','N. Gregory Mankiw','Economics','9780357038314','A standard introduction to modern economics.',3,3),
('Thinking, Fast and Slow','Daniel Kahneman','Psychology','9780374533557','How two systems drive the way we think.',3,3),
('The Pragmatic Programmer','Andrew Hunt','Computer Science','9780201616224','Your journey to mastery, 20th anniversary edition.',2,2),
('A Brief History of Time','Stephen Hawking','Science','9780553380163','From the Big Bang to black holes.',3,2),
('Clean Code','Robert C. Martin','Computer Science','9780132350884','A handbook of agile software craftsmanship.',3,3),
('Sapiens: A Brief History of Humankind','Yuval Noah Harari','History','9780062316097','A sweeping history of our species.',5,4),
('Organic Chemistry','Paula Yurkanis Bruice','Chemistry','9780134042282','Core concepts of organic chemistry for undergraduates.',3,3),
('Pride and Prejudice','Jane Austen','Literature','9780141439518','A classic novel of manners.',4,4),
('The Selfish Gene','Richard Dawkins','Science','9780198788607','A gene-centred view of evolution.',2,2),
('Introduction to Algorithms','Thomas H. Cormen','Computer Science','9780262046305','The definitive reference on algorithms and data structures.',4,4),
('Fundamentals of Physics','David Halliday','Physics','9781118230718','Comprehensive undergraduate physics text.',4,4),
('Structure and Interpretation of Computer Programs','Harold Abelson','Computer Science','9780262510875','Structure and interpretation of computer programs with Scheme.',3,3),
('The C Programming Language','Brian W. Kernighan','Computer Science','9780131103627','The definitive guide to the C programming language.',3,3),
('Hands-On Machine Learning','Aurelien Gerone','Computer Science','9781492032649','Practical machine learning with Scikit-Learn, Keras and TensorFlow.',2,2),
('Head First Java','Kathy Sierra','Computer Science','9780596009205','A brain-friendly guide to Java and object-oriented programming.',3,3),
('Discrete Mathematics and Its Applications','Kenneth Rosen','Mathematics','9780073383095','Logic, sets, graphs and combinatorics for computer science students.',2,2),
('Introduction to Linear Algebra','Gilbert Strang','Mathematics','9780980232776','Vectors, matrices and linear transformations, explained clearly.',3,3),
('University Physics with Modern Physics','Hugh D. Young','Physics','9780321973610','Calculus-based university physics with worked examples.',2,2),
('Campbell Biology','Lisa A. Urry','Biology','9780134093413','The standard text for general biology courses.',2,2),
('1984','George Orwell','Literature','9780451524935','A dystopian novel of surveillance and totalitarian control.',4,4),
('The Great Gatsby','F. Scott Fitzgerald','Literature','9780743273565','The Jazz Age story of Jay Gatsby and the American Dream.',3,3),
('The Alchemist','Paulo Coelho','Literature','9780062315007','A shepherd boy follows his dream across the desert.',3,3),
('The Wealth of Nations','Adam Smith','Economics','9780553585971','The foundational text of classical economics.',2,2),
('The 7 Habits of Highly Effective People','Stephen R. Covey','Management','9780743269513','A principle-centered approach to personal effectiveness.',2,2),
('Atomic Habits','James Clear','Self-Help','9780735211292','Tiny changes, remarkable results: a guide to building good habits.',3,2),
('Animal Farm','George Orwell','Literature','9780452284242','A satirical allegory of revolution and power.',3,3),
('Python Crash Course','Eric Matthes','Computer Science','9781593279288','A hands-on, project-based introduction to programming with Python.',4,4),
('Man''s Search for Meaning','Viktor E. Frankl','Psychology','9780807014295','A psychiatrist experiences life in Nazi death camps and illuminates psychotherapeutic principles.',3,3),
('The Man Who Mistook His Wife for a Hat','Oliver Sacks','Psychology','9780563406983','Clinical tales of patients struggling with perceptual and intellectual neurological disorders.',3,3),
('Influence: The Psychology of Persuasion','Robert B. Cialdini','Psychology','9780061241895','Foundational work explaining why people say yes and how to apply these understandings.',4,4),
('Quiet: The Power of Introverts','Susan Cain','Psychology','9780307352156','How society undervalues introverts and the tremendous benefits they bring to a noisy world.',3,3),
('Molecular Biology of the Cell','Bruce Alberts','Biology','9780815344322','The definitive text in cell biology covering structure, function, and genetics.',3,3),
('The Origin of Species','Charles Darwin','Biology','9780451529060','The foundational work of evolutionary biology introducing the principle of natural selection.',4,4),
('The Immortal Life of Henrietta Lacks','Rebecca Skloot','Biology','9781400052189','The story of HeLa cells and their profound impact on modern medicine and bioethics.',3,3),
('Silent Spring','Rachel Carson','Biology','9780618249060','The landmark environmental science text exposing the hazards of indiscriminate pesticide use.',2,2),
('Cosmos','Carl Sagan','Science','9780345331359','The sweeping story of cosmic evolution, science, astronomy, and human civilization.',4,4),
('A Short History of Nearly Everything','Bill Bryson','Science','9780767908184','An entertaining and accessible quest to understand how the universe and life came to be.',3,3),
('The Structure of Scientific Revolutions','Thomas S. Kuhn','Science','9780262510882','A landmark study on paradigm shifts and how true scientific breakthroughs occur.',3,3),
('Chemistry: The Central Science','Theodore L. Brown','Chemistry','9780134414232','Comprehensive foundation of chemical principles, reactions, and laboratory applications.',4,4),
('Inorganic Chemistry','Gary L. Miessler','Chemistry','9780321811059','Thorough introduction to bonding theories, coordination chemistry, and organometallics.',3,3),
('Physical Chemistry','Peter Atkins','Chemistry','9780198769866','Core principles of thermodynamics, quantum mechanics, and chemical reaction kinetics.',3,3),
('The Disappearing Spoon','Sam Kean','Chemistry','9780316051644','Fascinating stories of history, human ambition, and elements across the periodic table.',3,3),
('Deep Work','Cal Newport','Self-Help','9781455586691','Rules for focused success in a distracted world and cultivating deep, uninterrupted focus.',4,4),
('Mindset: The New Psychology of Success','Carol S. Dweck','Self-Help','9780345472328','How developing a growth mindset unlocks resilience, achievement, and lifelong learning.',3,3),
('The Subtle Art of Not Giving a F*ck','Mark Manson','Self-Help','9780062457714','A counterintuitive guide to living a good life by choosing what problems are worth having.',3,3),
('Grit: The Power of Passion and Perseverance','Angela Duckworth','Self-Help','9781501111105','Why effort and persistence matter more than raw talent in reaching long-term goals.',3,3),
('Freakonomics','Steven D. Levitt & Stephen J. Dubner','Economics','9780060731335','A rogue economist explores the hidden side of everyday phenomena using economic data.',4,4),
('Capital in the Twenty-First Century','Thomas Piketty','Economics','9780674430006','A groundbreaking empirical analysis of historical wealth accumulation and inequality.',3,3),
('Basic Economics','Thomas Sowell','Economics','9780465060733','A clear, common-sense explanation of economic principles without mathematical jargon.',3,3),
('Guns, Germs, and Steel','Jared Diamond','History','9780393317558','The fates of human societies shaped by geographic and environmental advantages.',4,4),
('The Silk Roads: A New History of the World','Peter Frankopan','History','9781101912379','An expansive reassessment of world history centred on the great trade arteries of Eurasia.',3,3),
('Postwar: A History of Europe Since 1945','Tony Judt','History','9780143037750','Magisterial history of Europe''s rebuilding and identity after the devastation of World War II.',3,3),
('1491: New Revelations of the Americas Before Columbus','Charles C. Mann','History','9781400032051','Compelling archaeological evidence of thriving, sophisticated pre-Columbian societies.',3,3),
('Good to Great','Jim Collins','Management','9780066620992','Why some companies make the leap to enduring greatness and others do not.',4,4),
('The Lean Startup','Eric Ries','Management','9780307887894','How modern entrepreneurs use validated learning and rapid iteration to build products.',3,3),
('The Hard Thing About Hard Things','Ben Horowitz','Management','9780062273208','Practical insights and battle-tested advice for leading teams through crisis and uncertainty.',3,3),
('Zero to One','Peter Thiel','Management','9780804139298','How innovators create completely new paradigms rather than copying existing formulas.',4,4),
('Calculus: Early Transcendentals','James Stewart','Mathematics','9781285741550','The quintessential calculus textbook combining mathematical rigour with applications.',4,4),
('Higher Engineering Mathematics','B. S. Grewal','Mathematics','9788193328491','Comprehensive engineering mathematics with solved problems and applications.',3,3),
('Principles of Mathematical Analysis','Walter Rudin','Mathematics','9780070542358','The classic ''Baby Rudin'' introduction to real analysis, topology, and metric spaces.',2,2),
('The Feynman Lectures on Physics','Richard P. Feynman','Physics','9780465023820','The legendary physics lectures presenting mechanics, radiation, and quantum phenomena.',4,4),
('Concepts of Physics','H. C. Verma','Physics','9788177091878','Conceptual clarity and structured problem-solving across all major areas of physics.',3,3),
('Introduction to Electrodynamics','David J. Griffiths','Physics','9781108420419','Renowned undergraduate text on electrostatics, magnetostatics, and Maxwell''s equations.',3,3);
