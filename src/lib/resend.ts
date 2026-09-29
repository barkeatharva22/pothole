import { Resend } from "resend";
import type { Hazard } from "./types";
import { CATEGORY_LABELS } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Sends the AI-drafted formal complaint to the responsible municipal department
// when a citizen submits a new hazard report.
export async function sendComplaintEmail(
  authorityEmail: string,
  hazard: Hazard,
  reporterEmail: string
) {
  await resend.emails.send({
    from: FROM,
    to: authorityEmail,
    replyTo: reporterEmail,
    subject: `Civic hazard report: ${CATEGORY_LABELS[hazard.category]} — ${hazard.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>New hazard report submitted via Civix</h2>
        <p><strong>${hazard.title}</strong></p>
        <p style="color:#666">Category: ${CATEGORY_LABELS[hazard.category]} &middot; Severity: ${hazard.severity}</p>
        <p style="color:#666">Location: ${hazard.address ?? `${hazard.latitude}, ${hazard.longitude}`}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="white-space:pre-line">${hazard.ai_complaint_draft ?? hazard.description}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="color:#999;font-size:12px">This report was submitted through the Civix citizen reporting app. Reply to this email to reach the reporter directly.</p>
      </div>
    `,
  });
}

export async function sendStatusUpdateEmail(toEmail: string, hazard: Hazard) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Update on your report: ${hazard.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2>Your hazard report has been updated</h2>
        <p><strong>${hazard.title}</strong></p>
        <p>New status: <strong>${hazard.status.replace("_", " ")}</strong></p>
        <p style="color:#666">${hazard.address ?? ""}</p>
      </div>
    `,
  });
}

export async function sendWeeklyDigest(toEmail: string, openHazards: Hazard[]) {
  const rows = openHazards
    .map(
      (h) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${h.title}</td>
         <td style="padding:8px;border-bottom:1px solid #eee">${h.severity}</td>
         <td style="padding:8px;border-bottom:1px solid #eee">${h.status.replace("_", " ")}</td></tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${openHazards.length} of your reports still open`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2>Weekly hazard report digest</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Hazard</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Severity</th>
            <th style="text-align:left;padding:8px;border-bottom:2px solid #333">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  });
}