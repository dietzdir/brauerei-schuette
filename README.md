# 🍺 Brauerei Schütte – Click & Reserve Werksverkauf

Eine moderne Webanwendung für den regionalen Werksverkauf und die Vorbestellung („Click & Reserve“) von handwerklich gebrauten Bierspezialitäten und Fassbrausen der **Brauerei Schütte** (Rottmersleben).

---

## 📌 Über das Projekt

Kunden können frisches Bier im Kasten oder Fass (5l, 10l, 30l, 50l) unverbindlich online reservieren und vor Ort im Werksverkauf abholen und bezahlen. 

Das System setzt auf **Next.js (App Router)**, **Tailwind CSS v4**, **Base UI** und **Firebase (Auth & Firestore)**.

---

## ✨ Hauptfunktionen

### 🛒 1. Shop & Reservierung (Kundenansicht)
* **Produktkatalog & Varianten**:
  * Übersicht aller Biersorten und Erfrischungsgetränke (Fassbrause).
  * Flexible Gebindeauswahl (z. B. 0,75l Flaschen im 6er-Kasten, 5l Partyfass, 10l, 30l und 50l Fässer).
  * Automatische, transparente Pfand- und Grundpreisberechnung (konform zur PAngV und LMIV).
  * Filterung nach Kategorien und Hervorhebung von Besonderheiten durch Produkt-Badges.
* **Intelligenter Abholtermin-Datepicker**:
  * Kalenderauswahl im Checkout, die nur tatsächlich geöffnete Werksverkaufstage (reguläre Tage & Sonderöffnungstage) freigibt.
  * Nicht geöffnete Tage sind automatisch gesperrt.
  * Dynamische Anzeige der genauen Abholzeitspanne und etwaiger Hinweise (z. B. Ersatzverkaufstag) für den gewählten Tag.
* **Dynamisches Startseiten-Info-Banner**:
  * Vollautomatische Ableitung wichtiger Hinweise aus den für die nächsten 14 Tage geplanten Ausnahmetagen (z. B. *„Am Fr., 04.09.: Geschlossen (Betriebsurlaub)“* oder *„Am Sa., 05.09.: Sonderöffnung (14:00 - 17:00 Uhr)“*).
* **Click & Reserve Checkout**:
  * Unverbindliche Reservierung ohne Direktzahlung im Web (Zahlung & Altersprüfung ab 16 Jahren erfolgen bei Abholung im Laden).
  * Unterscheidung zwischen Privat- und Geschäftskunden.
  * Automatische Datenübernahme für registrierte Kunden.
* **Live-Bestellübersicht & Historie**:
  * Kunden können ihre getätigten Reservierungen und deren aktuellen Status (`Ausstehend`, `Bereit zur Abholung`, `Abgeschlossen`) in Echtzeit verfolgen.

---

### 🔐 2. Benutzer-Authentifizierung & Profile
* **Nahtlose anonyme Sitzungen**:
  * Jeder Besucher erhält sofort eine anonyme Firebase-Sitzung – Reservierungen und Warenkörbe sind sofort nutzbar.
* **Account-Upgrade**:
  * Kunden können ihre anonyme Sitzung jederzeit mit E-Mail & Passwort verknüpfen (`linkWithCredential`), ohne ihre bisherigen Reservierungen oder Warenkorbinhalte zu verlieren.
* **Profilverwaltung**:
  * Speichern von Kontaktdaten (Name, Telefonnummer, Anschrift, Kundentyp/Firma) für schnellere zukünftige Reservierungen.

---

### 🛠️ 3. Administrationsbereich (`/admin`)
* **Sicherheitsarchitektur**:
  * Zugriffsbeschränkung über Firebase Custom Claims (`admin: true`) und serverseitig verifizierte HTTP-Only Session-Cookies via Middleware.
* **Bestellverwaltung**:
  * Übersicht aller eingegangenen Reservierungen in Echtzeit.
  * Statusübergänge durchführen (`pending` ➔ `ready` ➔ `completed`).
  * Aggregierte Mengenauswertung pro Abholtermin (z. B. Gesamtanzahl benötigter 30l/50l Fässer und Flaschenkästen).
* **Katalog- & Produktverwaltung**:
  * Anlegen, Bearbeiten und Deaktivieren von Produkten.
  * Konfiguration von Varianten, Preisen (in EUR-Cent zur Vermeidung von Rundungsfehlern) und Pfandwerten.
  * Pflege von LMIV-Angaben (Alkoholgehalt, Allergene, Geschmacksnoten).
