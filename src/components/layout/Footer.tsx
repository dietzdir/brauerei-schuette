import React from "react";
import Link from "next/link";
import { Beer, ShieldCheck, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0f4851] text-[#e2e2e2] text-xs border-t border-[#174e56] mt-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-heading text-lg tracking-wider uppercase">
              <div className="size-7 rounded-none bg-[#00A8BC] text-white flex items-center justify-center">
                <Beer className="size-4" />
              </div>
              <span>Handwerksbrauerei Schütte</span>
            </div>
            <p className="text-[#f1f1f1]/90 leading-relaxed font-normal">
              Echtes Brauhandwerk aus der Börde. Höchste Qualität mit regionalen Rohstoffen und frischer Abfüllung in Flaschen und Partyfässern.
            </p>
            <p className="text-[11px] text-[#c0c8ca] uppercase tracking-wider font-semibold">
              Zum Siekweg 2 &bull; 39343 Rottmersleben
            </p>
          </div>

          {/* Col 2: Click & Reserve & JuSchG info */}
          <div className="space-y-3">
            <h4 className="font-heading text-base uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#00A8BC]" />
              Click & Reserve & Jugendschutz
            </h4>
            <ul className="space-y-2 text-[11px] text-[#e2e2e2] leading-relaxed">
              <li>
                <strong className="text-white">Unverbindliche Vorbestellung:</strong> Kein Fernabsatzvertrag. Bezahlung und verbindlicher Kaufabschluss erfolgen erst vor Ort bei der Abholung.
              </li>
              <li>
                <strong className="text-white">Jugendschutz (§ 9 JuSchG):</strong> Abgabe von Bier nur an Personen ab 16 Jahren. Gesetzliche Altersprüfung bei Abholung.
              </li>
              <li>
                <strong className="text-white">Preise & Pfand:</strong> Alle Preise inkl. MwSt., zzgl. separat ausgewiesenem Pfand. Grundpreise pro Liter sind ausgewiesen.
              </li>
            </ul>
          </div>

          {/* Col 3: Rechtliches & Kontakt */}
          <div className="space-y-3">
            <h4 className="font-heading text-base uppercase tracking-wider text-white">Rechtliches & Kontakt</h4>
            <div className="space-y-1.5">
              <div>
                <Link
                  href="/impressum"
                  className="hover:text-[#00A8BC] text-white transition-colors font-semibold underline underline-offset-4"
                >
                  Impressum (§ 5 DDG)
                </Link>
              </div>
              <div>
                <Link
                  href="/datenschutz"
                  className="hover:text-[#00A8BC] text-white transition-colors font-semibold underline underline-offset-4"
                >
                  Datenschutzerklärung (DSGVO)
                </Link>
              </div>
            </div>

            <div className="pt-2 text-[11px] space-y-1 border-t border-[#174e56] text-[#c0c8ca]">
              <p className="flex items-center gap-1.5">
                <Mail className="size-3 text-[#00A8BC]" /> info@rottmersleber-brauerei.de
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="size-3 text-[#00A8BC]" /> +49 (0) 152 2278 0564
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#174e56] text-center text-[11px] text-[#c0c8ca] flex items-center justify-center uppercase tracking-wider">
          <p>&copy; {new Date().getFullYear()} Handwerksbrauerei Schütte. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
