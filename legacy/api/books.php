<?php
/**
 * Smart-Shelf — book catalog CRUD.
 *   GET    ?action=list&q=&category=
 *   GET    ?action=categories
 *   POST   ?action=create   (librarian)
 *   POST   ?action=update   (librarian)
 *   POST   ?action=delete   (librarian)
 */

require __DIR__ . '/config.php';

$action = $_GET['action'] ?? 'list';
$data   = body();

switch ($action) {

    case 'list':
        $q        = trim($_GET['q'] ?? '');
        $category = trim($_GET['category'] ?? '');

        $sql    = 'SELECT * FROM books WHERE 1 = 1';
        $params = [];

        if ($q !== '') {
            $sql .= ' AND (title LIKE ? OR author LIKE ? OR category LIKE ?)';
            $like = '%' . $q . '%';
            array_push($params, $like, $like, $like);
        }
        if ($category !== '' && $category !== 'All') {
            $sql .= ' AND category = ?';
            $params[] = $category;
        }
        $sql .= ' ORDER BY title';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        json_out(['books' => $stmt->fetchAll()]);

    case 'categories':
        $rows = db()->query('SELECT DISTINCT category FROM books ORDER BY category')->fetchAll();
        json_out(['categories' => array_column($rows, 'category')]);

    case 'create':
        require_librarian();

        $title    = trim($data['title'] ?? '');
        $author   = trim($data['author'] ?? '');
        $category = trim($data['category'] ?? '');
        $copies   = max(1, (int) ($data['total_copies'] ?? 1));

        if ($title === '' || $author === '' || $category === '') {
            fail('Title, author and category are required.');
        }

        $stmt = db()->prepare(
            'INSERT INTO books (title, author, category, isbn, description, total_copies, available_copies)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $title,
            $author,
            $category,
            trim($data['isbn'] ?? '') ?: null,
            trim($data['description'] ?? '') ?: null,
            $copies,
            $copies,
        ]);
        json_out(['id' => (int) db()->lastInsertId()]);

    case 'update':
        require_librarian();

        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) {
            fail('A book id is required.');
        }

        $stmt = db()->prepare('SELECT * FROM books WHERE id = ?');
        $stmt->execute([$id]);
        $book = $stmt->fetch();
        if (!$book) {
            fail('Book not found.', 404);
        }

        $total  = max(1, (int) ($data['total_copies'] ?? $book['total_copies']));
        $onLoan = (int) $book['total_copies'] - (int) $book['available_copies'];
        if ($total < $onLoan) {
            fail('There are ' . $onLoan . ' copies currently on loan.');
        }

        $stmt = db()->prepare(
            'UPDATE books SET title = ?, author = ?, category = ?, isbn = ?, description = ?,
                              total_copies = ?, available_copies = ?
             WHERE id = ?'
        );
        $stmt->execute([
            trim($data['title'] ?? $book['title']),
            trim($data['author'] ?? $book['author']),
            trim($data['category'] ?? $book['category']),
            trim($data['isbn'] ?? (string) $book['isbn']) ?: null,
            trim($data['description'] ?? (string) $book['description']) ?: null,
            $total,
            $total - $onLoan,
            $id,
        ]);
        json_out(['ok' => true]);

    case 'delete':
        require_librarian();

        $id = (int) ($data['id'] ?? 0);
        $check = db()->prepare("SELECT COUNT(*) AS n FROM issued_books WHERE book_id = ? AND status = 'issued'");
        $check->execute([$id]);
        if ((int) $check->fetch()['n'] > 0) {
            fail('This book still has copies on loan.');
        }

        $stmt = db()->prepare('DELETE FROM books WHERE id = ?');
        $stmt->execute([$id]);
        json_out(['ok' => true]);

    default:
        fail('Unknown action.', 404);
}
