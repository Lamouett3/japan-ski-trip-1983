<?php
// Simple PHP mail() handler for contact form — works on shared hosts (e.g., IONOS)
// Configure these values to match your domain and recipient.

const EMAIL_TO = 'no-reply@japanskitrip.fr'; // Recipient where messages are sent
const EMAIL_FROM = 'no-reply@japanskitrip.fr'; // Must be an address on your domain (for SPF/DMARC)
const SUBJECT_PREFIX = 'Contact — Japan Ski Trip';

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
  exit;
}

// Honeypot (bot trap) — ignore if filled
$gotcha = isset($_POST['_gotcha']) ? trim((string)$_POST['_gotcha']) : '';
if ($gotcha !== '') {
  // Pretend success to not encourage bots
  echo json_encode(['ok' => true]);
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
$lines[] = str_repeat('-', 32);
$lines[] = $message;
$lines[] = str_repeat('-', 32);
$lines[] = 'Meta: IP=' . ($_SERVER['REMOTE_ADDR'] ?? 'n/a') . ' UA=' . ($_SERVER['HTTP_USER_AGENT'] ?? 'n/a') . ' Lang=' . $langHint;
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

// Send
$ok = @mail(EMAIL_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
}
