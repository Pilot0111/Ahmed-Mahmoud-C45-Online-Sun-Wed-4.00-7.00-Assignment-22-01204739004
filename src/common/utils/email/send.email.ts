import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};
export const sendEmail = async (mailOptions: Mail.Options = {}) => {
  try {
    if (!mailOptions.to) throw new Error("Recipient email (to) is missing");

    const mailer = getTransporter();
    const info = await mailer.sendMail({
      from: `"Saraha App" <${process.env.EMAIL}>`,
      ...mailOptions,
    });
    return info.accepted.length > 0;
  } catch (error: any) {
    console.error("Nodemailer transport error:", error.message);
    return false;
  }
};