* **Öffnungszeiten & Sonderöffnungs-Manager**:
  * Pflege des regulären Werksverkaufstages (z. B. standardmäßig freitags 14:00 – 19:00 Uhr).
  * Anlegen von taggenauen Ausnahmen:
    * **Geschlossen** (z. B. Feiertage, Betriebsurlaub).
    * **Geänderte Uhrzeit** (z. B. verkürzte Öffnungszeiten).
    * **Sonderöffnungen / Ersatztage** (z. B. zusätzliche Öffnung an Samstagen oder vor Feiertagen).

---

## 🏗️ Technische Architektur & Prinzipien

1. **Sicherheit im Checkout**:
   * Der Checkout schreibt nicht direkt vom Client in Firestore, sondern läuft über eine Next.js Server Action mit dem **Firebase Admin SDK**.
   * Produktpreise und Pfandwerte werden serverseitig aus der Datenbank nachgeladen und validiert – der Client kann keine Preise manipulieren.
2. **Session-Schutz**:
   * Der `/admin`-Bereich ist über ein HttpOnly-Cookie geschützt, das serverseitig in der Next.js `middleware.ts` validiert wird.
3. **Komponenten & UI**:
   * Nutzung von `@base-ui/react` Primitives mit Tailwind CSS v4.
   * Keine verschachtelten `<button>`-Elemente oder unsaubere `asChild`-Verschachtelungen.
4. **Rechtliche Konformität (Click & Reserve in Deutschland)**:
   * Klare Trennung zwischen Online-Reservierung und Vor-Ort-Kaufvertrag (kein Fernabsatzvertrag).
   * Einhaltung der Preisangabenverordnung (Grundpreisangabe, separater Pfandausweis).
   * Altersprüfung vor Ort gem. Jugendschutzgesetz (JuSchG).

---

## 🚀 Installation & Lokale Entwicklung

### Voraussetzungen
* **Node.js**: Version 20 oder neuer
* **npm** / **pnpm** / **yarn**
* Firebase-Projekt mit aktiviertem Firestore & Authentication

### 1. Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/your-repo/brauerei-schuette.git
cd brauerei-schuette
npm install
```

### 2. Umgebungsvariablen einrichten
Erstelle eine `.env.local`-Datei im Projekt-Hauptverzeichnis mit folgenden Firebase-Zugangsdaten:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=dein_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dein_projekt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dein_projekt_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dein_projekt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=deine_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=deine_app_id

# Firebase Admin SDK (für Server Actions & Middleware)
FIREBASE_PROJECT_ID=dein_projekt_id
FIREBASE_CLIENT_EMAIL=dein_service_account@dein_projekt.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## 📂 Projektstruktur

```text
src/
├── app/
│   ├── actions/          # Next.js Server Actions (z. B. checkout.ts mit Admin SDK)
│   ├── admin/            # Geschützter Admin-Bereich (Bestellungen, Katalog, Zeiten)
│   ├── api/auth/         # Route Handler für Session-Cookie Minting / Login
│   ├── layout.tsx        # Root Layout mit Auth & Cart Context Providern
│   └── page.tsx          # Startseite & Produktkatalog
├── components/
│   ├── admin/            # Admin-Komponenten (CatalogManager, OpeningHoursManager, etc.)
│   ├── auth/             # Authentifizierungs- & Profil-Modale
│   ├── cart/             # Warenkorb-Drawer, Datepicker & Checkout-Formular
│   ├── catalog/          # Produktkarten, Gebinde-Auswahl & Filter
│   ├── layout/           # Header, Navigation & Footer
│   ├── orders/           # Bestellverfolgungs-Drawer
│   └── ui/               # Wiederverwendbare UI-Komponenten (Base UI & Tailwind)
├── lib/
│   ├── auth/             # AuthContext & Session-Handling
│   ├── cart/             # CartContext & Zustand
│   ├── firebase/         # Firebase Client & Admin SDK Initialisierung
│   ├── openingHours.ts   # Berechnungslogik für Pickup-Slots & Ausnahmetage
│   └── utils.ts          # Währungs-, Pfand- & Datumsformatierungen
├── types/
│   └── index.ts          # TypeScript Typdefinitionen (Produkte, Bestellungen, Settings)
└── middleware.ts         # Edge Middleware zur Absicherung von /admin
```

---

## 📜 Lizenz
Brauerei Schütte – Alle Rechte vorbehalten.
