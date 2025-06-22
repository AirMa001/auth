const admin = require('firebase-admin');
const getmessaging = require( 'firebase-admin/messaging' );
const serviceAccount = require('../config/webinar-9c6f2-firebase-adminsdk-fbsvc-d320212cab.json');

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

module.exports = { sendPushNotification };


