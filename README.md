# Sniffy

Sniffy ist eine vollständig offline funktionierende, satirische Party-App für Android und den Browser. Aus freiwillig eingegebenen Personendaten entstehen ausschließlich fiktive Zentimeterwerte, Spaßnamen, animierte Countdowns und eine lokale Top-3-Rangliste.

> **Reine Satire:** Die angezeigten Werte besitzen keine medizinische, pharmakologische oder dosierungsbezogene Bedeutung. Sniffy berechnet keine Stoffmenge, Verträglichkeit oder Konsumempfehlung.

## Download

- Projektseite: https://dgw3000.github.io/sniffy/
- Stabile APK-Adresse: https://dgw3000.github.io/sniffy/download/Sniffy.apk
- Browser-Demo: https://dgw3000.github.io/sniffy/demo/

## Technische Daten

- Paketname: `de.dgw3000.sniffy`
- Version: `1.2.1`
- Android: ab Android 6 (`minSdk 23`)
- Zielversion: Android 16 / API 36
- Netzwerkberechtigung: keine
- Sonstige Android-Berechtigungen: keine
- Speicherung: ausschließlich lokal auf dem Gerät
- SHA-256: `7ccaf9857a96a326dab618cb640bffb43de0a58035b77451f06a49d2fca99ba4`

## Repository-Struktur

- `android/` – minimale Android-WebView-Hülle, Ressourcen und Smali-Quelltext
- `web/` – eigenständig startbare Offline-Web-App/PWA
- `docs/` – statische GitHub-Pages-Downloadseite inklusive Browser-Demo
- `fastlane/` – deutsche und englische App-Metadaten
- `fdroid/` – vorbereitete F-Droid-Metadatenvorlage

## Lokale Browser-Version starten

```bash
cd web
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## APK prüfen

```bash
sha256sum -c SHA256SUMS
```

## Datenschutz

Sniffy nutzt keine Werbung, kein Tracking, keine Analyse-SDKs und keine Cloud-Dienste. Namen, Aliase, Zentimeterwerte und Ranglisten verbleiben lokal. Details stehen in [PRIVACY.md](PRIVACY.md).

## Veröffentlichung

Die statische Website wird durch `.github/workflows/pages.yml` aus `docs/` bereitgestellt. Einmalig muss im Repository unter **Settings → Pages → Source** die Option **GitHub Actions** ausgewählt werden.

## Lizenz

GPL-3.0-only. Siehe [LICENSE](LICENSE).

Copyright © 2026 Dgw3000
