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
('Introduction to Algorithms','Thomas H. Cormen','Computer Science','9780262046305','The classic reference on algorithm design and analysis.',4,4),
('Clean Code','Robert C. Martin','Computer Science','9780132350884','A handbook of agile software craftsmanship.',3,3),
('Database System Concepts','Abraham Silberschatz','Computer Science','9780078022159','Core concepts of database design and SQL.',3,3),
('Operating System Concepts','Abraham Silberschatz','Computer Science','9781118063330','Processes, memory, scheduling and file systems.',2,2),
('Computer Networks','Andrew S. Tanenbaum','Computer Science','9780132126953','Layered network architecture from physical to application.',2,2),
('Concepts of Physics','H. C. Verma','Physics','9788177091878','Conceptual physics for undergraduate students.',5,5),
('Higher Engineering Mathematics','B. S. Grewal','Mathematics','9788193328491','Engineering mathematics with worked examples.',4,4),
('Organic Chemistry','Paula Y. Bruice','Chemistry','9780134042282','Mechanistic approach to organic chemistry.',2,2),
('The Republic','Plato','Philosophy','9780140455113','Dialogue on justice and the ideal state.',3,3),
('Sapiens','Yuval Noah Harari','History','9780062316097','A brief history of humankind.',3,3),
('Principles of Economics','N. Gregory Mankiw','Economics','9781305585126','Introductory micro and macroeconomics.',2,2),
('To Kill a Mockingbird','Harper Lee','Literature','9780061120084','A novel of justice and conscience in the American South.',4,4);
