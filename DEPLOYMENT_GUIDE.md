# 🚀 GUIDE DE DÉPLOIEMENT

## ✅ Avant de Déployer en Production

### 1. Tester Localement

```bash
# Démarrer serveur local
cd /Users/driss/Desktop/Jay/japan_site
php -S localhost:8000
# ou
python -m http.server 8000

# Visiter http://localhost:8000
```

### 2. Vérifier Tous les Fichiers

```bash
# Fichiers modifiés
✅ .htaccess                (CSP, cache headers)
✅ contact.php              (rate-limiting)
✅ index.html               (meta tags, alt-text)
✅ robots.txt               (créé)
✅ sitemap.xml              (créé)
✅ package.json             (créé)
✅ minify.sh                (créé)

# Vérifier présence
ls -la .htaccess contact.php robots.txt sitemap.xml package.json minify.sh
```

### 3. Tester Formulaire Contact

```bash
# Test locale (POST)
curl -X POST http://localhost:8000/contact.php \
  -d "name=Test&email=test@example.com&message=Test message&subject=info"

# Réponse attendue: {"ok":true} ou {"error":"..."}
```

### 4. Vérifier GZIP & Headers

```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:8000/
# Vérifier: Content-Encoding: gzip
# Vérifier: X-Frame-Options, CSP headers
```

### 5. Minifier avant Prod (Optionnel)

```bash
# Installer dépendances
npm install

# Minifier CSS & JS
npm run build

# Vérifier réduction
du -h dist/
# Comparer avec fichiers originaux
```

---

## 📤 Déployer sur Production

### Avec Shared Host (IONOS, OVH, etc.)

1. **Via FTP/SFTP**
   ```bash
   # Uploader tous les fichiers
   sftp user@japanskitrip.fr
   > put .htaccess
   > put contact.php
   > put robots.txt
   > put sitemap.xml
   > put index.html
   > put programme.html
   > put style.css (ou dist/style.min.css)
   > put script.js (ou dist/script.min.js)
   > mget images/*
   > mget video/*
   > mget i18n/*
   ```

2. **Vérifier Permissions**
   ```bash
   # .htaccess doit être executable
   chmod 644 .htaccess
   
   # contact.php doit avoir write access (pour .rate_limit)
   chmod 755 data/
   
   # Autres fichiers
   chmod 644 robots.txt sitemap.xml
   chmod 644 index.html programme.html
   ```

### Avec Vercel / Netlify

1. **Vercel** (simple pour static)
   ```bash
   # Clone repository
   git clone https://github.com/Lamouett3/japan-ski-trip-1983.git
   
   # Deploy
   vercel
   
   # Ou connecter GitHub → auto-deploy
   ```

2. **Netlify** (supporte PHP server-side)
   ```bash
   # Connect GitHub
   # Select repository
   # Deploy
   ```

---

## 🔍 Vérifier après Déploiement

### 1. HTTPS & Headers
```bash
curl -I https://japanskitrip.fr/
# Vérifier:
# - HTTPS (SSL)
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - Content-Security-Policy: ...
```

### 2. robots.txt & sitemap.xml
```bash
# Vérifier accessibles
curl https://japanskitrip.fr/robots.txt
curl https://japanskitrip.fr/sitemap.xml
```

### 3. Google Search Console
```
1. Aller à https://search.google.com/search-console/
2. Ajouter property: https://japanskitrip.fr
3. Upload robots.txt & sitemap.xml
4. Attendre crawl (24-72h)
```

### 4. Lighthouse Score
```bash
# Via PageSpeed Insights
https://pagespeed.web.dev/?url=https://japanskitrip.fr

# Ou local
lighthouse https://japanskitrip.fr --output-path ./report.html
```

### 5. WAVE Accessibility
```
https://wave.webaim.org/report#/https://japanskitrip.fr
```

---

## ⚙️ Configuration Importante

### À Vérifier en Production

