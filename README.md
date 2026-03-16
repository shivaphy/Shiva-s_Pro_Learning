# BriskLearn LMS — Setup Guide

## 🚀 Quick Start

1. **Open** `index.html` in any modern browser (Chrome, Firefox, Edge)
2. **Login** with demo credentials (pre-loaded):
   - **Admin:** admin@brisklearn.edu / Admin@123
   - **Faculty:** ramesh@brisklearn.edu / Faculty@123
   - **Student:** arjun@student.brisklearn.edu / Student@123

---

## 📧 EmailJS Setup (Real Email Notifications)

BriskLearn uses [EmailJS](https://www.emailjs.com) for automatic email delivery.

### Step 1 — Create free account
Go to https://www.emailjs.com and sign up (free tier: 200 emails/month)

### Step 2 — Create Email Service
- Go to Email Services → Add New Service
- Connect Gmail, Outlook, or any SMTP
- Copy your **Service ID** (e.g. `service_abc123`)

### Step 3 — Create Email Templates
Create these 6 templates in EmailJS:

| Template Name | Purpose |
|---|---|
| `template_faculty_welcome` | Sends credentials when faculty is approved |
| `template_password_reset` | Sends temp password on reset |
| `template_account_approved` | Notifies faculty of approval |
| `template_account_rejected` | Notifies faculty of rejection |
| `template_quiz_result` | Sends quiz score to student |
| `template_announcement` | Class-wide announcements |

### Template Variables Available:
- `{{to_name}}` — Recipient's full name
- `{{to_email}}` — Recipient's email address
- `{{temp_password}}` — Temporary password (for welcome/reset)
- `{{institution}}` — School/institution name
- `{{login_url}}` — URL to login page
- `{{quiz_title}}`, `{{score}}`, `{{total}}`, `{{percentage}}`, `{{grade}}`
- `{{faculty_name}}`, `{{class_name}}`, `{{message}}`

### Step 4 — Configure in App
Go to **Settings → EmailJS Configuration** in the app and enter:
- Your **Public Key** (Account → API Keys)
- Your **Service ID**

---

## 📱 PWA Installation (Mobile App)

1. Open the app in Chrome on Android or Safari on iOS
2. You'll see an **"Install"** banner at the bottom
3. Tap Install to add it to your home screen
4. The app works **fully offline** — data syncs when back online

For desktop: Chrome shows an install icon in the address bar.

---

## 🌐 Indian Language Support

The app uses Claude AI for real-time translation. Select any language from the language pills:

- हिंदी (Hindi)
- मराठी (Marathi)  
- ಕನ್ನಡ (Kannada)
- தமிழ் (Tamil)
- తెలుగు (Telugu)
- বাংলা (Bengali)
- ગુજરાતી (Gujarati)
- ਪੰਜਾਬੀ (Punjabi)

---

## 📊 NBA CO-PO Matrix

The CO-PO matrix supports NBA accreditation documentation:
- Click any cell to cycle through mapping levels (0-3)
- AI analysis provides improvement suggestions
- Export to PDF with one click
- Supports B.Ed., M.Ed., B.Sc., B.Tech. programmes

---

## 🏗️ Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)
```bash
# Just upload the entire folder — it's 100% static HTML/CSS/JS
```

### Option 2: Local Server
```bash
# Python
python3 -m http.server 3000

# Node.js
npx serve .
```

> **Note:** Service Worker requires HTTPS in production (or localhost for development).

---

## 🔧 Architecture

```
brisklearn/
├── index.html          — App shell, PWA manifest link
├── manifest.json       — PWA manifest
├── sw.js               — Service Worker (offline caching + background sync)
├── css/
│   └── main.css        — Complete styling (dark mode, responsive)
├── js/
│   ├── db.js           — IndexedDB offline storage
│   ├── auth.js         — Login, session, role management
│   ├── emailjs.js      — EmailJS email notifications
│   ├── pwa.js          — PWA install + offline detection
│   ├── lang.js         — Indian language translation (Claude API)
│   ├── pdf-export.js   — jsPDF export (PDF + Google Docs)
│   └── app.js          — Full application (all pages, routing, AI)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### Data Storage
- **IndexedDB** — All data stored locally for offline-first operation
- **Background Sync** — Pending operations sync when connectivity returns
- **No backend required** — Fully client-side for demo; connect your own API for production

---

## 🔐 Security Notes

For production deployment:
1. Move password hashing to a backend (use bcrypt)
2. Store Anthropic API key server-side
3. Use real JWT tokens with expiry
4. Implement rate limiting on AI endpoints

---

## 📄 License
Built with BriskLearn LMS Framework — AI-Powered Education for India
