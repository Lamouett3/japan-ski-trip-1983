<?php
// Optional config file with constants
@include_once __DIR__ . '/config.php';
// Google Places Reviews proxy (PHP) — fetches latest reviews and outputs normalized JSON
// Configure your Google Places API credentials below or via environment variables.

$GOOGLE_API_KEY = getenv('GOOGLE_PLACES_KEY') ?: '';
$PLACE_ID = getenv('GOOGLE_PLACE_ID') ?: '';

// Optional: allow overriding via constants if you prefer edit-in-file
if (defined('GOOGLE_PLACES_KEY') && GOOGLE_PLACES_KEY) { $GOOGLE_API_KEY = GOOGLE_PLACES_KEY; }
if (defined('GOOGLE_PLACE_ID') && GOOGLE_PLACE_ID) { $PLACE_ID = GOOGLE_PLACE_ID; }

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if (!$GOOGLE_API_KEY || !$PLACE_ID) {
  http_response_code(501);
  echo json_encode(['error' => 'Google Places not configured']);
  exit;
}

// Choose language based on Accept-Language
$accept = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : '';
$lang = 'fr';
if ($accept) {
  $pref = strtolower(substr($accept, 0, 2));
  if (in_array($pref, ['fr','en','de','es','it','ja','nl','pt'])) $lang = $pref;
}

// Build Places Details request with reviews
$fields = urlencode('rating,user_ratings_total,reviews');
$endpoint = 'https://maps.googleapis.com/maps/api/place/details/json?place_id='
  . urlencode($PLACE_ID)
  . '&fields=' . $fields
  . '&reviews_sort=newest'
  . '&language=' . urlencode($lang)
  . '&key=' . urlencode($GOOGLE_API_KEY);

// Fetch via cURL
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
$resp = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($resp === false || $code >= 400) {
  http_response_code(502);
  echo json_encode(['error' => 'Upstream error', 'detail' => $err, 'code' => $code]);
  exit;
}

$data = json_decode($resp, true);
if (!is_array($data) || !isset($data['result'])) {
  http_response_code(502);
  echo json_encode(['error' => 'Invalid response']);
  exit;
}

$reviews = isset($data['result']['reviews']) && is_array($data['result']['reviews']) ? $data['result']['reviews'] : [];
$out = [];
foreach ($reviews as $r) {
  $out[] = [
    'name' => isset($r['author_name']) ? $r['author_name'] : 'Anonymous',
    'text' => isset($r['text']) ? $r['text'] : '',
    'stars' => isset($r['rating']) ? (int)$r['rating'] : 5,
    'time' => isset($r['time']) ? (int)$r['time'] : null,
  ];
}

header('X-Place-Id: ' . $PLACE_ID);
if (defined('GOOGLE_REVIEW_FALLBACK') && GOOGLE_REVIEW_FALLBACK) {
  header('X-Review-Fallback: ' . GOOGLE_REVIEW_FALLBACK);
}
echo json_encode($out);
?>
