# OpenMart - Quick Start Reference

## 📦 What You Have

A **production-ready e-commerce platform** for Nigerian corner shops built with:
- React 18 + Vite (ultra-fast development)
- Tailwind CSS (beautiful UI)
- Zustand (state management)
- Capacitor (native Android/iOS apps)
- Paystack + Flutterwave + WhatsApp payments
- Persistent cart & order tracking

**File**: `openmart-production-v2.zip` (54 KB)

---

## 🚀 Get Running in 5 Minutes

### Step 1: Extract & Install
```bash
unzip openmart-production-v2.zip
cd openmart-production
npm install
```

### Step 2: Start Dev Server
```bash
npm run dev
```
→ Opens at **http://localhost:5173** 🎉

### Step 3: Add Sample Products
1. Click **Settings** (⚙️) in top right
2. Upload a `.txt` file with items like:
   ```
   Milo 400g - 50
   Rice 10kg - 30
   Bread - 200
   ```
3. Items auto-categorized & priced!

---

## 🎯 Core Features

### For Shop Owner (Admin)
- 📤 Bulk upload inventory from text file
- ✏️ Add/edit/delete products manually
- 📊 View sales analytics & revenue
- 📥 Export orders as CSV
- 💾 Automatic data persistence

### For Customers
- 🛍️ Browse by category
- 🔍 Search products
- 🛒 Add to cart (saves to device)
- 💳 Multiple payment options
- 📋 Track order status
- 📱 Mobile-friendly interface

---

## 💳 Payment Methods (Easy Setup)

### Option 1: WhatsApp (🎉 Recommended for Testing)
```bash
# In .env file, just set:
VITE_WHATSAPP_BUSINESS_NUMBER=2348091234567
```
✅ No extra setup needed!
✅ Customers can WhatsApp payment proof
✅ Perfect for MVP

### Option 2: Paystack (🏦 Credit/Debit Cards)
1. Sign up: https://paystack.com
2. Get Public Key from Settings
3. Add to `.env`:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
```

### Option 3: Flutterwave (📱 Mobile Money + Cards)
1. Sign up: https://flutterwave.com
2. Get Public Key
3. Add to `.env`:
```env
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE_xxxxx
```

---

## 📱 Build Android APK (For Mobile App)

### Prerequisites
- Java 17+ (or JDK)
- Android SDK
- Gradle

### Build Steps
```bash
# 1. Install Capacitor
npm install

# 2. Initialize Android project
npm run cap:add:android

# 3. Build APK
npm run apk:debug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**For Production (Play Store)**:
```bash
npm run apk:release
```

👉 **Full guide**: See `MOBILE_BUILD.md` in the ZIP

---

## 📂 Project Structure

```
openmart-production/
├── src/components/        # 6 main pages
│   ├── HomePage.jsx       # Product listing (main)
│   ├── Cart.jsx           # Shopping cart
│   ├── Checkout.jsx       # Payment checkout
│   ├── OrderHistory.jsx   # Track orders
│   ├── AdminPage.jsx      # Inventory management
│   └── Navbar.jsx         # Navigation
├── src/stores/            # Zustand state
│   ├── inventoryStore.js  # Products
│   ├── cartStore.js       # Shopping cart
│   └── orderStore.js      # Orders & payments
├── src/utils/             # Helpers
│   ├── textParser.js      # Parse .txt files
│   ├── categoryHelper.js  # Auto-categorization
│   ├── imageHelper.js     # Unsplash integration
│   ├── paymentIntegration.js
│   └── whatsappIntegration.js
└── docs/
    ├── INSTALL.md         # Setup guide
    ├── README.md          # Full documentation
    ├── ARCHITECTURE.md    # System design
    ├── DEPLOYMENT.md      # Deploy to web
    └── MOBILE_BUILD.md    # Build APK/iOS
```

---

## ⚙️ Environment Configuration

Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

Edit with your details:
```env
# Your Shop
VITE_BUSINESS_NAME=My Corner Shop Abuja
VITE_BUSINESS_PHONE=+2348091234567
VITE_BUSINESS_EMAIL=shop@example.com

# WhatsApp (for payment notifications)
VITE_WHATSAPP_BUSINESS_NUMBER=2348091234567

# Payments (optional)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx

# Checkout
VITE_TAX_RATE=0.075          # 7.5% VAT (Nigeria)
VITE_SHIPPING_COST=500       # ₦500 flat shipping
VITE_CURRENCY=NGN            # Nigerian Naira
```

