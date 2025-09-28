# Checkout V2 Invoice System - Setup Summary

## ✅ What's Been Created

### **File Structure**
```
js/modules/
├── checkout-v1/                    # Preserved original system
│   ├── CheckoutPage.js            # Immediate Stripe Checkout
│   ├── CheckoutPageCustom.js      # Custom amount checkout
│   ├── CheckoutPageFree.js        # Free consultation
│   ├── PaymentSuccess.js          # Credit card success page
│   └── PaymentCancel.js           # Payment cancellation
├── checkout-v2/                    # New invoice-based system
│   ├── InvoiceRequestPage.js      # Standard deposit invoices
│   ├── CustomInvoiceRequest.js    # Custom amount invoices
│   ├── InvoiceStatusPage.js       # Real-time status tracking
│   └── InvoiceSuccessPage.js      # Invoice payment confirmation
└── SalesFunnelForm.js             # Shared between both systems
```

### **Page Entry Points**
```
js/pages/
├── checkout.js                    # → checkout-v1/CheckoutPage.js
├── checkout-custom.js             # → checkout-v1/CheckoutPageCustom.js
├── checkout-free.js               # → checkout-v1/CheckoutPageFree.js
├── payment-success.js             # → checkout-v1/PaymentSuccess.js
├── payment-cancel.js              # → checkout-v1/PaymentCancel.js
├── invoice-request.js             # → checkout-v2/InvoiceRequestPage.js
├── custom-invoice.js              # → checkout-v2/CustomInvoiceRequest.js
├── invoice-status.js              # → checkout-v2/InvoiceStatusPage.js
└── invoice-success.js             # → checkout-v2/InvoiceSuccessPage.js
```

## 🔄 How to Switch Between Systems

### **Current State: V1 Active**
- All existing pages (`checkout.html`, `payment-success.html`, etc.) use the **V1 immediate payment system**
- No changes to existing URLs or user experience
- V1 system preserved exactly as it was

### **To Test V2 Invoice System**
Create new HTML pages or update existing ones to use V2 modules:

**Option A: Create New Pages**
```html
<!-- invoice-request.html -->
<script type="module" src="js/pages/invoice-request.js"></script>

<!-- custom-invoice.html -->
<script type="module" src="js/pages/custom-invoice.js"></script>

<!-- invoice-status.html -->
<script type="module" src="js/pages/invoice-status.js"></script>

<!-- invoice-success.html -->
<script type="module" src="js/pages/invoice-success.js"></script>
```

**Option B: Switch Existing Pages**
```html
<!-- In checkout.html, change: -->
<script type="module" src="js/pages/checkout.js"></script>
<!-- To: -->
<script type="module" src="js/pages/invoice-request.js"></script>
```

## 🔧 Backend Requirements

### **PHP Backend Integration**
The V2 system requires the backend endpoints from `docs/fn-stripe-payment.php`:

1. **`/wp-json/cmm/v1/create-stripe-invoice`** - Creates Stripe invoices
2. **Webhook handling** for `invoice.payment_succeeded` events
3. **Message updates** to track invoice status

### **Message Types Added**
The polymorphic message system now supports:
- `pending_invoice` - For invoice requests
- Invoice status fields: `invoice_status`, `stripe_invoice_id`, `invoice_amount`, etc.

## 🎯 User Flow Differences

### **V1 Flow (Current)**
```
Customer → Select Deposit → Stripe Checkout → Immediate Payment → Success
```

### **V2 Flow (New)**
```
Customer → Select Deposit → Request Invoice → Email Sent → Customer Pays Later → Success
```

## 💡 Key Features of V2 System

### **InvoiceRequestPage.js**
- Same deposit options as V1 ($99, $250, $500, $50)
- Creates `pending_invoice` message
- Triggers Stripe Invoice API
- Redirects to status tracking

### **CustomInvoiceRequest.js**
- Custom amount input ($50-$5000 range)
- Detailed service description
- Rich project information form
- Creates structured HTML in `detailed_message`

### **InvoiceStatusPage.js**
- Real-time status polling every 5 seconds
- Shows: pending → sent → paid → success
- Automatic redirect when paid
- Timeout handling after 5 minutes

### **InvoiceSuccessPage.js**
- Displays final payment confirmation
- Shows invoice details and receipt links
- Project next steps based on service type
- Complete analytics tracking

## 🔄 Quick Switch Instructions

### **To Enable V2 System Immediately**
1. Update `js/pages/checkout.js`:
   ```javascript
   // Change line 5 from:
   import CheckoutPage from '../modules/checkout-v1/CheckoutPage.js';
   // To:
   import InvoiceRequestPage from '../modules/checkout-v2/InvoiceRequestPage.js';
   ```

2. Update `js/pages/payment-success.js`:
   ```javascript
   // Change line 5 from:
   import PaymentSuccess from '../modules/checkout-v1/PaymentSuccess.js';
   // To:
   import InvoiceSuccessPage from '../modules/checkout-v2/InvoiceSuccessPage.js';
   ```

### **To Revert to V1 System**
Simply change the imports back to the `checkout-v1/` modules.

## 📋 Next Steps

1. **Test V2 System**: Create test HTML pages with V2 page imports
2. **Backend Setup**: Implement the PHP endpoints from the security guide
3. **HTML Templates**: Create UI templates for the new invoice pages
4. **CSS Integration**: V2 can reuse existing checkout styles
5. **Production Switch**: When ready, update page imports to use V2

## 🛡️ Security Considerations

The V2 system is designed to work with the security-hardened backend from `docs/STRIPE_SECURITY_HARDENING_GUIDE.md`:
- CSRF token validation
- Rate limiting for guest users
- Input sanitization and validation
- Webhook signature verification

## 🎨 Styling Notes

V2 modules are designed to reuse existing checkout SCSS:
- Same CSS classes and structure as V1
- Compatible with existing Bootstrap components
- Same notification and loading state patterns
- Consistent with current design system

This setup gives you complete flexibility to test, deploy, and switch between the immediate payment system (V1) and the professional invoice system (V2) without losing any existing functionality.