// Email is optional. The store never needs it (orders are tracked by number +
// phone, passwords are changed from the account page). If you later want order
// emails, plug nodemailer / Resend / SendGrid in here — nothing else calls it
// yet. Until then it just logs, so nothing crashes.
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  console.log(`[email] (not configured) would send "${input.subject}" to ${input.to}`);
}
