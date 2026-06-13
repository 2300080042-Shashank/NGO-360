const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (recipientId, senderId, title, message, type = 'info') => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId || undefined,
      title,
      message,
      type
    });
    await notification.save();

    // Fetch recipient details to print email-ready details in logs
    const recipient = await User.findById(recipientId);
    const recipientEmail = recipient ? recipient.email : 'Unknown Email';
    const recipientName = recipient ? recipient.name : 'User';

    console.log(`[EMAIL-READY ARCHITECTURE]
--------------------------------------------------
To: ${recipientName} <${recipientEmail}>
Subject: ${title}
Body:
Dear ${recipientName},

${message}

Best regards,
NGO360 Team
--------------------------------------------------`);
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

module.exports = { createNotification };
