-- ============================================================
-- Smart-Shelf : Library Management System
-- MySQL schema + seed data
-- Run:  mysql -u root -p < schema.sql
-- ============================================================

DROP DATABASE IF EXISTS smartshelf;
CREATE DATABASE smartshelf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartshelf;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    email         VARCHAR(160)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('student','librarian') NOT NULL DEFAULT 'student',
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Books
-- ------------------------------------------------------------
CREATE TABLE books (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    author           VARCHAR(150) NOT NULL,
    category         VARCHAR(80)  NOT NULL,
    isbn             VARCHAR(20)  UNIQUE,
    description      TEXT,
    total_copies     INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_books_title    (title),
    INDEX idx_books_author   (author),
    INDEX idx_books_category (category),
    CONSTRAINT chk_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- IssuedBooks
-- ------------------------------------------------------------
CREATE TABLE issued_books (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT  NOT NULL,
    book_id     INT  NOT NULL,
    issue_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date    DATE NOT NULL,
    return_date DATE NULL,
    status      ENUM('issued','returned') NOT NULL DEFAULT 'issued',
    CONSTRAINT fk_issue_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_issue_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_issue_user   (user_id),
    INDEX idx_issue_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Stored procedure: issue a book (atomic)
-- ------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE issue_book(IN p_user_id INT, IN p_book_id INT)
BEGIN
    DECLARE v_available INT DEFAULT 0;
    DECLARE v_existing  INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT available_copies INTO v_available
      FROM books WHERE id = p_book_id FOR UPDATE;

    IF v_available IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
    END IF;

    IF v_available < 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No copies available';
    END IF;

    SELECT COUNT(*) INTO v_existing
      FROM issued_books
     WHERE user_id = p_user_id AND book_id = p_book_id AND status = 'issued';

    IF v_existing > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You already have this book';
    END IF;

    INSERT INTO issued_books (user_id, book_id, issue_date, due_date, status)
    VALUES (p_user_id, p_book_id, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'issued');

    UPDATE books SET available_copies = available_copies - 1 WHERE id = p_book_id;

    COMMIT;
END$$

-- ------------------------------------------------------------
-- Stored procedure: return a book (atomic)
-- ------------------------------------------------------------
CREATE PROCEDURE return_book(IN p_issue_id INT, IN p_user_id INT, IN p_is_librarian TINYINT)
BEGIN
    DECLARE v_book_id INT DEFAULT NULL;
    DECLARE v_owner   INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT book_id, user_id INTO v_book_id, v_owner
      FROM issued_books
     WHERE id = p_issue_id AND status = 'issued' FOR UPDATE;

    IF v_book_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loan not found or already returned';
    END IF;

    IF p_is_librarian = 0 AND v_owner <> p_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not your loan';
    END IF;

    UPDATE issued_books
       SET status = 'returned', return_date = CURRENT_DATE
     WHERE id = p_issue_id;

    UPDATE books SET available_copies = available_copies + 1 WHERE id = v_book_id;

    COMMIT;
END$$

DELIMITER ;

-- ------------------------------------------------------------
-- View: overdue loans (used by the admin dashboard)
-- ------------------------------------------------------------
CREATE VIEW overdue_loans AS
SELECT ib.id, u.full_name, u.email, b.title, ib.issue_date, ib.due_date,
       DATEDIFF(CURRENT_DATE, ib.due_date) AS days_overdue
  FROM issued_books ib
  JOIN users u ON u.id = ib.user_id
  JOIN books b ON b.id = ib.book_id
 WHERE ib.status = 'issued' AND ib.due_date < CURRENT_DATE;

-- ------------------------------------------------------------
-- Seed data
-- password for both demo accounts is:  password123
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Library Admin', 'admin@smartshelf.edu',   '$2y$10$e0NRzWDCbLR7Q6nqZ2sJmOTf9vBiKcnXKq9GRPXfzTz.Lp2u3G4Iu', 'librarian'),
('Demo Student',  'student@smartshelf.edu', '$2y$10$e0NRzWDCbLR7Q6nqZ2sJmOTf9vBiKcnXKq9GRPXfzTz.Lp2u3G4Iu', 'student');

INSERT INTO books (title, author, category, isbn, description, total_copies, available_copies) VALUES
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
