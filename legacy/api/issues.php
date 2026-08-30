<?php
/**
 * Smart-Shelf — issue / return workflow.
 *   POST ?action=issue   { book_id }
 *   POST ?action=return  { issue_id }
 *   GET  ?action=mine
 *   GET  ?action=all      (librarian)
 *   GET  ?action=stats    (librarian)
 *   GET  ?action=members  (librarian)
 */

require __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$data   = body();

switch ($action) {

    case 'issue':
        $user    = require_login();
        $book_id = (int) ($data['book_id'] ?? 0);
        if ($book_id <= 0) {
            fail('A book id is required.');
        }
        try {
            $stmt = db()->prepare('CALL issue_book(?, ?)');
            $stmt->execute([$user['id'], $book_id]);
            json_out(['ok' => true, 'due_in_days' => LOAN_DAYS]);
        } catch (PDOException $e) {
            fail($e->errorInfo[2] ?? 'Could not issue this book.');
        }
        // no break — json_out/fail exit

    case 'return':
        $user     = require_login();
        $issue_id = (int) ($data['issue_id'] ?? 0);
        try {
            $stmt = db()->prepare('CALL return_book(?, ?, ?)');
            $stmt->execute([$issue_id, $user['id'], $user['role'] === 'librarian' ? 1 : 0]);
            json_out(['ok' => true]);
        } catch (PDOException $e) {
            fail($e->errorInfo[2] ?? 'Could not return this book.');
        }

    case 'mine':
        $user = require_login();
        $stmt = db()->prepare(
            'SELECT ib.*, b.title, b.author, b.category,
                    DATEDIFF(ib.due_date, CURRENT_DATE) AS days_left
               FROM issued_books ib
               JOIN books b ON b.id = ib.book_id
              WHERE ib.user_id = ?
              ORDER BY ib.status ASC, ib.due_date ASC'
        );
        $stmt->execute([$user['id']]);
        json_out(['loans' => $stmt->fetchAll()]);

    case 'all':
        require_librarian();
        $rows = db()->query(
            'SELECT ib.*, b.title, b.author, u.full_name, u.email,
                    DATEDIFF(ib.due_date, CURRENT_DATE) AS days_left
               FROM issued_books ib
               JOIN books b ON b.id = ib.book_id
               JOIN users u ON u.id = ib.user_id
              ORDER BY ib.status ASC, ib.due_date ASC'
        )->fetchAll();
        json_out(['loans' => $rows]);

    case 'members':
        require_librarian();
        $rows = db()->query(
            "SELECT u.id, u.full_name, u.email, u.role, u.created_at,
                    SUM(CASE WHEN ib.status = 'issued' THEN 1 ELSE 0 END) AS active_loans
               FROM users u
               LEFT JOIN issued_books ib ON ib.user_id = u.id
              GROUP BY u.id
              ORDER BY u.created_at DESC"
        )->fetchAll();
        json_out(['members' => $rows]);

    case 'stats':
        require_librarian();
        $stats = db()->query(
            "SELECT
               (SELECT COUNT(*) FROM books)                                     AS titles,
               (SELECT IFNULL(SUM(total_copies), 0)     FROM books)             AS total_copies,
               (SELECT IFNULL(SUM(available_copies), 0) FROM books)             AS available_copies,
               (SELECT COUNT(*) FROM issued_books WHERE status = 'issued')      AS active_loans,
               (SELECT COUNT(*) FROM overdue_loans)                             AS overdue,
               (SELECT COUNT(*) FROM users)                                     AS members"
        )->fetch();
        json_out(['stats' => $stats]);

    default:
        fail('Unknown action.', 404);
}