---

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start dev server ✨
npm run preview          # Test production build

# Production Build
npm run build            # Create optimized dist/

# Mobile (Capacitor)
npm run cap:add:android  # Initialize Android project
npm run cap:sync         # Sync web to Android
npm run apk:debug        # Build debug APK
npm run apk:release      # Build release APK

# Code Quality
npm run lint             # Check for errors
npm run type-check       # TypeScript validation
```

---

## 📊 Data Storage

Everything saves locally on the device:
- **Cart**: localStorage (5MB max)
- **Inventory**: localStorage + automatic backup
- **Orders**: IndexedDB (larger capacity)

No backend server needed to start! 
(Optional: Add a backend later for cloud sync)

---

## 🌐 Deploy to Web

### Easy Deployment (30 seconds)

**Vercel** (Recommended)
```bash
npm install -g vercel
npm run build
vercel
```

**Netlify**
```bash
npm run build
# Drag & drop dist/ folder to https://app.netlify.com
```

**Traditional Server** (Apache/Nginx)
```bash
npm run build
# Upload dist/ folder to your server
```

👉 **Full guide**: See `DEPLOYMENT.md`

---

## 🎨 Customize Branding

### Colors
Edit `tailwind.config.js`:
```js
colors: {
  green: '#059669',  // ← Change to your brand color
}
```

### Logo/Name
Edit `src/components/Navbar.jsx`:
```jsx
<span>Your Shop Name</span>  // Change here
```

### Favicon
Replace with your icon at `public/favicon.ico`

---

## 📖 Documentation Files Included

| File | Purpose |
|------|---------|
| `INSTALL.md` | Complete setup guide |
| `README.md` | Full feature documentation |
| `ARCHITECTURE.md` | System design & data flow |
| `DEPLOYMENT.md` | Deploy to Vercel/Netlify/VPS |
| `MOBILE_BUILD.md` | Build Android APK & iOS app |

---

## 🆘 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org

### Images not loading
→ Check internet connection (uses Unsplash API)
→ App falls back to colored emoji SVGs

### Inventory upload fails
→ Use `.txt` format with: `Item Name - Quantity`
→ Max 5MB file size

### Payment not working
→ Check `.env` has correct API keys
→ Test WhatsApp first (no setup needed)

### Port 5173 in use
```bash
npm run dev -- --port 3000
```

---

## 🚀 Next Steps

1. **Extract & Setup** (5 min)
   ```bash
   unzip openmart-production-v2.zip
   cd openmart-production
   npm install && npm run dev
   ```

2. **Customize** (10 min)
   - Edit `.env` with your info
   - Change colors in `tailwind.config.js`
   - Add logo to `public/`

3. **Add Products** (5 min)
   - Admin → Upload inventory file
   - Or manually add items

4. **Test Payments** (5 min)
   - Start with WhatsApp (free)
   - Add Paystack when ready

5. **Deploy** (5 min)
   - `npm run build`
   - Upload to Vercel or Netlify
   - Share link with customers!

6. **Mobile App** (Optional)
   - Follow `MOBILE_BUILD.md`
   - Build APK
   - Submit to Play Store

---

## 📞 Support

- 📖 **Read Documentation**: All guides in the ZIP file
- 🔍 **Check Source Code**: Well-commented React components
- 🛠️ **Troubleshooting**: See INSTALL.md troubleshooting section

---

## 🎁 What's Included

✅ Complete React app with 6 pages
✅ Product catalog with auto-categorization
✅ Shopping cart with persistence
✅ Multiple payment methods
✅ Admin dashboard with analytics
✅ WhatsApp integration (free)
✅ Mobile app support (Capacitor)
✅ PWA support (install as app)
✅ Responsive design (mobile-first)
✅ Full documentation

---

## 💰 Pricing Tiers

- **Free Tier**: Dev server + localhost testing
- **Web Hosting**: Vercel/Netlify (~$0/month free tier)
- **Paystack/Flutterwave**: ~2.9% + ₦100/transaction
- **WhatsApp**: Free (you handle payments manually)

**Startup cost**: Just a domain (~₦2,000/year) if you want custom URL

---

## ✨ You're Ready!

Everything is set up and production-ready. Just:
1. Extract the ZIP
2. Run `npm install`
3. Run `npm run dev`
4. Add your products
5. Share with customers!

**Total time to first sale: 30 minutes** ⚡

---

**Built with ❤️ for Nigerian entrepreneurs**

Happy selling! 🚀💰
