// Vercel Serverless Function: nimmt Formular-Anfragen entgegen und verschickt
// zwei E-Mails im EAN-Design (Benachrichtigung an EAN + Bestätigung an den Kunden).
// Versand über Brevo (kostenlos). Aktiv, sobald die Env-Variable BREVO_API_KEY gesetzt ist.

import { notificationEmail, confirmationEmail } from "../lib/email.js";

const EAN_EMAIL = "aiagencyean@outlook.com";
const SENDER = { name: "EAN Agency", email: EAN_EMAIL };

async function sendBrevo({ to, toName, subject, html, replyTo }) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to, name: toName || to }],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject,
      htmlContent: html,
    }),
  });
  if (!r.ok) {
    throw new Error("Brevo " + r.status + ": " + (await r.text()).slice(0, 300));
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Honeypot – Bots still ausfiltern
  if (body.botcheck) return res.status(200).json({ success: true });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "invalid_input" });
  }

  const data = {
    type: body.type === "termin" ? "termin" : "kontakt",
    name,
    email,
    message: String(body.message || "").trim(),
    company: String(body.company || "").trim(),
    leistung: String(body.leistung || "").trim(),
    wunschtermin: String(body.wunschtermin || "").trim(),
  };

  if (!process.env.BREVO_API_KEY) {
    return res
      .status(503)
      .json({ success: false, error: "email_not_configured" });
  }

  try {
    const notify = notificationEmail(data);
    await sendBrevo({
      to: EAN_EMAIL,
      toName: "EAN Agency",
      subject: notify.subject,
      html: notify.html,
      replyTo: email,
    });

    const confirm = confirmationEmail(data);
    await sendBrevo({
      to: email,
      toName: name,
      subject: confirm.subject,
      html: confirm.html,
      replyTo: EAN_EMAIL,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("contact send failed:", e);
    return res.status(502).json({ success: false, error: "send_failed" });
  }
}
