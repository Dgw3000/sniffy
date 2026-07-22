# Sniffy

Satirische Offline-App mit diesem Ablauf:

1. Personenzahl wählen
2. Optional Namen für die lokale Rangliste eingeben
3. Pro Person Geschlecht, Gewicht, Größe und Alter eintragen
4. Automatische Spaßnamen erhalten
5. Erfunden berechnete Linienlängen in Zentimetern anzeigen
6. Für jede Linie nacheinander Countdown und Schneeschieber-Animation abspielen
7. Lokale Top-3-Rangliste für die aktuelle Woche oder den aktuellen Monat öffnen

Nur freiwillig eingegebene Namen werden zusammen mit den addierten Zentimeterwerten lokal auf dem Gerät gespeichert. Es gibt keinen Server und keine Netzwerkübertragung.

Die Berechnung ist absichtlich erfunden und liefert weder Dosierungen noch Verträglichkeits- oder Risikoangaben.

## Start als Web-App

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.
