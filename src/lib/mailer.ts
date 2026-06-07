import nodemailer from "nodemailer";

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(`Magic link for ${email}: ${url}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: email,
    subject: "金欠対策 ログインリンク",
    text: url,
  });
}
