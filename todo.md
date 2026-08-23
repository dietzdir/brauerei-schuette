# Brauerei Schütte - Optimierungs-Backlog

Hier sind die abgeleiteten Verbesserungen als ausführbare Prompts für KI-Agenten formuliert. Jeder Task ist so geschnitten, dass er als eigenständige Aufgabe abgearbeitet werden kann.

- [x] **Task 1: Firestore Field-Whitelisting (Sicherheit)**
  **Prompt:** "Nutze den Skill `firebase-security-rules-auditor`, um die `firestore.rules` um striktes `hasOnly`-Field-Whitelisting zu erweitern. Stelle bei allen schreibenden Zugriffen (create/update für z.B. users und orders) sicher, dass Clients ausschließlich die explizit erlaubten Felder schreiben können, um Injection von fremden Feldern zu verhindern. Behalte alle bestehenden Validierungen bei."

- [x] **Task 2: Startseite als Server Component & Instant Shell (Performanz)**
  **Prompt:** "Nutze den Skill `next-cache-components-adoption`, um `src/app/page.tsx` von einer globalen Client Component zu einer Server Component umzubauen. Isoliere die Realtime-Logik (z.B. `subscribeStoreSettings`) und interaktive Drawer-States in separierte Client-Komponenten, die idealerweise in `Suspense`-Boundaries gewrappt sind, sodass der statische Großteil der Seite als Instant-Shell ausgeliefert wird."

- [x] **Task 3: Micro-Animationen ergänzen (UX/UI)**
  **Prompt:** "Nutze die Skills `find-animation-opportunities` und `improve-animations`, um gezielt visuelles Feedback zu ergänzen: Implementiere einen visuellen Bounce-Effekt für das Cart-Badge im Header, wenn Artikel in den Warenkorb gelegt werden. Füge außerdem sanfte Layout-Übergänge für Statusänderungen (z.B. von 'pending' zu 'ready') in der `CompletedOrdersList` im Admin-Bereich hinzu."

- [x] **Task 4: Konsistente Toast-Notifications im Admin (Code-Hygiene)**
  **Prompt:** "Konsultiere den Skill `ask-sonner` und überarbeite `src/components/admin/OpeningHoursManager.tsx`. Entferne die dortige lokale Error/Success-State-Logik (`successMessage`, `error`) und ersetze sie global durch die `toast.success()` / `toast.error()` Funktionen von Sonner. Ziel ist eine 100%ige Konsistenz beim User-Feedback im gesamten Admin-Bereich."

- [x] **Task 5: Accessibility & Keyboard-Navigation (A11y)**
  **Prompt:** "Verwende den Skill `web-design-guidelines` für ein Accessibility-Update. Überprüfe alle interaktiven Elemente (insbesondere die Mengen-Stepper in `ProductCard` und `CartDrawer`) auf semantisch korrekte `aria-labels`. Ergänze außerdem gut sichtbare Keyboard-Focus-Rings (z.B. `focus-visible:ring-...`), um eine barrierefreie Tastaturnavigation im gesamten Shop zu gewährleisten."

- [x] **Task 6: Mobiler Dialog-Container & Responsive Full-Width (Mobile Ergonomie)**
  **Prompt:** "Nutze die Skills `emil-design-eng` und `ui-ux-pro-max`, um den Produkt- und Mietartikel-Bearbeitungsdialog im `CatalogManager` für mobile Viewports zu optimieren. Auf Mobilgeräten (`< sm`) soll der Dialog die volle Bildschirmbreite nutzen (100% Width / Sheet-Pattern) mit fixierter Kopfzeile (Titel + Schließen-Button) und fixierter Fußzeile ('Abbrechen' / 'Speichern'), anstatt als starres, abgeschnittenes Desktop-Modal zu schweben."

- [x] **Task 7: Status-Toggle & Top-Banner Überarbeitung (UI-Polish & Scannbarkeit)**
  **Prompt:** "Überarbeite die Status-Box ('Artikel im Shop anzeigen / Aktiv') ganz oben im Produkteditor. Löse das gequetschte 3-Spalten-Layout auf: Platziere die Checkbox/den Switch sauber linksbündig neben dem Haupttitel ('Artikel im Shop aktiv') und setze den erklärenden Hilfetext ('Wenn deaktiviert, ist der Artikel für Kunden im Shop unsichtbar...') darunter über die volle Breite, um unschöne Wortumbrüche zu beseitigen."

