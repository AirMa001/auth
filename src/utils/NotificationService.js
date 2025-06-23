const admin = require('firebase-admin');
const getmessaging = require( 'firebase-admin/messaging' );
const serviceAccount = require('../config/webinar-9c6f2-firebase-adminsdk-fbsvc-d320212cab.json');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
 
});


const sendPushNotification = (deviceToken, title, body) => {
  const message = {
    notification: {
      title,
      body
    },
    token: deviceToken
  };

  getmessaging.send(message)
    .then((response) => {
      console.log('Push notification sent:', response);
    })
    .catch((error) => {
      console.error('Error sending push notification:', error);
    });
};


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
})

const smsClient = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
)

const NotificationService = {
  async sendInAppNotification(userId, type, content, relatedId = null) {
    return await prisma.notification.create({
      data: { userId, type, content, relatedId }
    })
  },

  async sendEmail(to, subject, text) {
    return transporter.sendMail({
      to,
      subject,
      text,
      from: process.env.EMAIL
    })
  },

  async sendSMS(to, message) {
    return smsClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    })
  },

  async notifyOrderConfirmed(user, orderId) {
    const content = `Your order (${orderId}) has been confirmed.`
    await this.sendInAppNotification(user.id, 'ORDER_UPDATE', content, orderId)
    await this.sendEmail(user.email, 'Order Confirmed', content)
    if (user.phone) await this.sendSMS(user.phone, content)
  },

  async notifyPaymentStatus(user, orderId, success = true) {
    const content = `Payment for order (${orderId}) was ${success ? 'successful' : 'unsuccessful'}.`
    await this.sendInAppNotification(user.id, 'PAYMENT_STATUS', content, orderId)
    await this.sendEmail(user.email, 'Payment Status', content)
    if (user.phone) await this.sendSMS(user.phone, content)
  },

  async notifyLogisticsUpdate(user, orderId, status) {
    const content = `Logistics status updated: ${status} for order (${orderId}).`
    await this.sendInAppNotification(user.id, 'ORDER_UPDATE', content, orderId)
  },

  async notifyPayoutConfirmation(user, orderId) {
    const content = `Payout completed for order (${orderId}).`
    await this.sendInAppNotification(user.id, 'PAYMENT_STATUS', content, orderId)
    await this.sendEmail(user.email, 'Payout Confirmation', content)
    if (user.phone) await this.sendSMS(user.phone, content)
  },

  async notifyNewMessage(user, orderId) {
    const content = `You received a new message about order (${orderId}).`
    await this.sendInAppNotification(user.id, 'NEW_MESSAGE', content, orderId)
  },

  async notifyDisputeUpdate(user, disputeId, status) {
    const content = `Dispute (${disputeId}) status updated to: ${status}.`
    await this.sendInAppNotification(user.id, 'DISPUTE_UPDATE', content, disputeId)
    await this.sendEmail(user.email, 'Dispute Status Update', content)
  }
}

module.exports = { 
  sendPushNotification,
  NotificationService
 };


