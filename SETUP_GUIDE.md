# 🚀 Setup Guide for New Features

## 📧 Email Notifications Setup (Gmail)

### Step 1: Generate App Password for Gmail
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", click on "2-Step Verification"
   - If not enabled, enable it first
4. Scroll down and click on "App passwords"
5. Select "Mail" and "Other (Custom name)"
6. Enter "Auction Platform" and click "Generate"
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env File
Open `backend/.env` and update:
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```
(Replace with your actual Gmail and app password)

### Step 3: Test Email
- Place a bid on an auction
- Seller will receive an email notification
- Previous bidder will receive "outbid" notification

---

## 📸 Image Upload Setup (Cloudinary)

### Step 1: Create Cloudinary Account
1. Go to: https://cloudinary.com/users/register/free
2. Sign up for a free account
3. After signing in, go to Dashboard

### Step 2: Get API Credentials
From your Cloudinary Dashboard, copy:
- Cloud Name (e.g., `dpqsxabcd`)
- API Key (e.g., `123456789012345`)
- API Secret (e.g., `abcdefGHIJKLmnopQRST123456`)

### Step 3: Update .env File
Open `backend/.env` and update:
```env
CLOUDINARY_CLOUD_NAME=dpqsxabcd
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefGHIJKLmnopQRST123456
```

### Step 4: Test Image Upload
- Go to "Create Auction" page
- You'll see an image upload button
- Upload images (max 5MB each)
- Images will be stored in Cloudinary and displayed in auctions

---

## 🛡️ Admin Dashboard Setup

### Step 1: Create Admin User
In MongoDB Compass or MongoDB Shell, update a user to be admin:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { isAdmin: true } }
)
```

Or create a new admin user:
```javascript
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$10$hashedpassword...", // Use bcrypt to hash
  isSeller: false,
  isAdmin: true,
  isBlocked: false,
  createdAt: new Date()
})
```

### Step 2: Access Admin Dashboard
1. Login with admin account
2. Go to: `http://localhost:3000/admin`
3. You'll see:
   - Platform statistics
   - User management
   - Auction moderation
   - Payment reports

---

## ⚡ Real-time Notifications (Socket.io)

### Already Setup!
Socket.io is configured and running automatically.

### Features:
- **Real-time bid updates**: When someone bids, all viewers see it instantly
- **Toast notifications**: Pop-up alerts for new bids
- **Live auction updates**: Current bid and bid count update in real-time

### Test it:
1. Open an auction in two different browsers
2. Place a bid in one browser
3. The other browser will show the update instantly!

---

## 🎯 Feature Summary

### ✅ Implemented Features:

1. **📸 Image Upload**
   - Multiple images per auction
   - Cloudinary storage
   - 5MB max file size
   - Preview before upload

2. **📧 Email Notifications**
   - New bid notification (to seller)
   - Outbid notification (to previous bidder)
   - Auction win notification
   - Payment reminders
   - HTML formatted emails

3. **🛡️ Admin Dashboard**
   - User management (block/delete)
   - Auction moderation
   - Platform statistics
   - Top sellers
   - Payment reports
   - Recent auctions

4. **⚡ Real-time Notifications**
   - Socket.io integration
   - Live bid updates
   - Toast notifications
   - Auction countdown updates
   - Multi-tab synchronization

---

## 🔐 Security Notes

- **Never commit .env file** to Git
- Use strong app passwords for email
- Keep Cloudinary credentials secure
- Only trusted users should have admin access
- Email notifications require 2FA enabled on Gmail

---

## 🐛 Troubleshooting

### Email not sending?
- Check if 2-Step Verification is enabled
- Verify app password (no spaces)
- Check Gmail's "Less secure app access" is OFF

### Images not uploading?
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure file is an image (jpg, png, gif, webp)

### Socket.io not working?
- Check if backend server is running
- Verify frontend connects to `localhost:5000`
- Check browser console for connection errors

### Admin dashboard not accessible?
- Verify user has `isAdmin: true` in database
- Check if logged in with admin account
- Look for 403 errors in console

---

## 📚 Next Steps

1. **Setup Gmail App Password** → Enable email notifications
2. **Create Cloudinary Account** → Enable image uploads
3. **Create Admin User** → Access admin dashboard
4. **Test Real-time Features** → Open multiple browsers

---

## 🎉 You're All Set!

All 4 major features are now implemented:
- ✅ Image Upload
- ✅ Email Notifications
- ✅ Admin Dashboard
- ✅ Real-time Notifications

Restart your servers and start testing! 🚀
