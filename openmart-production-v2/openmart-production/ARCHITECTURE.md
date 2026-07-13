# 🏗️ OpenMart Architecture - Production Edition

## System Overview

OpenMart is a full-stack e-commerce platform built with:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **State**: Zustand with localStorage persistence
- **Payments**: Paystack, Flutterwave, Bank Transfer, WhatsApp
- **Deployment**: Vercel, Netlify, or Self-hosted

## 🎯 Core Architecture

```
┌─────────────────────────────────────────────────────┐
│                   OpenMart App                       │
│                    (React + Vite)                    │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐
   │  Pages  │  │Components │  │  Stores  │
   ├─────────┤  ├───────────┤  ├─────────┤
   │ Home    │  │ Cart      │  │Inventory│
   │ Cart    │  │ Checkout  │  │Cart     │
   │Checkout │  │ Orders    │  │Orders   │
   │ Orders  │  │ Navbar    │  │Auth     │
   └────┬────┘  └─────┬─────┘  └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┬────────────┐
        │              │              │            │
   ┌────▼─────┐  ┌────▼────┐  ┌─────▼──┐  ┌─────▼──┐
   │Utilities │  │ Storage │  │Payment │  │ External
   ├──────────┤  ├─────────┤  ├────────┤  │  APIs
   │Payments  │  │localStorage│Paystack│  ├────────┤
   │WhatsApp  │  │IndexedDB   │Flutter │  │Paystack
   │Form Val. │  │  (Future)  │Bank API│  │Flutter
   │Formatters│  │            │        │  │WhatsApp
   └──────────┘  └────────────┘────────┘  │ Email
                                           └────────┘
```

## 📊 Data Flow Architecture

### Shopping Flow
```
User browsing products
        ↓
Add to cart (useCartStore)
        ↓
Cart persists to localStorage
        ↓
User proceeds to checkout
        ↓
Enter customer info + payment method
        ↓
Create order (useOrderStore)
        ↓
Order saved to localStorage
        ↓
Generate payment link/message
        ↓
Redirect to payment provider
        ↓
Payment confirmation received
        ↓
Update order status
        ↓
Show success message
        ↓
Send WhatsApp confirmation
```

### State Management
```
Zustand Store (with persist middleware)
    ├── In-memory state
    ├── Auto-save to localStorage on change
    ├── Auto-restore on app load
    └── Subscribe to changes in React components
```

## 🛒 Component Hierarchy

```
App
├── Navbar
│   ├── Logo/Brand
│   ├── Navigation Links
│   ├── Cart Icon (with count)
│   └── Mobile Menu
├── Routes
│   ├── HomePage
│   │   ├── Hero Section
│   │   ├── Features
│   │   └── CTA Buttons
│   │
│   ├── CartPage
│   │   ├── Cart Items List
│   │   │   └── Item Card (qty controls, delete)
│   │   └── Cart Summary
│   │
│   ├── CheckoutPage
│   │   ├── Billing Form
│   │   ├── Payment Method Selection
│   │   └── Order Summary
│   │
│   ├── OrderHistoryPage
│   │   ├── Stats Dashboard
│   │   ├── Orders Table
│   │   └── Order Details (expandable)
│   │
│   └── AdminPage (extensible)
│       ├── Dashboard
│       ├── Inventory Management
│       └── Order Management
└── Footer
```

## 💾 Storage Architecture

### localStorage Structure
```javascript
// Zustand automatically manages these:

localStorage['openmart_inventory'] = {
  version: 1,
  state: {
    items: [...],
    lastUpdated: "2024-01-15T10:30:00Z"
  }
}

localStorage['openmart_cart'] = {
  version: 1,
  state: {
    items: [...],
    updatedAt: "2024-01-15T10:30:00Z"
  }
}

localStorage['openmart_orders'] = {
  version: 1,
  state: {
    orders: [...],
    currentOrder: null
  }
}
```

### Future: IndexedDB (Larger Storage)
```javascript
// For large inventory:
openmart_db
├── inventory_store
│   └── [items...]
├── orders_store
│   └── [orders...]
└── cache_store
    └── [images...]
```

## 🔄 State Management Deep Dive

### Zustand Middleware
```javascript
create(
  persist(
    (set, get) => ({
      // State
      items: [],
      
      // Actions
      addItem: (item) => set(state => ({...})),
      
      // Selectors
      getStats: () => {...}
    }),
    {
      name: 'storage_key',
      version: 1,
      // Supports:
      // - localStorage (default)
      // - sessionStorage
      // - IndexedDB (via custom implementation)
    }
  )
)
```

### Store Subscriptions
```javascript
// Components subscribe automatically
const { items, addItem } = useCartStore();

// Manual subscription (advanced)
useCartStore.subscribe(
  state => state.items,
  (items) => console.log('Items changed:', items)
);
```

## 🎯 Payment Flow Architecture

### Payment Provider Integration

```
┌─────────────────────────────────────────┐
│       Checkout Component                 │
│  ┌─────────────────────────────────┐    │
│  │ 1. User selects payment method  │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼──────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────┬────────────┐
        │                    │              │            │
   ┌────▼────┐        ┌─────▼────┐   ┌────▼────┐  ┌───▼───┐
   │WhatsApp │        │Paystack  │   │Flutterw │  │Bank   │
   │─────────│        │──────────│   │─────────│  │──────│
   │1.Format │        │1.Init SDK│   │1.Init SDK  │1.Display│
   │2.Gen msg│        │2.Open UI │   │2.Open UI   │2.Copy   │
   │3.Link   │        │3.Verify  │   │3.Verify    │3.Wait   │
   │4.Open   │        │4.Update  │   │4.Update    │manual  │
   └────┬────┘        │  order   │   │  order     │confirm │
        │             └─────┬────┘   └────┬────┘  └───┬───┘
        └─────────────────┬─┴─────────────┬───────────┘
                          │
                    ┌─────▼─────┐
                    │useOrderStore
                    │.updateOrder
                    │Status()
                    └─────┬─────┘
                          │
                    ┌─────▼──────────┐
                    │Show confirmation│
                    │Redirect to      │
                    │order history    │
                    └────────────────┘
```

