<?php
/**
 * Smart-Shelf — authentication endpoints.
 *   POST ?action=register  { full_name, email, password, role }
 *   POST ?action=login     { email, password }
 *   POST ?action=logout
 *   GET  ?action=me
 */

require __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$data   = body();

switch ($action) {

    case 'register':
        $name     = trim($data['full_name'] ?? '');
        $email    = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $role     = ($data['role'] ?? 'student') === 'librarian' ? 'librarian' : 'student';

        if ($name === '' || $email === '' || strlen($password) < 6) {
            fail('Name, a valid email and a password of at least 6 characters are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('That email address is not valid.');
        }

        $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) {
            fail('An account with that email already exists.');
        }

        $stmt = db()->prepare(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), $role]);

        $_SESSION['user'] = [
            'id'        => (int) db()->lastInsertId(),
            'full_name' => $name,
            'email'     => $email,
            'role'      => $role,
        ];
        json_out(['user' => $_SESSION['user']]);

    case 'login':
        $email    = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($password, $row['password_hash'])) {
            fail('Incorrect email or password.', 401);
        }

        $_SESSION['user'] = [
            'id'        => (int) $row['id'],
            'full_name' => $row['full_name'],
            'email'     => $row['email'],
            'role'      => $row['role'],
        ];
        json_out(['user' => $_SESSION['user']]);

    case 'logout':
        session_destroy();
        json_out(['ok' => true]);

    case 'me':
        json_out(['user' => current_user()]);

    default:
        fail('Unknown action.', 404);
}
