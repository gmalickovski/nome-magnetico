/**
 * Envio server-side via Amazon SES (SMTP).
 * Credenciais só em runtime (`readServerEnv`). Nunca importar no browser.
 */
import nodemailer from 'nodemailer';
import { readServerEnv } from '../env/runtime';

export interface SmtpMail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

function readSmtpConfig() {
  const host = readServerEnv('SMTP_HOST');
  const portRaw = readServerEnv('SMTP_PORT');
  const user = readServerEnv('SMTP_USER');
  const pass = readServerEnv('SMTP_PASS');
  const from = readServerEnv('SMTP_FROM');
  const port = portRaw ? Number(portRaw) : Number.NaN;

  if (!host || !portRaw || !user || !pass || !from || !Number.isFinite(port)) {
    throw new Error('Configuração de e-mail incompleta');
  }

  return { host, port, user, pass, from };
}

export async function sendSmtpMail(mail: SmtpMail): Promise<void> {
  const { host, port, user, pass, from } = readSmtpConfig();
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    replyTo: mail.replyTo,
  });
}
