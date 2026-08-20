import { prisma } from '../config/db';
import nodemailer from 'nodemailer';

export async function sendNotification(
  orderId: string,
  recipientEmail: string,
  status: string,
  remarks?: string
) {
  const message = `Order #${orderId} status updated to: ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`;

  let notificationStatus = 'SENT';

  try {
    // 1. Attempt to send via Nodemailer (if SMTP configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: '"Last-Mile Tracker" <no-reply@deliverytracker.com>',
        to: recipientEmail,
        subject: `Delivery Update: Order ${status}`,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Delivery Status Update</h2>
          <p>${message}</p>
          <p>Track your order status on your customer portal timeline.</p>
        </div>`,
      });
    } else {
      console.log(`[MOCK EMAIL SENT] To: ${recipientEmail} | ${message}`);
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    notificationStatus = 'FAILED';
  }

  // 2. Audit log entry in Notifications table
  try {
    await prisma.notification.create({
      data: {
        orderId,
        channel: 'EMAIL',
        recipient: recipientEmail,
        status: notificationStatus,
        message,
      },
    });
  } catch (err) {
    console.error('Failed to write notification audit log:', err);
  }
}
