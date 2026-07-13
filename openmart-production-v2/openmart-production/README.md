# 🛍️ OpenMart Supermarket - Production Edition

> **A fully-featured, production-ready e-commerce platform for corner shops in Abuja, Nigeria**

Built with React, Vite, Zustand, and Tailwind CSS. Includes cart management, order tracking, WhatsApp integration, and mobile money payment support.

## 🎯 Features

### Core Features
- ✅ **Shopping Cart** - Add/remove items, persistent storage
- ✅ **Checkout** - Multi-step checkout with customer info
- ✅ **Order Management** - Create, track, and manage orders
- ✅ **Order History** - View all orders with filter and export options
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Payment Integration
- ✅ **WhatsApp Integration** - Send orders and payment requests via WhatsApp
- ✅ **Paystack** - Card payments (requires API setup)
- ✅ **Flutterwave** - Multiple payment options (requires API setup)
- ✅ **Bank Transfer** - Direct bank details display
- ✅ **USSD Support** - Mobile money via USSD codes

### Admin Features
- ✅ **Admin Dashboard** - Manage inventory and orders (extensible)
- ✅ **Order Statistics** - View revenue, pending orders, etc.
- ✅ **Export Orders** - CSV export for analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# 1. Clone or extract the project
cd openmart-production

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Update .env.local with your details
# See Configuration section below

# 5. Start development server
npm run dev

# 6. Open browser to http://localhost:5173
```

### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview

# Deploy the dist/ folder to your server
```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file in project root:

```env
# Business Information
VITE_BUSINESS_NAME=OpenMart Supermarket
VITE_BUSINESS_PHONE=+234900000000
VITE_BUSINESS_EMAIL=support@openmart.com

# Payment: Paystack
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
VITE_PAYSTACK_API_KEY=sk_live_xxxxx

# Payment: Flutterwave
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx
VITE_FLUTTERWAVE_API_KEY=FLWSECK_TEST_xxxxx

# Bank Details
VITE_BANK_NAME=Access Bank
VITE_BANK_ACCOUNT=0123456789
VITE_BANK_ACCOUNT_NAME=OpenMart Supermarket

# WhatsApp
VITE_WHATSAPP_PHONE=+234900000000
VITE_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/xxxxx
```

## 📦 Project Structure

```
openmart-production/
├── src/
│   ├── components/
│   │   ├── Cart.jsx           # Shopping cart UI
│   │   ├── Checkout.jsx       # Checkout & payment
│   │   ├── OrderHistory.jsx   # Order tracking
│   │   └── ...
│   ├── stores/
│   │   ├── inventoryStore.js  # Inventory state
│   │   ├── cartStore.js       # Cart state
│   │   ├── orderStore.js      # Orders state
│   │   └── authStore.js       # Auth state (future)
│   ├── utils/
│   │   ├── paymentIntegration.js    # Paystack & Flutterwave
│   │   ├── whatsappIntegration.js   # WhatsApp API
│   │   └── ...
│   ├── App.jsx                # Main app & routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── docs/                      # Documentation
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── README.md
```

## 🏗️ Architecture Overview

### State Management (Zustand)

**Inventory Store** - Product inventory
```javascript
useInventoryStore
├── setInventory()
├── updateQuantity()
├── searchItems()
└── getStats()
```

**Cart Store** - Shopping cart
```javascript
useCartStore
├── addToCart()
├── removeFromCart()
├── updateQuantity()
├── getTotalPrice()
└── clearCart()
```

**Order Store** - Order management
```javascript
useOrderStore
├── createOrder()
├── updateOrderStatus()
├── updatePaymentStatus()
└── getOrderStats()
```

### Data Flow

```
User adds item to cart
        ↓
useCartStore.addToCart()
        ↓
localStorage updated (automatic via Zustand persist)
        ↓
Cart component re-renders
        ↓
User proceeds to checkout
        ↓
useOrderStore.createOrder()
        ↓
Order created with pending status
        ↓
WhatsApp link generated
        ↓
Payment method selected
        ↓
Order confirmed & exported
```

## 💳 Payment Integration Guide

### WhatsApp (Free - Recommended)

No setup required! Orders are formatted and sent via WhatsApp.

