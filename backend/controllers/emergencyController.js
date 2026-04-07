const mongoose = require('mongoose');
const User = require('../models/User');

exports.triggerAlert = async (req, res) => {
  try {
    const { userId, type, lastConversationSummary, location } = req.body;
    let user = null;
    
    // Graceful check for Valid ObjectId (skips for demo_user_id or if in demo mode)
    if (userId !== 'demo_user_id' && process.env.IS_DEMO_MODE !== 'true' && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    const EMERGENCY_NUMBER = "8778741264";
    const userName = user ? user.name : "Unknown User";
    const userAge = user ? user.age : "N/A";
    const userGender = user ? user.gender : "N/A";
    const userBloodGroup = user ? user.bloodGroup : "N/A";
    const userConditions = user ? (Array.isArray(user.existingConditions) ? user.existingConditions.join(", ") : user.existingConditions) : "Not provided";
    const userAllergies = user ? (Array.isArray(user.allergies) ? user.allergies.join(", ") : user.allergies) : "None reported";

    const messageContent = `
🚨 EMERGENCY ALERT FROM MEDIGUIDE 🚨
👤 USER PROFILE:
Name: ${userName}
Age/Gender: ${userAge} / ${userGender}
Blood Group: ${userBloodGroup}
📍 LOCATION: ${location || 'Unknown'}

🏥 HEALTH STATUS:
Conditions: ${userConditions}
Allergies: ${userAllergies}

💬 LAST CONVERSATION SUMMARY:
${lastConversationSummary || "No conversation summary available"}

📡 ALERT TYPE: ${type}
    `;

    // MOCK WHATSAPP SENDING
    console.log(`Sending WhatsApp message to ${EMERGENCY_NUMBER}...`);
    console.log(messageContent);

    // In a real app, use Twilio or Meta WhatsApp Cloud API here:
    /*
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: messageContent,
      to: `whatsapp:+91${EMERGENCY_NUMBER}`
    });
    */

    res.json({ 
      success: true, 
      msg: `Emergency alert sent successfully to ${EMERGENCY_NUMBER}.`,
      alertDetails: { to: EMERGENCY_NUMBER, type, content: messageContent }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
