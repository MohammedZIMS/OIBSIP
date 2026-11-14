import { escapeHtml } from '../utils/escapeHtml.js';
import { button, emailLayout } from './layout.js';

export function verifyEmailTemplate({ name, link, code, hoursValid }) {
  const subject = 'Verify your email for Forno & Farina';
  const html = emailLayout({
    title: 'Confirm your email address',
    bodyHtml: `<p>Hi ${escapeHtml(name)}, welcome to Forno &amp; Farina. Confirm your email to start ordering.</p>
      ${button(link, 'Verify my email')}
      <p>Or enter this 6-digit code on the verification page:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold;margin:8px 0;">${escapeHtml(code)}</p>
      <p style="color:#6B5A48;font-size:14px;">The link and code expire in ${hoursValid} hours.</p>`,
  });
  const text = `Hi ${name},\n\nVerify your email: ${link}\nOr enter this code: ${code}\n\nThe link and code expire in ${hoursValid} hours.`;
  return { subject, html, text };
}
