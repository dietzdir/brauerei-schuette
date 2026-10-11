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
            <ShieldCheck className="size-3.5" />
            Rechtliche Angaben
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-primary">Impressum</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) / ehemals TMG
          </p>
        </div>

        {/* Dienstanbieter */}
        <section className="space-y-3">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Diensteanbieter</h2>
          <div className="p-5 bg-card rounded-none border border-border space-y-2 text-sm leading-relaxed shadow-xs">
            <p className="font-bold text-base text-primary">Handwerksbrauerei SCHÜTTE</p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-accent" />
              Zum Siekweg 2, 39343 Rottmersleben, Deutschland
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Inhaber:</strong> Andreas Schütte
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="space-y-3">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Kontakt</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-4 bg-card rounded-none border border-border space-y-1 shadow-xs">
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="size-3.5 text-accent" /> Telefon
              </span>
              <p className="font-bold text-foreground">+49 (0) 152 2278 0564</p>
            </div>
            <div className="p-4 bg-card rounded-none border border-border space-y-1 shadow-xs">
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="size-3.5 text-accent" /> E-Mail
              </span>
              <p className="font-bold text-foreground">info@rottmersleber-brauerei.de</p>
            </div>
          </div>
        </section>

        {/* Hosting */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Hosting & Technische Bereitstellung</h2>
          <p>
            Diese Webanwendung wird gehostet bei <strong className="text-foreground">Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, USA) über ein globales Content Delivery Network (CDN) sowie unter Nutzung von <strong className="text-foreground">Google Firebase</strong> (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) für Authentifizierung und Datenbankdienste.
          </p>
        </section>

        {/* Click & Reserve */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Besonderer Hinweis zum Vertriebsmodell (Click & Reserve)</h2>
          <p>
            Über dieses Online-Angebot werden Waren ausschließlich zur unverbindlichen Reservierung mit Selbstabholung angeboten (Click & Reserve). Ein Kaufvertrag kommt nicht über die Website zustande, sondern wird erst bei der Übergabe und Bezahlung der Ware vor Ort in den Räumlichkeiten der Brauerei geschlossen.
          </p>
        </section>

        {/* Streitbeilegung */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline font-bold hover:text-primary"
            >
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        {/* Urheberrecht */}
        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl uppercase tracking-wider text-primary">Urheberrecht und Bildnachweise</h2>
          <p>
            Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>
      </div>
    </div>
  );
}
