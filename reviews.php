<?php
/**
 * reviews.php
 * Affiche les avis Google pour le Livre d'or
 */

@include_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600');

// Configuration
$GOOGLE_API_KEY = getenv('GOOGLE_PLACES_KEY') ?: '';
$PLACE_ID = getenv('GOOGLE_PLACE_ID') ?: '';

if (defined('GOOGLE_PLACES_KEY') && GOOGLE_PLACES_KEY) { $GOOGLE_API_KEY = GOOGLE_PLACES_KEY; }
if (defined('GOOGLE_PLACE_ID') && GOOGLE_PLACE_ID) { $PLACE_ID = GOOGLE_PLACE_ID; }

// Avis d'exemple par défaut
$fallback_reviews = [
    [
        'name' => 'Camille M.',
        'text' => 'Un séjour inoubliable : poudreuse magique et organisation parfaite ! Jérôme connaît le Japon sur le bout des doigts.',
        'stars' => 5
    ],
    [
        'name' => 'Alexandre D.',
        'text' => 'Tokyo + ski : équilibre idéal entre culture et glisse. Les adresses recommandées sont sensationnelles.',
        'stars' => 5
    ],
    [
        'name' => 'Sophie L.',
        'text' => 'Encadrement impeccable et poudreuse incroyable à Hakuba. À refaire sans hésiter !',
        'stars' => 5
    ],
    [
        'name' => 'Thomas B.',
        'text' => 'Jérôme est un guide exceptionnel avec 30 ans d\'expérience. Vraiment une belle expérience.',
        'stars' => 5
    ]
];

$reviews = $fallback_reviews;

// Essaye de récupérer les vrais avis Google si configuré
if ($GOOGLE_API_KEY && $PLACE_ID) {
    try {
        $lang = 'fr';
        $accept = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : '';
        if ($accept) {
            $pref = strtolower(substr($accept, 0, 2));
            if (in_array($pref, ['fr','en','de','es','it','ja','nl','pt'])) { $lang = $pref; }
        }
        
        $endpoint = 'https://maps.googleapis.com/maps/api/place/details/json?'
            . 'place_id=' . urlencode($PLACE_ID)
            . '&fields=rating,user_ratings_total,reviews'
            . '&reviews_sort=newest'
            . '&language=' . urlencode($lang)
            . '&key=' . urlencode($GOOGLE_API_KEY);
        
        // Test si curl est disponible
        if (function_exists('curl_init')) {
            $ch = curl_init($endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
            
            $resp = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($resp && $code === 200) {
                $data = json_decode($resp, true);
                if (isset($data['result']['reviews']) && is_array($data['result']['reviews']) && !empty($data['result']['reviews'])) {
                    $google_reviews = [];
                    foreach ($data['result']['reviews'] as $r) {
                        $google_reviews[] = [
                            'name' => $r['author_name'] ?? 'Utilisateur Google',
                            'text' => $r['text'] ?? '',
                            'stars' => (int)($r['rating'] ?? 5)
                        ];
                    }
                    if (!empty($google_reviews)) {
                        $reviews = $google_reviews;
                        header('X-Source: google');
                    }
                }
            }
        } elseif (function_exists('file_get_contents')) {
            // Fallback avec file_get_contents si curl n'est pas disponible
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 5,
                    'user_agent' => 'Mozilla/5.0'
                ]
            ]);
            $resp = @file_get_contents($endpoint, false, $context);
            if ($resp) {
                $data = json_decode($resp, true);
                if (isset($data['result']['reviews']) && is_array($data['result']['reviews']) && !empty($data['result']['reviews'])) {
                    $google_reviews = [];
                    foreach ($data['result']['reviews'] as $r) {
                        $google_reviews[] = [
                            'name' => $r['author_name'] ?? 'Utilisateur Google',
                            'text' => $r['text'] ?? '',
                            'stars' => (int)($r['rating'] ?? 5)
                        ];
                    }
                    if (!empty($google_reviews)) {
                        $reviews = $google_reviews;
                        header('X-Source: google');
                    }
                }
            }
        }
    } catch (Exception $e) {
        // En cas d'erreur, utiliser les avis par défaut
    }
}

http_response_code(200);
header('X-Source: ' . (count($reviews) > count($fallback_reviews) || $reviews[0]['name'] !== 'Camille M.' ? 'google' : 'fallback'));
echo json_encode($reviews);
?>

    
    $endpoint = 'https://maps.googleapis.com/maps/api/place/details/json?'
        . 'place_id=' . urlencode($PLACE_ID)
        . '&fields=rating,user_ratings_total,reviews'
        . '&reviews_sort=newest'
        . '&language=' . urlencode($lang)
        . '&key=' . urlencode($GOOGLE_API_KEY);
    
    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Japan Ski Trip)');
    
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($resp && $code === 200) {
        $data = json_decode($resp, true);
        if (isset($data['result']['reviews']) && is_array($data['result']['reviews'])) {
            $reviews = [];
            foreach ($data['result']['reviews'] as $r) {
                $reviews[] = [
                    'name' => $r['author_name'] ?? 'Utilisateur Google',
                    'text' => $r['text'] ?? '',
                    'stars' => (int)($r['rating'] ?? 5)
                ];
            }
            
            if (!empty($reviews)) {
                http_response_code(200);
                header('X-Place-Id: ' . $PLACE_ID);
                header('X-Review-Fallback: ' . $REVIEW_FALLBACK);
                echo json_encode($reviews);
                exit;
            }
        }
    }
}

// Fallback: utiliser les avis d'exemple
http_response_code(200);
header('X-Review-Fallback: ' . $REVIEW_FALLBACK);
echo json_encode($fallback_reviews);
?>

