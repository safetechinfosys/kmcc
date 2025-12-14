# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### For Users

1. **Open the App**
   - Visit the deployed URL or open `index.html` locally
   - Wait for the loading screen to complete

2. **Create an Account**
   - Click "Register here" on the login page
   - Fill in your details:
     - Full name, email, mobile, password
     - Country and occupation
     - Optional: Spouse name, kids details, address
   - Click "Create Account"

3. **Login**
   - Enter your email or mobile number
   - Enter your password
   - Click "Sign In"

4. **Explore Features**
   - **Dashboard**: Overview of all features
   - **Events**: Browse and register for events
   - **Search**: Find other community members
   - **Profile**: View your information

### For Developers

#### Local Testing
```bash
# Simply open the file
start index.html

# Or use a local server (optional)
npx serve .
# Then visit http://localhost:3000
```

#### Deploy to GitHub Pages
```bash
# 1. Create a new repository on GitHub

# 2. Initialize and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main

# 3. Enable GitHub Pages in repository settings
# Settings → Pages → Source: main branch → Save

# 4. Access at: https://YOUR_USERNAME.github.io/YOUR_REPO/
```

---

## 📱 Install as Mobile App

### Android (Chrome)
1. Open the website
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. App icon appears on home screen

### iOS (Safari)
1. Open the website
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

### Desktop (Chrome/Edge)
1. Open the website
2. Click install icon in address bar
3. Click "Install"

---

## 🎯 Common Tasks

### Register for an Event
1. Go to **Events** tab
2. Click on an event card
3. Select number of adults and kids
4. Review total amount
5. Click "Confirm Registration"

### Search for Members
1. Go to **Search** tab
2. Type name, email, mobile, or district
3. View results instantly

### View Your Registrations
1. Go to **My Registrations** tab
2. See all your event bookings
3. Check payment status

### Update Profile
1. Go to **Profile** tab
2. View your information
3. (Edit feature can be added)

---

## 🔧 Customization Quick Tips

### Change Primary Color
**File**: `styles.css`
```css
:root {
    --primary-hue: 245; /* Change to: 0-360 */
}
```
- Red: 0
- Orange: 30
- Yellow: 60
- Green: 120
- Blue: 240
- Purple: 280

### Add a New Event
**File**: `app.js`
```javascript
getDefaultEvents() {
    return [
        // ... existing events
        {
            id: 'evt4',
            name: 'Your Event Name',
            date: '2025-06-15',
            venue: 'Your Venue',
            adultRate: 500,
            kidsRate: 250,
            description: 'Event description here'
        }
    ];
}
```

### Add More Districts
**File**: `index.html`
```html
<select id="regDistrict">
    <!-- ... existing options -->
    <option value="YourDistrict">Your District</option>
</select>
```

### Change App Name
**Files**: `index.html`, `manifest.json`

`index.html`:
```html
<title>Your App Name</title>
```

`manifest.json`:
```json
{
    "name": "Your App Name",
    "short_name": "App Name"
}
```

---

## 🐛 Troubleshooting

### Login Not Working
- ✅ Check email/mobile is correct
- ✅ Verify password is correct
- ✅ Try clearing browser cache
- ✅ Check browser console (F12) for errors

### Data Not Saving
- ✅ Ensure LocalStorage is enabled
- ✅ Check browser storage isn't full
- ✅ Try different browser
- ✅ Test in incognito mode

### App Not Loading
- ✅ Check internet connection (first load)
- ✅ Clear browser cache
- ✅ Verify all files are present
- ✅ Check browser console for errors

### GitHub Pages Not Working
- ✅ Wait 2-3 minutes after enabling
- ✅ Verify repository is Public
- ✅ Check branch name is correct (main)
- ✅ Ensure all files are uploaded

---

## 📊 Default Test Data

### Test Account (Create Your Own)
```
Email: test@example.com
Mobile: +91 9876543210
Password: Test@123
```

### Default Events
1. **Annual Community Gathering 2025**
   - Date: March 15, 2025
   - Venue: Community Hall, Ernakulam
   - Adult: ₹500, Kids: ₹250

2. **Youth Sports Festival**
   - Date: April 20, 2025
   - Venue: Sports Complex, Kottayam
   - Adult: ₹300, Kids: ₹150

3. **Cultural Night 2025**
   - Date: May 10, 2025
   - Venue: Auditorium, Thiruvananthapuram
   - Adult: ₹600, Kids: ₹300

---

## 📁 File Structure

```
community-registration-app/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js             # Application logic
├── manifest.json      # PWA manifest
├── icon-192.png       # App icon (small)
├── icon-512.png       # App icon (large)
├── README.md          # Project overview
├── DEPLOYMENT.md      # Deployment guide
├── FEATURES.md        # Feature documentation
├── QUICKSTART.md      # This file
└── .gitignore         # Git ignore rules
```

---

## 🎨 Color Reference

### Primary Colors
- **Primary 500**: `#6366f1` (Indigo)
- **Secondary 500**: `#a855f7` (Purple)

### Status Colors
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Orange)
- **Info**: `#06b6d4` (Cyan)

### Neutral Colors
- **Background**: `#14181c` (Dark)
- **Surface**: `#1e2329` (Lighter Dark)
- **Text Primary**: `#f5f5f5` (White)
- **Text Secondary**: `#a0a0a0` (Gray)

---

## 🔑 Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Submit forms
- **Esc**: Close modals
- **F12**: Open browser console (debugging)
- **Ctrl+R**: Refresh page

---

## 📞 Support

### Need Help?
1. Check this guide
2. Read `FEATURES.md` for detailed info
3. See `DEPLOYMENT.md` for hosting help
4. Open browser console (F12) for errors
5. Test in different browser

### Want to Contribute?
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## ✅ Pre-Launch Checklist

Before deploying:
- [ ] Test registration flow
- [ ] Test login/logout
- [ ] Test event registration
- [ ] Test search functionality
- [ ] Test on mobile device
- [ ] Test on different browsers
- [ ] Verify all links work
- [ ] Check responsive design
- [ ] Test PWA installation
- [ ] Review security settings

---

## 🎉 Success!

Your community registration portal is ready to use!

**Next Steps:**
1. Share the URL with your community
2. Create your account
3. Add events as needed
4. Invite members to register

**Enjoy managing your community! 🚀**

---

*Last Updated: December 2025*
