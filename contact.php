<?php
// ============ Contact Form Handler — Japan Ski Trip ============
// Secure PHP mail() handler with rate-limiting, validation, and sanitization.
// Works on shared hosts (e.g., IONOS).

const EMAIL_TO = 'no-reply@japanskitrip.fr'; // Recipient where messages are sent
const EMAIL_FROM = 'no-reply@japanskitrip.fr'; // Must be an address on your domain (for SPF/DMARC)
const SUBJECT_PREFIX = 'Contact — Japan Ski Trip';
const RATE_LIMIT_FILE = __DIR__ . '/data/.rate_limit';
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const RATE_LIMIT_MAX = 5; // Max 5 requests per IP per hour

// Security headers
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
  exit;
}

// ============ Rate limiting by IP (file-based) ============
function check_rate_limit($ip) {
  $file = RATE_LIMIT_FILE;
  $data = [];
  if (file_exists($file)) {
    $data = json_decode(file_get_contents($file), true) ?? [];
  }
  $now = time();
  foreach ($data as $stored_ip => $entries) {
    $data[$stored_ip] = array_filter($entries, fn($ts) => $now - $ts < RATE_LIMIT_WINDOW);
    if (empty($data[$stored_ip])) unset($data[$stored_ip]);
  }
  if (!isset($data[$ip])) $data[$ip] = [];
  if (count($data[$ip]) >= RATE_LIMIT_MAX) return false;
  $data[$ip][] = $now;
  @mkdir(dirname($file), 0755, true);
  file_put_contents($file, json_encode($data, JSON_UNESCAPED_SLASHES));
  return true;
}

// ============ Sanitization & validation ============
function sanitize_input($key, $max = 200) {
  $v = isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  $v = mb_substr($v, 0, $max, 'UTF-8');
  return $v;
}

function validate_email($email) {
  $email = trim((string)$email);
  return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : false;
}

function safe_header_value($value) {
  return str_replace(["\r", "\n"], '', (string)$value);
}

// Get client IP (handle proxies)
$client_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$client_ip = trim(explode(',', $client_ip)[0]);

// Rate limiting
if (!check_rate_limit($client_ip)) {
  http_response_code(429);
  echo json_encode(['ok' => false, 'error' => 'Too many requests. Please try again later.']);
  exit;
}

// Honeypot (bot trap)
$gotcha = sanitize_input('_gotcha');
if ($gotcha !== '') {
  echo json_encode(['ok' => true]);
  exit;
}

// ============ Get and validate fields ============
$name = sanitize_input('name', 160);
$email = validate_email($_POST['email'] ?? '');
$participants = sanitize_input('participants', 60);
$participation = sanitize_input('participation', 40);
$subjectKey = sanitize_input('subject', 40);
$period = sanitize_input('period', 120);
$message = sanitize_input('message', 4000);

if (!$name || strlen($name) < 2) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid name']);
  exit;
}

if (!$email) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid email']);
  exit;
}

if (!$message || strlen($message) < 10) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Message too short']);
  exit;
}

// Helper sanitizers
function s($key, $max = 200) {
  $v = isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v); // strip control chars
  if (strlen($v) > $max) $v = substr($v, 0, $max);
  return $v;
}

$name = s('name', 160);
$email = filter_var(isset($_POST['email']) ? $_POST['email'] : '', FILTER_VALIDATE_EMAIL);
$participants = s('participants', 60);
$participation = s('participation', 40); // solo|group (labels handled in body)
$subjectKey = s('subject', 40); // info|plan
$period = s('period', 120);
$message = s('message', 4000);

if (!$name || !$email || !$message) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
  exit;
}

// Build subject
$subjectMap = [
  'info' => 'Demande d’informations',
  'plan' => 'Organisation à date précise'
];
$subjectLabel = isset($subjectMap[$subjectKey]) ? $subjectMap[$subjectKey] : 'Contact';
$subject = SUBJECT_PREFIX . ' — ' . $subjectLabel;

// Participation label
$participationLabel = ($participation === 'group')
  ? 'Groupe déjà constitué'
  : (($participation === 'solo') ? 'Ok pour rejoindre un groupe déjà constitué.' : '');

// Detect language hint
$langHint = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 5) : '';

// Compose message (plain text)
$lines = [];
$lines[] = "Nom: {$name}";
$lines[] = "Email: {$email}";
if ($participants !== '') $lines[] = "Participants: {$participants}";
if ($participationLabel !== '') $lines[] = "Participation: {$participationLabel}";
if ($period !== '') $lines[] = "Période: {$period}";
$lines[] = "Sujet: {$subjectLabel}";
$lines[] = str_repeat('-', 40);
$lines[] = $message;
$lines[] = str_repeat('-', 40);
$lines[] = 'Meta: IP=' . $_SERVER['REMOTE_ADDR'] . ' UA=' . ($_SERVER['HTTP_USER_AGENT'] ?? 'n/a') . ' Lang=' . $langHint . ' Submitted=' . gmdate('Y-m-d H:i:s') . ' UTC';
$body = implode("\r\n", $lines);

// Headers
$from = EMAIL_FROM;
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'Content-Transfer-Encoding: 8bit';
$headers[] = 'From: ' . $from;
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();
$headers[] = 'X-Priority: 3';

// Send
$ok = @mail(EMAIL_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . $from);
if ($ok) {
  http_response_code(200);
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
}
