# Sniffy Android source

Diese Verzeichnisstruktur enthält die minimale Android-WebView-Hülle der Version 1.2.1:

- `AndroidManifest.xml`
- `res/`
- `assets/www/`
- `smali/`

Paketname: `de.dgw3000.sniffy`

Die APK wurde ohne Netzwerkberechtigung und ohne sonstige Android-Berechtigungen erstellt. Die Web-App läuft vollständig aus lokalen Assets.

Hinweis: Diese Minimalstruktur ist noch kein reguläres Gradle-Projekt und daher noch nicht unmittelbar für einen F-Droid-Serverbuild geeignet. Für eine F-Droid-Einreichung muss sie in ein reproduzierbares Android-/Gradle-Projekt überführt werden.
