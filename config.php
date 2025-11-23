<?php
// Site configuration — Google Reviews integration
// You can either fill these constants, or set environment variables
// GOOGLE_PLACES_KEY and GOOGLE_PLACE_ID on your host. Constants take precedence.

// Google Places API key (with Places Details enabled)
// Récupérée depuis les variables d'environnement pour éviter toute exposition dans le code
define('GOOGLE_PLACES_KEY', getenv('GOOGLE_PLACES_KEY') ?: '');

// Google Place ID of your business/listing
define('GOOGLE_PLACE_ID', getenv('GOOGLE_PLACE_ID') ?: '');

// Optional: direct fallback URL to your Google reviews/write page
// If PLACE_ID is not set or the API is unavailable, the site will use this link
define('GOOGLE_REVIEW_FALLBACK', getenv('GOOGLE_REVIEW_FALLBACK') ?: 'https://www.google.com/search?q=JAPAN+SKI+TRIP+par+Jerome+Noviant+Avis');
