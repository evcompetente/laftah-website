<?php
/* LAFTAH Experiences - brief form handler (for GoDaddy cPanel / any PHP hosting)
   Receives the brief from the website as JSON and emails it to info@laftah.me. */

const TO_EMAIL   = 'info@laftah.me';          // where briefs are delivered
const FROM_EMAIL = 'no-reply@laftah.me';      // must be an address on your own domain
const FROM_NAME  = 'LAFTAH Website';
const MAX_PER_HOUR_PER_IP = 6;                // basic abuse limit

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function done(int $code, bool $ok, string $msg = ''): void {
    http_response_code($code);
    echo json_encode(['success' => $ok, 'message' => $msg]);
    exit;
}
function clean(string $s, int $max = 200): string {           // single line, no header injection
    $s = trim(preg_replace('/[\r\n\t]+/', ' ', $s));
    return mb_substr($s, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') done(405, false, 'POST only');

$raw  = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) done(400, false, 'Bad request');

/* spam traps: honeypots must be empty */
if (!empty($data['botcheck']) || !empty($data['_gotcha'])) done(200, true, 'ok');

$name    = clean((string)($data['name'] ?? ''), 120);
$email   = clean((string)($data['email'] ?? ''), 160);
$phone   = clean((string)($data['phone'] ?? ''), 40);
$company = clean((string)($data['company'] ?? ''), 160);
$pref    = clean((string)($data['preferred_contact'] ?? ''), 30);
$lang    = clean((string)($data['language'] ?? ''), 5);
$package = clean((string)($data['package'] ?? ''), 120);
$message = mb_substr(str_replace("\r", '', (string)($data['message'] ?? '')), 0, 4000);

if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match_all('/\d/', $phone) < 7) {
    done(422, false, 'Missing details');
}

/* simple per-IP rate limit */
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$file = sys_get_temp_dir() . '/laftah_rl_' . md5($ip);
$hits = [];
if (is_file($file)) { $hits = array_filter(array_map('intval', explode(',', (string)file_get_contents($file))), fn($t) => $t > time() - 3600); }
if (count($hits) >= MAX_PER_HOUR_PER_IP) done(429, false, 'Too many requests');
$hits[] = time();
@file_put_contents($file, implode(',', $hits));

$subject = 'New LAFTAH brief - ' . ($package ?: 'Custom') . ' - ' . $name;
$body  = "New brief from the LAFTAH website\n";
$body .= "==================================\n\n";
$body .= "Name: $name\nMobile / WhatsApp: $phone\nEmail: $email\nCompany: $company\n";
$body .= "Preferred contact: $pref\nPage language: $lang\n\n";
$body .= "----------------------------------\n" . $message . "\n\n";
$body .= "----------------------------------\nSent: " . date('Y-m-d H:i:s T') . "\n";

$headers = [
    'From: ' . mb_encode_mimeheader(FROM_NAME, 'UTF-8') . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . mb_encode_mimeheader($name, 'UTF-8') . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: LAFTAH-site',
];
$sent = mail(TO_EMAIL, mb_encode_mimeheader($subject, 'UTF-8'), $body, implode("\r\n", $headers), '-f' . FROM_EMAIL);

$sent ? done(200, true, 'sent') : done(500, false, 'Mail failed');
