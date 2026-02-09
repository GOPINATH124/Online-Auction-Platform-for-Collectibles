const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER || 'your_email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your_app_password'
  }
});

// Send email when someone bids on your auction
exports.sendNewBidNotification = async (sellerEmail, sellerName, auctionTitle, bidAmount, bidderName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sellerEmail,
      subject: `🎯 New Bid on "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">New Bid Alert! 🎉</h2>
          <p>Hi ${sellerName},</p>
          <p>Great news! Someone just placed a bid on your auction.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${auctionTitle}</h3>
            <p style="font-size: 24px; color: #667eea; margin: 10px 0;"><strong>$${bidAmount}</strong></p>
            <p style="color: #666; margin: 5px 0;">Bidder: ${bidderName}</p>
          </div>
          <p>Keep up the momentum! More bids might be coming your way.</p>
          <a href="http://localhost:3000/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Auction</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('New bid notification sent to:', sellerEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send email when you're outbid
exports.sendOutbidNotification = async (bidderEmail, bidderName, auctionTitle, yourBid, newBid) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bidderEmail,
      subject: `⚠️ You've been outbid on "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">You've Been Outbid! ⚠️</h2>
          <p>Hi ${bidderName},</p>
          <p>Someone just placed a higher bid on an auction you're interested in.</p>
          <div style="background: #fff7ed; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0;">${auctionTitle}</h3>
            <p style="margin: 5px 0;">Your bid: <strong>$${yourBid}</strong></p>
            <p style="margin: 5px 0;">New highest bid: <strong style="color: #f59e0b;">$${newBid}</strong></p>
          </div>
          <p>Don't lose out! Place a higher bid to stay in the game.</p>
          <a href="http://localhost:3000/auctions" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Place New Bid</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Outbid notification sent to:', bidderEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send email when you win an auction
exports.sendAuctionWinNotification = async (winnerEmail, winnerName, auctionTitle, winningBid) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: winnerEmail,
      subject: `🏆 Congratulations! You won "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Congratulations! 🏆</h2>
          <p>Hi ${winnerName},</p>
          <p>Excellent news! You've won the auction!</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0;">${auctionTitle}</h3>
            <p style="font-size: 24px; color: #10b981; margin: 10px 0;"><strong>$${winningBid}</strong></p>
          </div>
          <p>Please complete your payment to finalize the purchase.</p>
          <a href="http://localhost:3000/my-purchases" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Complete Payment</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Auction win notification sent to:', winnerEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Send payment reminder
exports.sendPaymentReminder = async (buyerEmail, buyerName, auctionTitle, amount) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: buyerEmail,
      subject: `💳 Payment Reminder for "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Payment Reminder 💳</h2>
          <p>Hi ${buyerName},</p>
          <p>This is a friendly reminder to complete your payment for the auction you won.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="margin: 0 0 10px 0;">${auctionTitle}</h3>
            <p style="font-size: 24px; color: #ef4444; margin: 10px 0;"><strong>$${amount}</strong></p>
          </div>
          <p>Please complete your payment at your earliest convenience.</p>
          <a href="http://localhost:3000/my-purchases" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Pay Now</a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment reminder sent to:', buyerEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
// Send email to seller when payment is received
exports.sendPaymentReceivedNotification = async (sellerEmail, sellerName, auctionTitle, amount, buyerName, transactionId) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sellerEmail,
      subject: `💰 Payment Received for "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Received! 💰🎉</h2>
          <p>Hi ${sellerName},</p>
          <p>Excellent news! The buyer has completed the payment for your auction.</p>
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 10px; margin: 20px 0; color: white;">
            <h3 style="margin: 0 0 15px 0; color: white;">${auctionTitle}</h3>
            <p style="font-size: 32px; margin: 10px 0; font-weight: bold;">₹${amount}</p>
            <p style="margin: 5px 0; opacity: 0.9;">Buyer: ${buyerName}</p>
            <p style="margin: 5px 0; opacity: 0.9; font-size: 12px;">Transaction ID: ${transactionId}</p>
          </div>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0; color: #166534;"><strong>✓</strong> Payment Status: Completed</p>
            <p style="margin: 5px 0; color: #166534;"><strong>✓</strong> Amount Credited</p>
            <p style="margin: 5px 0; color: #166534;"><strong>✓</strong> Ready to Ship</p>
          </div>
          <p>Please proceed with shipping the item to the buyer. You can contact them through the platform.</p>
          <a href="http://localhost:3000/my-sales" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View My Sales</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for using our auction platform! 🙏</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment received notification sent to seller:', sellerEmail);
  } catch (error) {
    console.error('Error sending payment notification email:', error);
  }
};

// Send email when payment deadline is missed
exports.sendPaymentDeadlineMissedNotification = async (winnerEmail, winnerName, auctionTitle, amount) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: winnerEmail,
      subject: `⏰ Payment Deadline Missed - "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f5576c;">Payment Deadline Missed ⏰</h2>
          <p>Hi ${winnerName},</p>
          <p>Unfortunately, you missed the 1-hour payment deadline for your winning auction.</p>
          <div style="background: #fff3f3; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f5576c;">
            <h3 style="margin: 0 0 10px 0; color: #f5576c;">${auctionTitle}</h3>
            <p style="font-size: 20px; margin: 10px 0;">Amount: <strong>$${amount}</strong></p>
            <p style="color: #666;">The auction has been transferred to the second highest bidder.</p>
          </div>
          <p>Please make timely payments for future auctions to avoid losing your winning bids.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated message from Auction Platform.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment deadline missed notification sent:', winnerEmail);
  } catch (error) {
    console.error('Error sending deadline missed email:', error);
  }
};

// Send email to seller when winner changes
exports.sendWinnerChangedNotification = async (sellerEmail, sellerName, auctionTitle, oldWinner, newWinner, amount) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sellerEmail,
      subject: `🔄 Winner Changed - "${auctionTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Auction Winner Changed 🔄</h2>
          <p>Hi ${sellerName},</p>
          <p>The original winner missed the payment deadline for your auction.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">${auctionTitle}</h3>
            <p style="margin: 10px 0;"><strong>Previous Winner:</strong> ${oldWinner} ❌</p>
            <p style="margin: 10px 0;"><strong>New Winner:</strong> ${newWinner} ✅</p>
            <p style="font-size: 20px; color: #667eea; margin: 10px 0;">Amount: <strong>$${amount}</strong></p>
          </div>
          <p>The auction has been automatically transferred to the second highest bidder.</p>
          <p>The new winner has been notified and has 1 hour to make the payment.</p>
          <a href="http://localhost:3000/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated message from Auction Platform.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Winner changed notification sent to seller:', sellerEmail);
  } catch (error) {
    console.error('Error sending winner changed email:', error);
  }
};
