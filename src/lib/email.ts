import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendTaskReminderEmail(
  to: string,
  taskTitle: string,
  dueDate: Date,
  clientName?: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Przypomnienie: ${taskTitle}`,
      html: `
        <h2>Przypomnienie o zadaniu</h2>
        <p>Masz zadanie do wykonania:</p>
        <p><strong>${taskTitle}</strong></p>
        ${clientName ? `<p>Klient: ${clientName}</p>` : ""}
        <p>Termin: ${new Date(dueDate).toLocaleString("pl-PL")}</p>
        <p>Zaloguj się do systemu, aby zobaczyć szczegóły.</p>
      `,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: message,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

