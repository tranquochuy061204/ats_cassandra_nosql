import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER, // ví dụ: yourcompany@gmail.com
    pass: process.env.SMTP_PASS, // app password
  },
});