## 🔐 Security Architecture

### Input Validation
```javascript
// All user inputs validated before use:
useForm({
  resolver: zodResolver(checkoutSchema),
  // Prevents XSS, SQL injection, etc.
})
```

### Data Protection
```javascript
// Never store sensitive data in localStorage:
localStorage.openmart_cart // OK - product IDs only
localStorage.payment_key   // NOT OK - sensitive!

// Use secure storage:
- Environment variables for API keys
- Backend for payment processing
- HttpOnly cookies for auth tokens
```

### API Security (When Backend Added)
```javascript
// Principles:
1. Validate on backend (never trust frontend)
2. Rate limiting for payment endpoints
3. JWT tokens for authentication
4. CORS whitelist configured
5. Content Security Policy headers
```

## 📈 Scalability Considerations

### Current (Frontend-only)
- Fits on: Vercel, Netlify (free)
- Storage: 5-10MB (browser limit)
- Users: Unlimited (no server)
- Concurrency: No issues

### Phase 2 (Add Backend)
- Database: MongoDB, Firebase, PostgreSQL
- API Server: Node.js, Python, Go
- Storage: S3, Google Cloud Storage
- Users: Thousands/second

### Phase 3 (Enterprise)
- Microservices: Separate payment, inventory, orders services
- Message Queue: RabbitMQ, Apache Kafka
- Cache Layer: Redis
- CDN: CloudFront, Cloudflare
- Search: Elasticsearch

## 🧪 Testing Architecture

### Unit Tests (Jest)
```javascript
// Test individual functions
test('Cart store adds items correctly', () => {
  const store = useCartStore();
  store.addToCart(product, 2);
  expect(store.items).toHaveLength(1);
});
```

### Component Tests (React Testing Library)
```javascript
// Test component behavior
test('Checkout form validates required fields', () => {
  render(<Checkout />);
  expect(screen.getByText('Name is required'));
});
```

### Integration Tests (Cypress)
```javascript
// Test full user flow
describe('Shopping flow', () => {
  it('should create order successfully', () => {
    cy.visit('/');
    cy.contains('Add to cart').click();
    cy.contains('Checkout').click();
    cy.fillCheckoutForm();
    cy.contains('Complete Order').click();
    cy.contains('Order Placed!').should('be.visible');
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
```javascript
// Vite automatically chunks code:
dist/
├── index.xxxxx.js      (main bundle)
├── cart.xxxxx.js       (code split)
├── checkout.xxxxx.js   (code split)
└── vendors.xxxxx.js    (dependencies)
```

### Image Optimization
```javascript
// Use optimized images only:
- WebP format (smaller than JPG/PNG)
- Lazy loading via native HTML
- Proper sizing for mobile/desktop
```

### Caching Strategy
```javascript
Static assets: 30 days cache
├── JS, CSS: hash-based invalidation
└── Images: long-term cache

HTML: No cache
├── Always fetch fresh
└── Check for app updates

API responses (future backend):
├── Orders: 5 min cache
└── Products: 1 hour cache
```

## 📊 Monitoring & Analytics

### Frontend Monitoring
```javascript
// Error tracking (future):
Sentry, LogRocket, or Rollbar

// Analytics:
Google Analytics
Custom event tracking
```

### Backend Monitoring (Future)
```javascript
// Application monitoring:
Datadog, New Relic, Elastic Stack

// Performance:
Response times
Error rates
Throughput
```

## 🔄 Update & Deployment Strategy

### Frontend Updates
```
1. Develop locally
2. Test in staging
3. Build for production (npm run build)
4. Deploy to Vercel/Netlify/Self-hosted
5. Verify in production
6. Monitor error logs
```

### Zero-Downtime Deployment
```javascript
// Current approach:
- Static files only (no server downtime)
- Service Worker (future)
- Blue-green deployment (self-hosted)
```

## 📝 Code Organization Principles

### File Structure Logic
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components (future)
├── stores/        # Zustand store definitions
├── utils/         # Helper functions
├── hooks/         # Custom React hooks (future)
├── types/         # TypeScript types (future)
└── styles/        # Global styles
```

### Module Dependencies
```
components/      (depends on)  stores/ + utils/
pages/          (depends on)  components/
stores/         (depends on)  nothing
utils/          (depends on)  nothing
App.jsx         (depends on)  everything

Rule: Never create circular dependencies
```

## 🎓 Key Concepts

### Immutability
```javascript
// Always return new objects/arrays:
set((state) => ({
  items: [...state.items, newItem]  // ✅ Good
}));

// NOT:
state.items.push(newItem);  // ❌ Bad
```

### Separation of Concerns
```
Store = Data/Logic
Component = UI/Rendering
Utils = Pure Functions
```

### DRY (Don't Repeat Yourself)
```javascript
// Extract repeated logic to utils/hooks
// Create reusable components
// Use composition over inheritance
```

---

**Architecture designed for growth. Start simple, scale easily. 🚀**