#### 1. **email configuration** (contact.php)
```php
// Vérifier ces valeurs correspondent à votre domaine
const EMAIL_TO = 'no-reply@japanskitrip.fr';
const EMAIL_FROM = 'no-reply@japanskitrip.fr'; // Must be on YOUR domain!
```

✅ SPF/DKIM/DMARC records configurés ? (contact provider)

#### 2. **.htaccess sur Apache**
```bash
# Vérifier mod_rewrite & mod_headers activés
# Contact provider pour activer si needed
```

#### 3. **CSP Header Strictness**
```
Actuel: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."

Si vous avez des extensions tierces (Stripe, analytics, etc.):
→ Ajouter leur domaine explicitement
→ Exemple: script-src 'self' 'unsafe-inline' https://js.stripe.com
```

#### 4. **CORS pour API Guestbook** (server.js)
```javascript
// Actuel: permissif (*)
// Pour production: remplacer par domaine spécifique
res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
```

---

## 🔐 Sécurité Post-Deploy

### Checkup Sécurité (15 min)

```bash
# 1. SSL/TLS valide?
openssl s_client -connect japanskitrip.fr:443 -servername japanskitrip.fr

# 2. Headers de sécurité?
curl -I https://japanskitrip.fr/ | grep -E "X-Frame|X-Content|CSP"

# 3. Fichiers sensibles masqués?
curl https://japanskitrip.fr/.env (doit retourner 403)
curl https://japanskitrip.fr/data/ (doit retourner 403)
curl https://japanskitrip.fr/.git/ (doit retourner 403)

# 4. Compression active?
curl -H "Accept-Encoding: gzip" -I https://japanskitrip.fr/ | grep "Content-Encoding"
```

### Monitoring Recommandé

- [**Uptime Robot**](https://uptimerobot.com/) : Alertes downtime
- [**Sentry**](https://sentry.io/) : Error tracking (optionnel)
- [**Google Search Console**](https://search.google.com/search-console/) : Crawl errors
- [**Google Analytics 4**](https://analytics.google.com/) : Visitor analytics

---

## 📋 Checklist Final

```
Avant Deploy:
☐ Tous fichiers testés localement
☐ HTTPS certificat valide
☐ .htaccess copié
☐ contact.php rate-limiting testé
☐ robots.txt & sitemap.xml présents
☐ Images optimisées (ou prêtes pour Phase 4)
☐ Email FROM config correct
☐ GZIP testée

Post Deploy:
☐ HTTPS fonctionne
☐ Headers de sécurité visibles
☐ robots.txt accessible
☐ sitemap.xml indexable
☐ Contact form fonctionne (testez email)
☐ Lighthouse score ≥ 70
☐ WAVE scan ≤ 5 errors
☐ Google Search Console property créée
☐ Uptime monitoring en place
```

---

## 🆘 Troubleshooting

### "CSP blocks my script"
→ Vérifier .htaccess Content-Security-Policy (ligne 22)
→ Ajouter domaine si script externe: `script-src 'self' 'unsafe-inline' https://example.com`

### "Contact form doesn't send email"
→ Vérifier EMAIL_TO & EMAIL_FROM dans contact.php
→ Test: `mail()` fonctionne ? (contact provider)
→ Vérifier SPF/DKIM records

### "Rate-limiting rejette même premiers envois"
→ Vérifier permissions sur ./data/ (755)
→ Vérifier IP détectée correctement (logs)
→ Réinitialiser: `rm data/.rate_limit`

### "Images ne chargent pas"
→ Vérifier chemins (relatifs vs absolus)
→ Vérifier permissions (644)
→ Test: `curl https://japanskitrip.fr/images/file.jpg`

---

## 📞 Support & Documentation

Voir aussi:
- `IMPLEMENTATION_RESUME.md` — Résumé complet changements
- `AUDIT_PHASE2.md` — Audit accessibilité
- `.htaccess` — Commentaires détaillés
- `contact.php` — Inline documentation

---

**🎉 DÉPLOIEMENT PRÊT ! Bonne chance !**
