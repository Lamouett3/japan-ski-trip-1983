#!/bin/bash
# ============ Minifier CSS & JS for Production ============
# Usage: bash minify.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_DIR="${PROJECT_DIR}/dist"

echo "🔨 Starting minification process..."

# Create production directory if it doesn't exist
mkdir -p "${PROD_DIR}"

# ============ Minify CSS ============
echo "📦 Minifying CSS..."

# Install csso-cli if not present
if ! command -v csso &> /dev/null; then
  echo "  Installing csso-cli (CSS minifier)..."
  npm install -g csso-cli
fi

csso "${PROJECT_DIR}/style.css" \
  --output "${PROD_DIR}/style.min.css" \
  --restructure

echo "  ✅ CSS minified: ${PROD_DIR}/style.min.css"

# ============ Minify JavaScript ============
echo "📦 Minifying JavaScript..."

# Install terser if not present
if ! command -v terser &> /dev/null; then
  echo "  Installing terser (JS minifier)..."
  npm install -g terser
fi

terser "${PROJECT_DIR}/script.js" \
  --output "${PROD_DIR}/script.min.js" \
  --compress unused=false \
  --mangle

echo "  ✅ JavaScript minified: ${PROD_DIR}/script.min.js"

# ============ Show file size reduction ============
echo ""
echo "📊 Size Comparison:"

CSS_ORIGINAL=$(wc -c < "${PROJECT_DIR}/style.css")
CSS_MINIFIED=$(wc -c < "${PROD_DIR}/style.min.css")
CSS_REDUCTION=$(echo "scale=1; (100 * ($CSS_ORIGINAL - $CSS_MINIFIED) / $CSS_ORIGINAL)" | bc)

echo "  CSS: ${CSS_ORIGINAL} bytes → ${CSS_MINIFIED} bytes (${CSS_REDUCTION}% reduction)"

JS_ORIGINAL=$(wc -c < "${PROJECT_DIR}/script.js")
JS_MINIFIED=$(wc -c < "${PROD_DIR}/script.min.js")
JS_REDUCTION=$(echo "scale=1; (100 * ($JS_ORIGINAL - $JS_MINIFIED) / $JS_ORIGINAL)" | bc)

echo "  JS:  ${JS_ORIGINAL} bytes → ${JS_MINIFIED} bytes (${JS_REDUCTION}% reduction)"

echo ""
echo "✨ Minification complete! Files ready in: ${PROD_DIR}/"
echo ""
echo "📌 Next steps:"
echo "  1. Update index.html to reference minified files:"
echo "     <link rel=\"stylesheet\" href=\"dist/style.min.css\">"
echo "     <script src=\"dist/script.min.js\"></script>"
echo "  2. Deploy dist/ folder to production"
echo ""
