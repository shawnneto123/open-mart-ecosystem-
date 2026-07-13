# OpenMart Installation & Quick Start

Get OpenMart running locally in 5 minutes.

## System Requirements

- **Node.js** 16+ (download from https://nodejs.org)
- **npm** 8+ (comes with Node.js)
- **Git** (optional, for version control)

Check your versions:
```bash
node --version  # Should be v16.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## Installation Steps

### 1. **Download & Extract**

Download the `openmart-production-v2.zip` file and extract:
```bash
# macOS/Linux
unzip openmart-production-v2.zip
cd openmart-production

# Windows: Use Explorer to extract, then open Command Prompt/PowerShell
cd openmart-production
```

### 2. **Install Dependencies**

```bash
npm install
```

This downloads all required packages (takes 2-5 minutes depending on internet speed).

### 3. **Create Environment File**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your business information:
```env
# Business Info
VITE_BUSINESS_NAME=My Corner Shop
VITE_BUSINESS_PHONE=+2348091234567
VITE_BUSINESS_EMAIL=shop@example.com

# Payment (optional)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx

# WhatsApp (required for WhatsApp payments)
VITE_WHATSAPP_BUSINESS_NUMBER=2348091234567

# API (for future backend)
VITE_API_URL=https://api.example.com

# Checkout Settings (Nigeria defaults)
VITE_TAX_RATE=0.075
VITE_SHIPPING_COST=500
VITE_CURRENCY=NGN
```

### 4. **Start Development Server**

```bash
npm run dev
```

Open browser to: **http://localhost:5173**

You should see the OpenMart homepage! 🎉

---

## First Time Setup

### Add Sample Inventory

1. Go to **Admin Dashboard** (click Settings ⚙️ in navbar)
2. Click **Upload Inventory File**
3. Create a `sample.txt` file with items in this format:
   ```
   Milo 400g - 50
   Golden Penny Spaghetti - 100
   Rice 10kg - 30
   Bread - 200
   Milk 1L - 75
   Eggs - 120
   ```
4. Upload the file → Items are auto-categorized and priced
5. View products on homepage!

### Manual Item Entry

1. Stay in Admin → Inventory tab
2. Use "Add New Item" form
3. Enter: Item name, Quantity, Price (optional)
4. Click "Add Item"

### Configure Payments

**Option 1: WhatsApp Only** (Recommended for testing)
- Set `VITE_WHATSAPP_BUSINESS_NUMBER` in `.env`
- Customers click "Checkout" → Opens WhatsApp with order details
- No additional setup needed!

**Option 2: Paystack** (Production payment)
1. Create Paystack account at https://paystack.com
2. Get Public Key from Settings
3. Add to `.env`: `VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx`

**Option 3: Flutterwave** (Alternative payment)
1. Create Flutterwave account at https://flutterwave.com
2. Get Public Key
3. Add to `.env`: `VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE_xxxxx`

---

## Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run preview      # Preview production build locally

# Production
npm run build        # Create optimized build in ./dist

# Mobile/Capacitor (APK)
npm install          # Install all dependencies including Capacitor
npm run cap:add:android      # Initialize Android project
npm run cap:sync             # Sync web build to Android
npm run apk:debug            # Build debug APK
npm run apk:release          # Build release APK for Play Store

# Code Quality
npm run lint         # Check code for issues
npm run type-check   # TypeScript validation
```

---

## Project Structure

```
openmart-production/
├── src/
│   ├── components/          # React components
│   │   ├── HomePage.jsx     # Product catalog
│   │   ├── Cart.jsx         # Shopping cart
│   │   ├── Checkout.jsx     # Order checkout
│   │   ├── OrderHistory.jsx # Order tracking
│   │   ├── AdminPage.jsx    # Admin dashboard
│   │   └── Navbar.jsx       # Navigation
│   ├── stores/              # Zustand state management
│   │   ├── inventoryStore.js
│   │   ├── cartStore.js
│   │   └── orderStore.js
│   ├── utils/               # Helper functions
│   │   ├── textParser.js    # CSV/TXT parsing
│   │   ├── categoryHelper.js
│   │   ├── imageHelper.js
│   │   ├── paymentIntegration.js
│   │   └── whatsappIntegration.js
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS
├── public/
│   ├── manifest.json        # PWA metadata
│   └── favicon.ico          # App icon (optional)
├── android/                 # Native Android project (after cap add android)
├── index.html               # HTML template
├── vite.config.js          # Vite bundler config
├── tailwind.config.js      # Tailwind CSS config
├── capacitor.config.json   # Mobile app config
├── package.json            # Dependencies & scripts
├── .env.example            # Environment template
└── README.md               # Full documentation
```

---

## Features Overview

### 👥 Admin Dashboard
- Upload inventory from text file
- Add/edit/delete products
- View sales analytics
- Export orders as CSV
- Real-time stock tracking

### 🛍️ Shopping
- Browse products by category
- Search functionality
- Product images from Unsplash
- Auto-price generation based on product type
- Add to cart with quantity control

### 🛒 Cart & Checkout
- Persistent cart (saves even if you close browser)
- Real-time subtotal, tax (7.5%), shipping (₦500)
- Order summaries with customer info
- Multiple payment methods

### 💳 Payments
- **WhatsApp**: Send itemized receipts via WhatsApp
- **Paystack**: Credit/debit card, bank transfer
- **Flutterwave**: Mobile money, card, bank
- **Bank Transfer**: Manual payment details

### 📊 Orders
- Track order status (pending → completed)
- View payment status
- Customer order history
- Export analytics

---

## Troubleshooting

### "npm: command not found"
Install Node.js from https://nodejs.org

### Port 5173 already in use
```bash
# Kill the process or use different port
npm run dev -- --port 3000
```

### Images not loading
- Check internet connection
- Unsplash API may be rate-limited
- App falls back to colored emoji SVGs automatically

### Inventory file upload fails
Ensure file is `.txt` format with items like: `Item Name - Quantity`

### Payment not working
1. Check `.env` has correct keys
2. Verify Paystack/Flutterwave accounts are activated
3. Test with WhatsApp first (no setup needed)

### "Can't find module 'xyz'"
```bash
rm -rf node_modules
npm install
npm run dev
```

### Styles not applying (Tailwind)
```bash
npm run build  # Rebuild to regenerate Tailwind CSS
```

---

## Performance Tips

1. **Optimize Images**
   - Product images use Unsplash (free CDN)
   - Falls back to SVG if unreachable
   
2. **Data Persistence**
   - Uses localStorage for cart (5MB limit)
   - Automatically syncs with IndexedDB for large orders
   
3. **Production Build**
   - Run `npm run build` to create optimized dist/
   - Minified, tree-shaken, code-split
   - Ready for deployment to Vercel, Netlify, etc.

---

## Next Steps

1. **Customize Branding**
   - Edit `.env` with your shop name, colors
   - Update logo in `Navbar.jsx`
   - Change `tailwind.config.js` colors (primary: green → your color)

2. **Deploy to Web**
   - Vercel: `npm install -g vercel && vercel`
   - Netlify: Drag & drop `dist/` folder
   - Self-hosted: Upload `dist/` to your server

3. **Build for Mobile**
   - Follow `MOBILE_BUILD.md` guide
   - Submit to Play Store / App Store
   - Target: 1M+ downloads!

4. **Add Backend** (Optional)
   - Connect to real payment gateway webhooks
   - Store orders in database
   - Enable SMS notifications
   - Multi-location support

---

## Getting Help

- **Docs**: Read `README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`
- **Mobile**: See `MOBILE_BUILD.md` for APK building
- **Payment Setup**: Check `README.md` payment integration section
- **Capacitor Issues**: https://capacitorjs.com/docs

---

**You're all set!** 🚀 Start building your online shop.

For questions or issues, refer to documentation or check the source code comments.

Happy selling! 💰