```javascript
import { generateWhatsAppMessage, getWhatsAppLink } from '../utils/whatsappIntegration';

const message = generateWhatsAppMessage(order);
const link = getWhatsAppLink('+234900000000', message);
window.open(link, '_blank');
```

### Paystack Integration

1. Get API keys from [Paystack Dashboard](https://dashboard.paystack.com)
2. Add to `.env.local`:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
VITE_PAYSTACK_API_KEY=sk_live_xxxxx
```

3. Use in checkout:
```javascript
import { initiatePaystackPayment } from '../utils/paymentIntegration';

await initiatePaystackPayment(order, {
  publicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY
});
```

### Flutterwave Integration

1. Get API keys from [Flutterwave Dashboard](https://app.flutterwave.com)
2. Add to `.env.local`:
```env
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE_xxxxx
VITE_FLUTTERWAVE_API_KEY=FLWSECK_LIVE_xxxxx
```

## 📱 Mobile Money Setup

### USSD Codes (Nigeria)
- **Flutterwave**: *929*01#
- **Paystack**: *737*01#

### Bank Transfer
Add your bank details to `.env.local` and they'll appear in checkout.

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use environment variables** for all sensitive data
3. **API keys in backend** - Never expose API keys in frontend code
4. **Validate user input** - All form data is validated
5. **HTTPS only** - Always use HTTPS in production
6. **Content Security Policy** - Configure CSP headers

## 🚀 Deployment

### Vercel (Recommended - Free)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy the dist/ folder to Netlify
```

### Self-Hosted (VPS/Server)

```bash
# Build
npm run build

# Upload dist/ folder to server
# Configure web server (nginx/Apache) to serve index.html for all routes

# Example nginx config:
location / {
  try_files $uri $uri/ /index.html;
}
```

## 📊 Database & Backend Integration (Future)

Currently uses **localStorage** for development. For production with backend:

```javascript
// Replace localStorage with API calls
// Example with TanStack Query:

import { useQuery, useMutation } from '@tanstack/react-query';

const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => fetch('/api/orders').then(r => r.json())
  });
};
```

Recommended backends:
- **Firebase** - Real-time database
- **Supabase** - Open-source Firebase alternative
- **MongoDB + Express** - Full-stack control

## 📖 API Documentation

### Order Object

```javascript
{
  id: "ORD_1234567890",
  items: [
    {
      itemId: "item_1",
      name: "Milo 400g",
      quantity: 2,
      price: 1500,
      image: "https://..."
    }
  ],
  customerInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+234900000000",
    address: "123 Main St, Lagos"
  },
  status: "pending", // pending, confirmed, completed, cancelled
  paymentStatus: "unpaid", // unpaid, paid, failed
  paymentMethod: "whatsapp", // whatsapp, bank_transfer, paystack, flutterwave
  subtotal: 3000,
  tax: 225,
  shippingCost: 500,
  total: 3725,
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## 🎨 Customization

### Change Brand Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

### Add Custom Pages

1. Create component in `src/components/`
2. Add route in `App.jsx`
3. Add navigation link in `Navbar`

### Modify Checkout Flow

Edit `src/components/Checkout.jsx` to add/remove fields or payment methods.

## 🐛 Troubleshooting

### Cart not persisting
- Check browser localStorage is enabled
- Check console for errors
- Clear browser cache and try again

### Payment not working
- Verify API keys in `.env.local`
- Check Paystack/Flutterwave dashboards
- Test mode vs live mode mismatch

### Orders not appearing
- Check if order was created (check orderStore)
- Try exporting orders as CSV
- Clear browser data and reload

## 📚 Additional Resources

- [React Docs](https://react.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)
- [Paystack Docs](https://paystack.com/docs)
- [Flutterwave Docs](https://developer.flutterwave.com)

## 📝 License

Open source for commercial use. Feel free to modify and deploy.

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Backend API integration
- Advanced admin features
- Analytics dashboard
- Multi-language support
- PWA capabilities

## 📧 Support

For issues and questions:
- Email: support@openmart.com
- WhatsApp: +234 900 000 0000
- Issues: Create GitHub issue

---

**Built with ❤️ for Nigerian businesses. Made in Abuja 🇳🇬**
