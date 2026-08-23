# Brauerei Schütte - Optimierungs-Backlog

Hier sind die abgeleiteten Verbesserungen als ausführbare Prompts für KI-Agenten formuliert. Jeder Task ist so geschnitten, dass er als eigenständige Aufgabe abgearbeitet werden kann.

- [x] **Task 1: Firestore Field-Whitelisting (Sicherheit)**
  **Prompt:** "Nutze den Skill `firebase-security-rules-auditor`, um die `firestore.rules` um striktes `hasOnly`-Field-Whitelisting zu erweitern. Stelle bei allen schreibenden Zugriffen (create/update für z.B. users und orders) sicher, dass Clients ausschließlich die explizit erlaubten Felder schreiben können, um Injection von fremden Feldern zu verhindern. Behalte alle bestehenden Validierungen bei."

- [ ] **Task 2: Startseite als Server Component & Instant Shell (Performanz)**
  **Prompt:** "Nutze den Skill `next-cache-components-adoption`, um `src/app/page.tsx` von einer globalen Client Component zu einer Server Component umzubauen. Isoliere die Realtime-Logik (z.B. `subscribeStoreSettings`) und interaktive Drawer-States in separierte Client-Komponenten, die idealerweise in `Suspense`-Boundaries gewrappt sind, sodass der statische Großteil der Seite als Instant-Shell ausgeliefert wird."

- [ ] **Task 3: Micro-Animationen ergänzen (UX/UI)**
  **Prompt:** "Nutze die Skills `find-animation-opportunities` und `improve-animations`, um gezielt visuelles Feedback zu ergänzen: Implementiere einen visuellen Bounce-Effekt für das Cart-Badge im Header, wenn Artikel in den Warenkorb gelegt werden. Füge außerdem sanfte Layout-Übergänge für Statusänderungen (z.B. von 'pending' zu 'ready') in der `CompletedOrdersList` im Admin-Bereich hinzu."

- [ ] **Task 4: Konsistente Toast-Notifications im Admin (Code-Hygiene)**
  **Prompt:** "Konsultiere den Skill `ask-sonner` und überarbeite `src/components/admin/OpeningHoursManager.tsx`. Entferne die dortige lokale Error/Success-State-Logik (`successMessage`, `error`) und ersetze sie global durch die `toast.success()` / `toast.error()` Funktionen von Sonner. Ziel ist eine 100%ige Konsistenz beim User-Feedback im gesamten Admin-Bereich."

- [ ] **Task 5: Accessibility & Keyboard-Navigation (A11y)**
  **Prompt:** "Verwende den Skill `web-design-guidelines` für ein Accessibility-Update. Überprüfe alle interaktiven Elemente (insbesondere die Mengen-Stepper in `ProductCard` und `CartDrawer`) auf semantisch korrekte `aria-labels`. Ergänze außerdem gut sichtbare Keyboard-Focus-Rings (z.B. `focus-visible:ring-...`), um eine barrierefreie Tastaturnavigation im gesamten Shop zu gewährleisten."
