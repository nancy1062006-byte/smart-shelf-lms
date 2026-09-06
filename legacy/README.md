# Smart-Shelf — Library Management System (classic stack)

A second, self-contained version of Smart-Shelf built with the languages required for the
college submission: **HTML, CSS, JavaScript (Bootstrap), PHP, MySQL and Python**.

> This folder does **not** run inside the online preview — it is meant to be downloaded and
> run on your own computer with XAMPP (or any Apache + PHP + MySQL setup).

## Folder contents

```
legacy/
├── index.html          Home page with library statistics
├── auth.html           Login + registration (student / librarian)
├── books.html          Catalog with search and category filters
├── circulation.html    Student view: issue, return, due dates, overdue
├── admin.html          Librarian dashboard: inventory, loans, members
├── assets/
│   ├── style.css       Navy academic theme (plain CSS over Bootstrap 5)
│   └── app.js          All front-end logic (vanilla JavaScript + fetch)
├── api/
│   ├── config.php      MySQL connection (PDO), sessions, helpers
│   ├── auth.php        register / login / logout / me
│   ├── books.php       list, categories, create, update, delete
│   └── issues.php      issue, return, my loans, all loans, members, stats
├── python/
│   └── report.py       Reporting tool: stats, overdue list, top borrowed, CSV export
└── schema.sql          MySQL database: tables, procedures, view, seed data
```

## Database design

| Table          | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `users`        | id, full_name, email, password_hash, role (`student` / `librarian`)  |
| `books`        | id, title, author, category, isbn, description, total/available copies |
| `issued_books` | id, user_id, book_id, issue_date, due_date, return_date, status       |

Extras:
- Stored procedures `issue_book()` and `return_book()` — both run inside a transaction with
  `SELECT ... FOR UPDATE`, so copy counts can never go negative even with simultaneous users.
- View `overdue_loans` — powers the overdue figures in the dashboard and the Python report.
- Loan period: **14 days** (constant `LOAN_DAYS` in `api/config.php`).

## Setup (XAMPP)

1. Install XAMPP and start **Apache** and **MySQL**.
2. Copy this `legacy` folder into `xampp/htdocs/` and rename it `smartshelf`.
3. Import the database — either via phpMyAdmin (Import → `schema.sql`) or the terminal:
   ```sh
   mysql -u root -p < schema.sql
   ```
4. If your MySQL user or password differs, edit the constants at the top of `api/config.php`.
5. Open <http://localhost/smartshelf/index.html>.

### Demo accounts

| Role      | Email                    | Password      |
| --------- | ------------------------ | ------------- |
| Librarian | admin@smartshelf.edu     | password123   |
| Student   | student@smartshelf.edu   | password123   |

## Running the Python report

```sh
pip install mysql-connector-python
cd python
python report.py
python report.py --overdue-csv overdue.csv
```

Prints total titles and copies, inventory by category, every overdue loan with the number of
days late, and the most borrowed books — handy as a demo slide or appendix in the report.

## Security notes (worth mentioning in the viva)

- Passwords stored with PHP `password_hash()` (bcrypt), verified with `password_verify()`.
- All SQL uses PDO prepared statements — no string concatenation, so no SQL injection.
- Role checks happen on the server (`require_login()` / `require_librarian()`), not in JavaScript.
- User-supplied text is escaped before being inserted into the page, preventing XSS.
- Issue/return logic lives in transactional stored procedures, keeping copy counts consistent.

## Deployment

Any PHP + MySQL host works: InfinityFree, 000webhost, Hostinger, or a Railway/Render container.
Upload the folder, import `schema.sql`, and update the credentials in `api/config.php`.
(Vercel and Heroku's default runtimes do not serve PHP, so a LAMP host is the simpler choice.)
