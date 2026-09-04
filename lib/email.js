// E-Mail-Vorlagen im EAN-Design (Schwarz / Gold). Wird von api/contact.js genutzt.

const BRAND = "#D9B45B";
const BRIGHT = "#F7E7B6";
const INK = "#F2EEE4";
const DIM = "#9A9488";
const BG = "#050506";
const CARD = "#0E0D12";
const HAIR = "rgba(217,180,91,0.10)";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}
function nl2br(s) {
  return esc(s).replace(/\n/g, "<br>");
}
function firstName(n) {
  const p = String(n || "").trim().split(/\s+/)[0];
  return p || n || "";
}

export function shell(inner, doc = true) {
  const body = `
<div style="background:${BG};padding:34px 14px;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:0 6px 18px;">
      <span style="display:inline-block;border:1px solid rgba(217,180,91,0.45);color:${BRAND};font-size:11px;letter-spacing:3px;padding:6px 10px;font-family:${MONO};">EAN&nbsp;AGENCY</span>
    </td></tr>
    <tr><td style="background:${CARD};border:1px solid rgba(217,180,91,0.18);padding:30px 30px 34px;">
      ${inner}
    </td></tr>
    <tr><td style="padding:16px 6px 0;color:#6b665a;font-size:11px;font-family:${MONO};letter-spacing:1px;">
      EAN&nbsp;AGENCY&nbsp;&middot;&nbsp;ean-agency.vercel.app&nbsp;&middot;&nbsp;aiagencyean@outlook.com
    </td></tr>
  </table>
</div>`;
  if (!doc) return body;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="dark"></head><body style="margin:0;background:${BG};">${body}</body></html>`;
}

function heading(title, sub) {
  return `
<h1 style="margin:0 0 6px;color:${INK};font-size:21px;font-weight:700;letter-spacing:-0.3px;">${esc(title)}</h1>
<p style="margin:0 0 22px;color:${DIM};font-size:13px;">${esc(sub)}</p>
<div style="height:1px;background:linear-gradient(90deg,${BRAND},rgba(217,180,91,0));margin:0 0 24px;font-size:0;line-height:0;">&nbsp;</div>`;
}

function rows(pairs) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
${pairs
  .map(
    ([k, v]) => `  <tr>
    <td style="padding:9px 0;border-bottom:1px solid ${HAIR};color:${DIM};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:${MONO};width:120px;vertical-align:top;">${esc(k)}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${HAIR};color:${INK};font-size:15px;line-height:1.5;">${v}</td>
  </tr>`
  )
  .join("\n")}
</table>`;
}

export function notificationEmail(d) {
  const termin = d.type === "termin";
  const pairs = [
    ["Name", esc(d.name)],
    [
      "E-Mail",
      `<a href="mailto:${esc(d.email)}" style="color:${BRAND};text-decoration:none;">${esc(d.email)}</a>`,
    ],
  ];
  if (d.company) pairs.push(["Betrieb", esc(d.company)]);
  if (termin && d.leistung) pairs.push(["Leistung", esc(d.leistung)]);
  if (termin && d.wunschtermin) pairs.push(["Wunschtermin", esc(d.wunschtermin)]);

  let inner =
    heading(
      termin ? "Neue Terminanfrage" : "Neue Anfrage",
      "Über das Formular auf ean-agency.vercel.app"
    ) + rows(pairs);

  if (d.message) {
    inner += `
<p style="margin:22px 0 0;color:${DIM};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:${MONO};">Nachricht</p>
<p style="margin:6px 0 0;color:${INK};font-size:15px;line-height:1.6;">${nl2br(d.message)}</p>`;
  }

  inner += `
<p style="margin:26px 0 0;">
  <a href="mailto:${esc(d.email)}?subject=${encodeURIComponent("Ihre Anfrage bei EAN Agency")}" style="display:inline-block;background:${BRAND};color:#141007;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:${MONO};padding:12px 20px;">Antworten</a>
</p>`;

  return {
    subject:
      (termin ? "Terminanfrage" : "Neue Anfrage") +
      " über die Website – " +
      d.name,
    html: shell(inner),
  };
}

export function confirmationEmail(d) {
  const termin = d.type === "termin";
  let inner = heading(
    "Danke für Ihre " + (termin ? "Terminanfrage" : "Anfrage") + ".",
    "EAN Agency"
  );

  inner += `
<p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.65;">Hallo ${esc(firstName(d.name))},</p>
<p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.65;">wir haben Ihre Nachricht erhalten und melden uns <strong style="color:${BRIGHT};">innerhalb eines Werktags</strong> bei Ihnen${termin ? ", um den Termin zu bestätigen" : ""}.</p>`;

  if (termin && d.wunschtermin) {
    inner += `
<p style="margin:0 0 16px;color:${DIM};font-size:14px;">Ihr Wunschtermin: <span style="color:${INK};">${esc(
      d.leistung ? d.leistung + " · " : ""
    )}${esc(d.wunschtermin)}</span></p>`;
  }

  if (d.message) {
    inner += `
<div style="margin:0 0 18px;padding:14px 16px;border-left:2px solid ${BRAND};background:rgba(217,180,91,0.05);color:${DIM};font-size:14px;line-height:1.6;">${nl2br(d.message)}</div>`;
  }

  inner += `
<p style="margin:0;color:${DIM};font-size:14px;line-height:1.65;">Bis gleich,<br><span style="color:${INK};">Ihr Team der EAN Agency</span></p>`;

  return {
    subject: "Danke für Ihre Anfrage bei EAN Agency",
    html: shell(inner),
  };
}
