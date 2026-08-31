#!/usr/bin/env python3
"""
Smart-Shelf — Python reporting utility.

Connects directly to the MySQL database and prints library statistics,
an overdue-books report, and the most borrowed titles. Useful as the
"Python" component of the project (analytics / batch jobs).

Setup:
    pip install mysql-connector-python
Run:
    python report.py
    python report.py --overdue-csv overdue.csv
"""

import argparse
import csv
import sys

try:
    import mysql.connector
except ImportError:  # pragma: no cover
    sys.exit("Missing dependency. Run:  pip install mysql-connector-python")

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "",
    "database": "smartshelf",
}


def connect():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        sys.exit(f"Could not connect to MySQL: {err}")


def rule(title):
    print(f"\n{title}\n" + "-" * len(title))


def summary(cur):
    cur.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM books)                                AS titles,
          (SELECT IFNULL(SUM(total_copies), 0) FROM books)            AS total_copies,
          (SELECT IFNULL(SUM(available_copies), 0) FROM books)        AS available,
          (SELECT COUNT(*) FROM issued_books WHERE status = 'issued') AS active_loans,
          (SELECT COUNT(*) FROM overdue_loans)                        AS overdue,
          (SELECT COUNT(*) FROM users)                                AS members
        """
    )
    row = cur.fetchone()
    rule("Library summary")
    for key, value in row.items():
        print(f"{key.replace('_', ' ').title():<18} {value}")


def overdue(cur):
    cur.execute(
        "SELECT full_name, email, title, due_date, days_overdue "
        "FROM overdue_loans ORDER BY days_overdue DESC"
    )
    rows = cur.fetchall()
    rule(f"Overdue books ({len(rows)})")
    if not rows:
        print("Nothing overdue. Well done.")
    for r in rows:
        print(f"{r['days_overdue']:>4}d  {r['title'][:38]:<40} {r['full_name']} <{r['email']}>")
    return rows


def popular(cur, limit=5):
    cur.execute(
        """
        SELECT b.title, b.author, COUNT(ib.id) AS times_borrowed
          FROM books b
          JOIN issued_books ib ON ib.book_id = b.id
         GROUP BY b.id
         ORDER BY times_borrowed DESC, b.title
         LIMIT %s
        """,
        (limit,),
    )
    rows = cur.fetchall()
    rule(f"Top {limit} most borrowed")
    if not rows:
        print("No loans recorded yet.")
    for i, r in enumerate(rows, 1):
        print(f"{i}. {r['title']} — {r['author']}  ({r['times_borrowed']}x)")


def category_breakdown(cur):
    cur.execute(
        "SELECT category, COUNT(*) AS titles, SUM(total_copies) AS copies "
        "FROM books GROUP BY category ORDER BY titles DESC"
    )
    rule("Inventory by category")
    for r in cur.fetchall():
        print(f"{r['category']:<20} {r['titles']:>3} titles   {r['copies']:>3} copies")


def main():
    parser = argparse.ArgumentParser(description="Smart-Shelf library report")
    parser.add_argument("--overdue-csv", help="write the overdue list to a CSV file")
    args = parser.parse_args()

    conn = connect()
    cur = conn.cursor(dictionary=True)

    print("=" * 46)
    print("  SMART-SHELF  ·  Library Management Report")
    print("=" * 46)

    summary(cur)
    category_breakdown(cur)
    rows = overdue(cur)
    popular(cur)

    if args.overdue_csv and rows:
        with open(args.overdue_csv, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        print(f"\nOverdue CSV written to {args.overdue_csv}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
