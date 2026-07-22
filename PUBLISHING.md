# Veröffentlichung auf GitHub Pages

## Einmalige Einrichtung

1. Alle Dateien dieses Pakets in das Repository `Dgw3000/sniffy` übernehmen.
2. Committen und auf `main` pushen.
3. GitHub öffnen: `Settings → Pages`.
4. Unter `Build and deployment → Source` **GitHub Actions** auswählen.
5. Den Workflow `Deploy GitHub Pages` abwarten.

Danach ist die Seite unter `https://dgw3000.github.io/sniffy/` erreichbar.

## Neue APK veröffentlichen

1. `versionCode` erhöhen und eine neue APK mit demselben privaten Signaturschlüssel bauen.
2. APK ersetzen:
   - `docs/download/Sniffy.apk`
   - zusätzlich versioniert, z. B. `docs/download/Sniffy-v1.2.2.apk`
3. SHA-256 in `SHA256SUMS`, `docs/checksums.txt`, README und Website aktualisieren.
4. Changelog ergänzen.
5. Commit, Tag und Push erstellen.

Der private Signaturschlüssel gehört niemals in das Repository.
