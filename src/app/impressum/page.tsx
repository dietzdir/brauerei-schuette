import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Impressum | Handwerksbrauerei Schütte",
  description: "Impressum und rechtliche Angaben nach § 5 DDG / TMG der Handwerksbrauerei Schütte.",
};

export default function ImpressumPage() {
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
            <ShieldCheck className="size-3.5" />
            Rechtliche Angaben
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-[#0f4851]">Impressum</h1>
          <p className="text-[#505c5f] text-xs uppercase tracking-wider font-semibold">
            Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) / ehemals TMG
          </p>
        </div>

        {/* Dienstanbieter */}
        <section className="space-y-3">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Diensteanbieter</h2>
          <div className="p-5 bg-white rounded-none border border-[#c8d3d5] space-y-2 text-sm leading-relaxed shadow-xs">
            <p className="font-bold text-base text-[#0f4851]">Handwerksbrauerei SCHÜTTE</p>
            <p className="flex items-center gap-2 text-[#505c5f]">
              <MapPin className="size-4 shrink-0 text-[#00A8BC]" />
              Zum Siekweg 2, 39343 Rottmersleben, Deutschland
            </p>
            <p className="text-[#505c5f]">
              <strong className="text-[#1a1c1c]">Inhaber:</strong> Andreas Schütte
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="space-y-3">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Kontakt</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-4 bg-white rounded-none border border-[#c8d3d5] space-y-1 shadow-xs">
              <span className="text-[11px] text-[#505c5f] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="size-3.5 text-[#00A8BC]" /> Telefon
              </span>
              <p className="font-bold text-[#1a1c1c]">+49 (0) 152 2278 0564</p>
            </div>
            <div className="p-4 bg-white rounded-none border border-[#c8d3d5] space-y-1 shadow-xs">
              <span className="text-[11px] text-[#505c5f] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="size-3.5 text-[#00A8BC]" /> E-Mail
              </span>
              <p className="font-bold text-[#1a1c1c]">info@rottmersleber-brauerei.de</p>
            </div>
          </div>
        </section>

        {/* Hosting */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Hosting & Technische Bereitstellung</h2>
          <p>
            Diese Webanwendung wird gehostet bei <strong className="text-[#1a1c1c]">Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, USA) über ein globales Content Delivery Network (CDN) sowie unter Nutzung von <strong className="text-[#1a1c1c]">Google Firebase</strong> (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) für Authentifizierung und Datenbankdienste.
          </p>
        </section>

        {/* Click & Reserve */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Besonderer Hinweis zum Vertriebsmodell (Click & Reserve)</h2>
          <p>
            Über dieses Online-Angebot werden Waren ausschließlich zur unverbindlichen Reservierung mit Selbstabholung angeboten (Click & Reserve). Ein Kaufvertrag kommt nicht über die Website zustande, sondern wird erst bei der Übergabe und Bezahlung der Ware vor Ort in den Räumlichkeiten der Brauerei geschlossen.
          </p>
        </section>

        {/* Streitbeilegung */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00A8BC] underline font-bold"
            >
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        {/* Urheberrecht */}
        <section className="space-y-3 text-sm text-[#505c5f] leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-[#0f4851]">Urheberrecht und Bildnachweise</h2>
          <p>
            Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>
      </div>
    </div>
  );
}
