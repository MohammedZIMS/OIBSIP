import { escapeHtml } from '../utils/escapeHtml.js';

// Email clients ignore CSS variables and external CSS, so colors are inline hex values from the design palette.
export const emailLayout = ({ title, bodyHtml }) => `<!doctype html>
<html><body style="margin:0;background:#FBF3E4;font-family:Arial,Helvetica,sans-serif;color:#1D2833;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E4D0AA;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#5A1A35;color:#E9C590;padding:20px 28px;font-size:20px;font-weight:bold;">Forno &amp; Farina</td></tr>
      <tr><td style="padding:28px;font-size:16px;line-height:1.55;">
        <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:16px 28px;background:#FBF3E4;font-size:12px;color:#6B5A48;">If you did not request this email, you can ignore it.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

export const button = (href, label) =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="background:#B80311;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">${escapeHtml(label)}</a></p>`;
