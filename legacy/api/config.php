<?php
/**
 * Smart-Shelf — database connection + shared helpers.
 * Edit the four constants below to match your local MySQL setup.
 */

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'smartshelf');
define('DB_USER', 'root');
define('DB_PASS', '');

define('LOAN_DAYS', 14);

session_start();

header('Content-Type: application/json; charset=utf-8');

/** @return PDO */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void
{
    json_out(['error' => $message], $status);
}

/** Read a JSON request body into an array. */
function body(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        fail('You must be signed in.', 401);
    }
    return $user;
}

function require_librarian(): array
{
    $user = require_login();
    if ($user['role'] !== 'librarian') {
        fail('Librarian access only.', 403);
    }
    return $user;
}
