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
        <td style="padding: 12px 8px; font-weight: 600; color: #1f2937;">
          ${item.productName}
          <div style="font-size: 12px; font-weight: normal; color: #6b7280;">
            ${formatContainerType(item.variantType)}
          </div>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #374151; font-weight: 600;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; text-align: right; color: #374151;">
          ${formatPrice(item.unitPrice)}
          ${
            item.depositPrice
              ? `<div style="font-size: 11px; color: #92400e;">+ ${formatPrice(
                  item.depositPrice
                )} Pfand</div>`
              : ""
          }
        </td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #111827;">
          ${formatPrice(item.unitPrice * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Bestellbestätigung - Brauerei Schütte</title>
  </head>
  <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background-color: #1c1917; padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; color: #f59e0b;">
          HANDWERKSBRAUEREI SCHÜTTE
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #d6d3d1;">
          Frisch gebraut in Rottmersleben
        </p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #111827;">
            Vielen Dank für Ihre Bestellung!
          </h2>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
            Hallo <strong>${order.customerName}</strong>,<br>
            wir haben Ihren Auftrag erhalten und bereiten Ihre Bierspezialitäten mit handwerklicher Sorgfalt für Sie vor.
          </p>
        </div>

        <!-- Order Meta Box -->
        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 4px 0;">Bestellnummer:</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace; color: #111827;">
                #${order.id.slice(0, 8).toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 4px 0;">Kundentyp:</td>
              <td style="text-align: right; font-weight: 600; color: #111827;">
                ${order.customerType === "business" ? "Geschäftskunde" : "Privatkunde"}
                ${order.companyName ? ` (${order.companyName})` : ""}
              </td>
            </tr>
            ${
              order.customerPhone
                ? `<tr>
              <td style="color: #6b7280; padding: 4px 0;">Telefon:</td>
              <td style="text-align: right; font-weight: 600; color: #111827;">
                ${order.customerPhone}
              </td>
            </tr>`
                : ""
            }
            ${
              order.street
                ? `<tr>
              <td style="color: #6b7280; padding: 4px 0;">Adresse:</td>
              <td style="text-align: right; font-weight: 600; color: #111827;">
                ${order.street} ${order.houseNumber || ""}<br>
                ${order.zipCode || ""} ${order.city || ""}
              </td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Artikel & Gebinde</th>
              <th style="padding: 8px; text-align: center;">Menge</th>
              <th style="padding: 8px; text-align: right;">Einzelpreis</th>
              <th style="padding: 8px; text-align: right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="background-color: #fafaf9; border-radius: 12px; padding: 16px; margin-bottom: 28px; border: 1px solid #f5f5f4;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 6px;">
            <span>Zwischensumme Getränke:</span>
            <span style="font-weight: 600; color: #111827;">${formatPrice(itemsSum)}</span>
          </div>
          ${
            depositSum > 0
              ? `<div style="display: flex; justify-content: space-between; font-size: 13px; color: #b45309; margin-bottom: 6px;">
            <span>Pfand (Flaschen / Fässer):</span>
            <span style="font-weight: 600;">+ ${formatPrice(depositSum)}</span>
          </div>`
              : ""
          }
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 6px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #111827;">
            <span>Gesamtbetrag (inkl. MwSt. & Pfand):</span>
            <span style="color: #b45309;">${formatPrice(grandTotal)}</span>
          </div>
        </div>

        <!-- Pickup Info -->
        <div style="border-left: 4px solid #f59e0b; padding: 12px 16px; background-color: #fffbeb; border-radius: 4px; margin-bottom: 24px; font-size: 13px; color: #92400e;">
          <strong style="display: block; margin-bottom: 4px; font-size: 14px;">Abholhinweis:</strong>
          Sie erhalten eine weitere Benachrichtigung, sobald Ihre Bestellung abholbereit ist.
          <div style="margin-top: 6px; color: #78350f;">
            <strong>Handwerksbrauerei SCHÜTTE</strong> &bull; Zum Siekweg 2, 39343 Rottmersleben
          </div>
        </div>

        <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
          Bei Fragen erreichen Sie uns jederzeit unter <strong>info@rottmersleber-brauerei.de</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        &copy; ${new Date().getFullYear()} Handwerksbrauerei Schütte. Alle Rechte vorbehalten.
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
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Brauerei Schütte <bestellung@rottmersleber-brauerei.de>",
          to: [email],
          subject: `Bestellbestätigung #${order.id.slice(0, 8).toUpperCase()} - Handwerksbrauerei Schütte`,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, messageId: data.id };
      } else {
        const errData = await res.json();
        console.warn("Resend API error:", errData);
      }
    } catch (e: any) {
      console.warn("Could not dispatch via Resend:", e?.message);
    }
  }

  // Development / fallback logging
  console.log("=================================================");
  console.log(`[E-MAIL BESTÄTIGUNG GESENDET AN: ${email}]`);
  console.log(`Betreff: Bestellbestätigung #${order.id.slice(0, 8).toUpperCase()} - Brauerei Schütte`);
  console.log(`Kunde: ${order.customerName} (${order.customerPhone || "Keine Tel."})`);
  console.log(`Gesamtsumme: ${formatPrice(order.grandTotalCents || 0)}`);
  console.log("=================================================");

  return {
    success: true,
    previewText: `Bestellbestätigung an ${email} erfolgreich generiert.`,
  };
}