- [x] **Task 8: Responsive Form-Grids & Textarea-Fixes (Typografie & Touch-Targets)**
  **Prompt:** "Nutze den Skill `web-design-guidelines`: Wandle die starren 2-Spalten-Grids ('Kategorie / Badge' sowie 'Alkoholgehalt / Farbe') auf Mobilgeräten in ein 1-Spalten-Layout (`grid-cols-1 sm:grid-cols-2`) um, damit Dropdowns und Textfelder ausreichend Platz haben. Behebe das Abschneiden der obersten Zeile im Beschreibungsfeld (`Textarea` mit sauberem Padding, `leading-relaxed` und `min-h-[100px]`). Vergrößere alle Touch-Targets (insb. die KI-Wasserzeichen-Checkbox) auf mindestens 44x44px Klickfläche."

- [x] **Task 9: Logische Sektionierung & Formular-Hierarchie (UX & Struktur)**
  **Prompt:** "Strukturiere das Produkt-Bearbeitungsformular in 3 klar abgegrenzte visuelle Sektionen ('1. Basisdaten & Kategorie', '2. LMIV & Produktdetails', '3. Medien & Produktbild') mit dezenten Trennlinien und Zwischenüberschriften. Stelle sicher, dass die Aktions-Buttons ('Änderungen speichern' / 'Abbrechen') in einer fixierten Leiste am unteren Rand jederzeit ohne langes Scrollen erreichbar sind."

- [x] **Task 10: Mietartikel-Editor (RentalEditorSheet) Mobil-Optimierung (Admin UX)**
  **Prompt:** "Wende die Verbesserungen aus Task 6 bis 9 analog auf den Mietartikel-Editor `RentalEditorSheet` in `src/components/admin/CatalogManager.tsx` an: Entzerre das Status-Toggle-Banner, mache die Mietpreis/Kaution/Bestand-Eingaben responsive (`grid-cols-1 sm:grid-cols-3`) und sorge für fixierte Header/Footer auf kleinen Viewports."

- [x] **Task 11: Bildauswahl-Modal (ImagePickerDialog) Full-Width & Touch-Kacheln (Admin UI)**
  **Prompt:** "Optimiere den ImagePickerDialog in `src/components/admin/CatalogManager.tsx` für mobile Endgeräte: Passe den Dialog so an, dass er auf Smartphones als responsive Galerie mit optimalen 2-Spalten-Touch-Kacheln (mind. 44px Touch-Target, Bildvorschau mit sauberem Kontrast und Tastaturfokus) dargestellt wird, anstatt als starres, gequetschtes Desktop-Modal."

- [ ] **Task 12: Öffnungszeiten-Ausnahmen & Emoji-Bereinigung (Admin UI / Icon-Hygiene)**
  **Prompt:** "Konsultiere die Projektregeln und überarbeite `src/components/admin/OpeningHoursManager.tsx`: Ersetze alle rohen Emojis (`❌`, `🔄`, `⏱️`) in den Dropdown-Optionen für Ausnahmetermine durch entsprechende Icons aus `lucide-react` (`XCircle`, `CalendarSync`, `Clock`). Optimiere zudem die Uhrzeit-Eingabefelder für Mobilgeräte (`grid-cols-1 sm:grid-cols-2`), um Quetschungen auf kleinen Displays zu vermeiden."

- [ ] **Task 13: Kunden-Detailansicht & Notizenfeld (CustomerManager UX)**
  **Prompt:** "Optimiere die mobile Kunden-Detailansicht in `src/components/admin/CustomerManager.tsx`: Verbessere das Admin-Notizenfeld mit dynamischem Auto-Growing/Padding und erstelle eine strukturierte visuelle Trennung zwischen Kontaktdaten, Notizen, Bestellhistorie und dem Kunden-Löschbereich."

- [ ] **Task 14: Mobile Tastatur-Ergonomie im Auth-Modal (Auth UX)**
  **Prompt:** "Passe `src/components/auth/AuthModal.tsx` für mobile Viewports an: Stelle sicher, dass das Modal auf `< sm` als mobiles Bottom-Sheet bzw. nach oben ausgerichteter Dialog agiert, sodass bei geöffneter virtueller Smartphone-Tastatur alle Eingabefelder und Buttons barrierefrei erreichbar bleiben und nicht durch das Tastatur-Overlay abgeschnitten werden."
