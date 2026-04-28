# IFL Landing Page

Page d'atterrissage statique pour télécharger l'APK IFL.

## URL Live

https://ifl-landing.pages.dev

## Déploiement

```bash
cd ifl_landing
wrangler pages deploy . --project-name=ifl-landing --branch=main
```

## Structure

- `index.html` - Page principale avec QR code et bouton APK
- `logo.png` - Logo IFL
- `_headers` - Configuration headers Cloudflare Pages
- `app/ifl-latest.apk` - APK Android (à uploader)

## Mise à jour de l'APK

```bash
cp /path/to/new-ifl.apk ifl_landing/app/ifl-latest.apk
cd ifl_landing
wrangler pages deploy . --project-name=ifl-landing --branch=main
```
