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
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 rounded-none border-[#c8d3d5] bg-white text-xs font-bold uppercase tracking-wider text-[#0f4851] hover:bg-[#eeeeee]">
            <ArrowLeft className="size-4 text-[#00A8BC]" />
            Zurück zum Shop
          </Button>
        </Link>

        <div className="space-y-2 border-b border-[#c8d3d5] pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#00A8BC] text-white text-xs font-bold uppercase tracking-widest">
            <Lock className="size-3.5" />
            Datenschutz & Privatsphäre
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-[#0f4851]">Datenschutzerklärung</h1>
          <p className="text-[#505c5f] text-xs uppercase tracking-wider font-semibold">
            Informationen über die Erhebung und Verarbeitung Ihrer personenbezogenen Daten gemäß Art. 13 DSGVO
          </p>
        </div>

        {/* 1. Datenschutz auf einen Blick */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1c1c]">Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1c1c]">Datenerfassung auf dieser Website</h3>
          <p>
            <strong className="text-[#1a1c1c]">Wer ist verantwortlich für die Datenerfassung?</strong><br />
            Die Datenverarbeitung erfolgt durch den Websitebetreiber:
          </p>
          <div className="p-5 bg-white rounded-none border border-[#c8d3d5] space-y-1 text-[#1a1c1c] shadow-xs">
            <p className="font-bold text-base text-[#0f4851]">Handwerksbrauerei SCHÜTTE</p>
            <p className="text-sm text-[#505c5f]">Inhaber: Andreas Schütte</p>
            <p className="text-sm text-[#505c5f]">Zum Siekweg 2, 39343 Rottmersleben</p>
            <p className="text-sm text-[#505c5f]">Telefon: +49 (0) 152 2278 0564</p>
            <p className="text-sm text-[#505c5f]">E-Mail: info@rottmersleber-brauerei.de</p>
          </div>
          <p>
            <strong className="text-[#1a1c1c]">Wie erfassen wir Ihre Daten?</strong><br />
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. Name, E-Mail-Adresse und Telefonnummer bei einer Vorbestellung/Reservierung oder bei der Registrierung eines Kundenkontos).
            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst (z. B. Internetbrowser, Betriebssystem, IP-Adresse oder Uhrzeit des Seitenaufrufs).
          </p>
        </section>

        {/* 2. Hosting */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">2. Hosting & Content Delivery Network</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1c1c]">Vercel</h3>
          <p>
            Wir hosten unsere Website bei <strong className="text-[#1a1c1c]">Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA (nachfolgend „Vercel“).
          </p>
          <p>
            Wenn Sie unsere Website besuchen, erfasst Vercel verschiedene Logfiles inklusive Ihrer IP-Adresse, um die Auslieferung und Sicherheit der Website zu gewährleisten. Die Verwendung von Vercel erfolgt auf Grundlage von <strong className="text-[#1a1c1c]">Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse an einer schnellen, sicheren und zuverlässigen Bereitstellung unseres Online-Angebots).
          </p>
          <p>
            Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework gestützt. Details finden Sie in der Datenschutzerklärung von Vercel:{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00A8BC] underline font-bold"
            >
              https://vercel.com/legal/privacy-policy
            </a>.
          </p>
        </section>

        {/* 3. Vorbestellung & Kundenkonto */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">3. Click & Reserve Vorbestellungen & Kundenkonto</h2>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1c1c]">Click & Reserve Reservierungen</h3>
          <p>
            Bei der Reservierung von Waren erfassen wir Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer sowie ggf. Firmenname und Anschrift. Diese Daten werden ausschließlich zur Vorbereitung der Abholung, für Rückfragen und zur Zusendung der Reservierungsbestätigung verarbeitet. Rechtsgrundlage ist <strong className="text-[#1a1c1c]">Art. 6 Abs. 1 lit. b DSGVO</strong> (vorvertragliche Maßnahmen).
          </p>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1c1c]">Firebase Authentication & Cloud Firestore</h3>
          <p>
            Für das Kundenkonto und die Echtzeit-Synchronisation der Bestellhistorie nutzen wir <strong className="text-[#1a1c1c]">Google Firebase</strong> (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Bei der Anmeldung mit Google oder E-Mail/Passwort werden die Authentifizierungsdaten sicher über Firebase verwaltet.
          </p>
          <p>
            Rechtsgrundlage ist <strong className="text-[#1a1c1c]">Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung zur Bereitstellung des Kundenkontos) sowie <strong className="text-[#1a1c1c]">Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung bei optionaler Kontonutzung). Sie können Ihr Kundenkonto jederzeit eigenständig im Profilmenü unwiderruflich löschen.
          </p>
        </section>

        {/* 4. Cookies & Tracking */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">4. Cookies & Lokale Speicherung (§ 25 TDDDG)</h2>
          <p>
            Unsere Website verwendet <strong className="text-[#1a1c1c]">ausschließlich technisch notwendige Cookies</strong> und lokale Speicherfunktionen (LocalStorage/SessionStorage), die für die grundlegenden Funktionen des Shops zwingend erforderlich sind (z. B. Speicherung der aktiven Nutzersitzung und Zwischenspeicherung des Warenkorbs).
          </p>
          <p>
            Es werden <strong className="text-[#1a1c1c]">keine Analyse-Tools (wie Google Analytics), keine Marketing-Cookies und keine Werbe-Tracker</strong> eingesetzt. Die Speicherung erfolgt auf Grundlage von <strong className="text-[#1a1c1c]">§ 25 Abs. 2 Nr. 2 TDDDG</strong>.
          </p>
        </section>

        {/* 5. Betroffenenrechte */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">5. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht auf unentgeltliche <strong className="text-[#1a1c1c]">Auskunft (Art. 15 DSGVO)</strong> über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf <strong className="text-[#1a1c1c]">Berichtigung (Art. 16 DSGVO)</strong>, <strong className="text-[#1a1c1c]">Löschung (Art. 17 DSGVO)</strong>, <strong className="text-[#1a1c1c]">Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong> und <strong className="text-[#1a1c1c]">Datenübertragbarkeit (Art. 20 DSGVO)</strong>.
          </p>
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter <strong className="text-[#1a1c1c]">info@rottmersleber-brauerei.de</strong> an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu (Landesbeauftragter für den Datenschutz Sachsen-Anhalt).
          </p>
        </section>
      </div>
    </div>
  );
}
