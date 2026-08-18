import { Order } from "@/types";
import { formatContainerType, formatPrice } from "@/lib/utils";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewText?: string;
  error?: string;
}

export function generateOrderConfirmationHtml(order: Order): string {
  const itemsSum =
    order.itemsTotalCents ??
    order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const depositSum =
    order.depositTotalCents ??
    order.items.reduce((s, i) => s + (i.depositPrice || 0) * i.quantity, 0);
  const grandTotal = order.grandTotalCents ?? itemsSum + depositSum;

  const orderRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-weight: 700; color: #0F4851; font-size: 13px;">
          ${item.productName}
          <div style="font-size: 11px; font-weight: 500; color: #505c5f; margin-top: 2px;">
            ${formatContainerType(item.variantType)}
          </div>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #0F4851; font-weight: 700; font-size: 13px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #505c5f; font-size: 13px;">
          ${formatPrice(item.unitPrice)}
          ${
            item.depositPrice
              ? `<div style="font-size: 11px; color: #00A8BC; font-weight: 600;">+ ${formatPrice(
                  item.depositPrice
                )} Pfand</div>`
              : ""
          }
        </td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 800; color: #0F4851; font-size: 13px;">
          ${formatPrice(item.unitPrice * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservierungsbestätigung - Brauerei Schütte</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f7; margin: 0; padding: 24px 12px; color: #1a1c1c;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #c8d3d5; border-radius: 0px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 72, 81, 0.08);">
      
      <!-- Brand Header -->
      <div style="background-color: #0F4851; padding: 32px 24px; text-align: center; color: #ffffff; border-bottom: 4px solid #00A8BC;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; color: #ffffff;">
          HANDWERKSBRAUEREI SCHÜTTE
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #00A8BC;">
          Frisch gebraut in Rottmersleben
        </p>
      </div>

      <!-- Main Body Content -->
      <div style="padding: 32px 24px;">
        
        <!-- Greeting & Confirmation -->
        <div style="margin-bottom: 24px; text-align: left;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #f0f7f8; color: #0F4851; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid #00A8BC; margin-bottom: 12px;">
            Reservierungsbestätigung
          </span>
          <h2 style="font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0 0 8px 0; color: #0F4851; letter-spacing: 0.02em;">
            Vielen Dank für Ihre Vorbestellung!
          </h2>
          <p style="margin: 0; font-size: 14px; color: #505c5f; line-height: 1.6;">
            Hallo <strong>${order.customerName}</strong>,<br>
            wir haben Ihren Auftrag erhalten und stellen Ihre frischen Bierspezialitäten zur Abholung bereit.
          </p>
        </div>

        <!-- Prominent Pickup Box (if pickupDate exists) -->
        ${
          order.pickupDate
            ? `
        <div style="background-color: #f0f7f8; border: 1px solid #00A8BC; border-left: 5px solid #00A8BC; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #505c5f; margin-bottom: 4px;">
            Gewählter Abholtermin:
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #0F4851;">
            ${order.pickupDate} ${
                order.pickupTime
                  ? `<span style="font-size: 14px; font-weight: 600; color: #00A8BC;">(${order.pickupTime})</span>`
                  : ""
              }
          </div>
        </div>`
            : ""
        }

        <!-- Order Details Meta Grid -->
        <div style="background-color: #f9fafb; border: 1px solid #c8d3d5; padding: 16px; margin-bottom: 24px; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #505c5f; padding: 5px 0; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Reservierungsnummer:</td>
              <td style="text-align: right; font-weight: 800; font-family: monospace; color: #0F4851; font-size: 14px;">
                #${order.id.slice(0, 8).toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style="color: #505c5f; padding: 5px 0; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Kundentyp:</td>
              <td style="text-align: right; font-weight: 600; color: #1a1c1c;">
                ${order.customerType === "business" ? "Geschäftskunde" : "Privatkunde"}
                ${order.companyName ? ` (${order.companyName})` : ""}
              </td>
            </tr>
            ${
              order.customerPhone
                ? `<tr>
              <td style="color: #505c5f; padding: 5px 0; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Telefon:</td>
              <td style="text-align: right; font-weight: 600; color: #1a1c1c;">
                ${order.customerPhone}
              </td>
            </tr>`
                : ""
            }
            ${
              order.street
                ? `<tr>
              <td style="color: #505c5f; padding: 5px 0; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">Adresse:</td>
              <td style="text-align: right; font-weight: 600; color: #1a1c1c;">
                ${order.street} ${order.houseNumber || ""}<br>
                ${order.zipCode || ""} ${order.city || ""}
              </td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <thead>
            <tr style="background-color: #0F4851; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
              <th style="padding: 10px 8px; text-align: left;">Artikel & Gebinde</th>
              <th style="padding: 10px 8px; text-align: center;">Menge</th>
              <th style="padding: 10px 8px; text-align: right;">Einzelpreis</th>
              <th style="padding: 10px 8px; text-align: right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows}
          </tbody>
        </table>

        <!-- Totals Box -->
        <div style="background-color: #f9fafb; border: 1px solid #c8d3d5; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-size: 13px; color: #505c5f;">Zwischensumme Artikel:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #1a1c1c;">${formatPrice(itemsSum)}</td>
            </tr>
            ${
              depositSum > 0
                ? `<tr>
              <td style="padding: 4px 0; font-size: 13px; color: #00A8BC; font-weight: 600;">Pfand (Flaschen / Gebinde):</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #00A8BC;">+ ${formatPrice(depositSum)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding-top: 12px; border-top: 2px solid #0F4851; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0F4851;">
                Gesamtbetrag (inkl. MwSt. & Pfand):
              </td>
              <td style="padding-top: 12px; border-top: 2px solid #0F4851; text-align: right; font-size: 22px; font-weight: 900; color: #0F4851;">
                ${formatPrice(grandTotal)}
              </td>
            </tr>
          </table>
        </div>

        <!-- Legal / Click & Reserve Notice -->
        <div style="background-color: #f3f4f6; border-left: 4px solid #0F4851; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #505c5f; line-height: 1.5;">
          <strong style="color: #0F4851; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
            Unverbindliche Vorbestellung (Click & Reserve)
          </strong>
          Es kommt kein Fernabsatzvertrag zustande. Die Bezahlung erfolgt erst bei Abholung vor Ort an der Ladenkasse (Bar oder Kartenzahlung).
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #1a1c1c; font-weight: 600;">
            Abholort: Handwerksbrauerei SCHÜTTE &bull; Zum Siekweg 2, 39343 Rottmersleben
          </div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #505c5f; text-align: center;">
          Bei Fragen erreichen Sie uns jederzeit unter <strong style="color: #0F4851;">info@rottmersleber-brauerei.de</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #0F4851; padding: 18px; text-align: center; font-size: 11px; color: #c8d3d5; border-top: 1px solid rgba(255,255,255,0.1);">
        &copy; ${new Date().getFullYear()} Handwerksbrauerei Schütte &bull; Alle Rechte vorbehalten.
      </div>
    </div>
  </body>
  </html>`;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<EmailSendResult> {
  const email = order.customerEmail;
  if (!email) {
    return { success: false, error: "Keine E-Mail-Adresse für den Empfänger angegeben." };
  }

  const htmlContent = generateOrderConfirmationHtml(order);

  // If RESEND_API_KEY is configured, send live email
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Resend] Sende Bestellbestätigung für #${order.id} an ${email}...`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Brauerei Schütte <bestellung@shop.rottmersleber-brauerei.de>",
          to: [email],
          subject: `Bestellbestätigung #${order.id.slice(0, 8).toUpperCase()} - Handwerksbrauerei Schütte`,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Resend] E-Mail erfolgreich versendet. Message-ID: ${data.id}`);
        return { success: true, messageId: data.id };
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`[Resend] Fehler beim E-Mail-Versand (HTTP ${res.status}):`, JSON.stringify(errData));
        return {
          success: false,
          error: `Resend API Fehler (${res.status}): ${errData.message || JSON.stringify(errData)}`,
        };
      }
    } catch (e: any) {
      console.error("[Resend] Unerwarteter Netzwerk-/Verbindungsfehler:", e?.message);
      return { success: false, error: e?.message };
    }
  } else {
    console.warn(
      "⚠️ [Resend] RESEND_API_KEY ist in den Umgebungsvariablen (Vercel / .env.local) nicht gesetzt! E-Mail-Versand wird im Simulationsmodus ausgeführt."
    );
  }

  // Development / fallback logging
  console.log("=================================================");
  console.log(`[E-MAIL SIMULATION] Keine Live-Mail versendet, da RESEND_API_KEY fehlt.`);
  console.log(`Empfänger: ${email}`);
  console.log(`Betreff: Bestellbestätigung #${order.id.slice(0, 8).toUpperCase()} - Brauerei Schütte`);
  console.log(`Kunde: ${order.customerName} (${order.customerPhone || "Keine Tel."})`);
  console.log(`Gesamtsumme: ${formatPrice(order.grandTotalCents || 0)}`);
  console.log("=================================================");

  return {
    success: true,
    previewText: `Bestellbestätigung an ${email} generiert (Simulationsmodus ohne API-Key).`,
  };
}
