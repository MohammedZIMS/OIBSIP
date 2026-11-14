import { escapeHtml } from '../utils/escapeHtml.js';
import { button, emailLayout } from './layout.js';

export function resetPasswordTemplate({ name, link, minutesValid }) {
  const subject = 'Reset your Forno & Farina password';
  const html = emailLayout({
    title: 'Reset your password',
    bodyHtml: `<p>Hi ${escapeHtml(name)}, we received a request to reset your password.</p>
      ${button(link, 'Choose a new password')}
      <p style="color:#6B5A48;font-size:14px;">This link expires in ${minutesValid} minutes and can be used once.</p>`,
  });
  const text = `Hi ${name},\n\nReset your password: ${link}\n\nThis link expires in ${minutesValid} minutes and can be used once.`;
  return { subject, html, text };
}
