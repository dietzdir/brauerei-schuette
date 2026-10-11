import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Database, Server, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Datenschutzerklärung | Handwerksbrauerei Schütte",
  description: "Datenschutzerklärung nach DSGVO und TDDDG der Handwerksbrauerei Schütte.",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 rounded-none border-border bg-card text-xs font-bold uppercase tracking-wider text-primary hover:bg-muted">
            <ArrowLeft className="size-4 text-accent" />
            Zurück zum Shop
          </Button>
        </Link>

        <div className="space-y-2 border-b border-border pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-accent text-white text-xs font-bold uppercase tracking-widest">
            <Lock className="size-3.5" />
            Datenschutz & Privatsphäre
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-primary">Datenschutzerklärung</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Informationen über die Erhebung und Verarbeitung Ihrer personenbezogenen Daten gemäß Art. 13 DSGVO
          </p>
        </div>

        {/* 1. Datenschutz auf einen Blick */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Datenerfassung auf dieser Website</h3>
          <p>
            <strong className="text-foreground">Wer ist verantwortlich für die Datenerfassung?</strong><br />
            Die Datenverarbeitung erfolgt durch den Websitebetreiber:
          </p>
          <div className="p-5 bg-card rounded-none border border-border space-y-1 text-foreground shadow-xs">
            <p className="font-bold text-base text-primary">Handwerksbrauerei SCHÜTTE</p>
            <p className="text-sm text-muted-foreground">Inhaber: Andreas Schütte</p>
            <p className="text-sm text-muted-foreground">Zum Siekweg 2, 39343 Rottmersleben</p>
            <p className="text-sm text-muted-foreground">Telefon: +49 (0) 152 2278 0564</p>
            <p className="text-sm text-muted-foreground">E-Mail: info@rottmersleber-brauerei.de</p>
          </div>
          <p>
            <strong className="text-foreground">Wie erfassen wir Ihre Daten?</strong><br />
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. Name, E-Mail-Adresse und Telefonnummer bei einer Vorbestellung/Reservierung oder bei der Registrierung eines Kundenkontos).
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst (z. B. Internetbrowser, Betriebssystem, IP-Adresse oder Uhrzeit des Seitenaufrufs).
          </p>
        </section>

        {/* 2. Hosting */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">2. Hosting & Content Delivery Network</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Vercel</h3>
          <p>
            Wir hosten unsere Website bei <strong className="text-foreground">Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA (nachfolgend „Vercel“).
          </p>
          <p>
            Wenn Sie unsere Website besuchen, erfasst Vercel verschiedene Logfiles inklusive Ihrer IP-Adresse, um die Auslieferung und Sicherheit der Website zu gewährleisten. Die Verwendung von Vercel erfolgt auf Grundlage von <strong className="text-foreground">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse an einer schnellen, sicheren und zuverlässigen Bereitstellung unseres Online-Angebots).
          </p>
          <p>
            Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework gestützt. Details finden Sie in der Datenschutzerklärung von Vercel:{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline font-bold hover:text-primary"
            >
              https://vercel.com/legal/privacy-policy
            </a>.
          </p>
        </section>

        {/* 3. Vorbestellung & Kundenkonto */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">3. Click & Reserve Vorbestellungen & Kundenkonto</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Click & Reserve Reservierungen</h3>
          <p>
            Bei der Reservierung von Waren erfassen wir Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer sowie ggf. Firmenname und Anschrift. Diese Daten werden ausschließlich zur Vorbereitung der Abholung, für Rückfragen und zur Zusendung der Reservierungsbestätigung verarbeitet. Rechtsgrundlage ist <strong className="text-foreground">Art. 6 Abs. 1 lit. b DSGVO</strong> (vorvertragliche Maßnahmen).
          </p>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Firebase Authentication & Cloud Firestore</h3>
          <p>
            Für das Kundenkonto und die Echtzeit-Synchronisation der Bestellhistorie nutzen wir <strong className="text-foreground">Google Firebase</strong> (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Bei der Anmeldung mit Google oder E-Mail/Passwort werden die Authentifizierungsdaten sicher über Firebase verwaltet.
          </p>
          <p>
            Rechtsgrundlage ist <strong className="text-foreground">Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung zur Bereitstellung des Kundenkontos) sowie <strong className="text-foreground">Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung bei optionaler Kontonutzung). Sie können Ihr Kundenkonto jederzeit eigenständig im Profilmenü unwiderruflich löschen.
          </p>
        </section>

        {/* 4. Cookies & Tracking */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">4. Cookies & Lokale Speicherung (§ 25 TDDDG)</h2>
          <p>
            Unsere Website verwendet <strong className="text-foreground">ausschließlich technisch notwendige Cookies</strong> und lokale Speicherfunktionen (LocalStorage/SessionStorage), die für die grundlegenden Funktionen des Shops zwingend erforderlich sind (z. B. Speicherung der aktiven Nutzersitzung und Zwischenspeicherung des Warenkorbs).
          </p>
          <p>
            Es werden <strong className="text-foreground">keine Analyse-Tools (wie Google Analytics), keine Marketing-Cookies und keine Werbe-Tracker</strong> eingesetzt. Die Speicherung erfolgt auf Grundlage von <strong className="text-foreground">§ 25 Abs. 2 Nr. 2 TDDDG</strong>.
          </p>
        </section>

        {/* 5. Betroffenenrechte */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">5. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht auf unentgeltliche <strong className="text-foreground">Auskunft (Art. 15 DSGVO)</strong> über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf <strong className="text-foreground">Berichtigung (Art. 16 DSGVO)</strong>, <strong className="text-foreground">Löschung (Art. 17 DSGVO)</strong>, <strong className="text-foreground">Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong> und <strong className="text-foreground">Datenübertragbarkeit (Art. 20 DSGVO)</strong>.
          </p>
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter <strong className="text-foreground">info@rottmersleber-brauerei.de</strong> an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu (Landesbeauftragter für den Datenschutz Sachsen-Anhalt).
          </p>
        </section>
      </div>
    </div>
  );
}
