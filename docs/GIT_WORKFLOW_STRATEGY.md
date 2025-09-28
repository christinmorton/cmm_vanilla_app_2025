# Git Workflow Strategy & Branch Architecture
**Established September 27, 2025**

---

## 🎯 **Current Branch Structure**

### **✅ Established Branches:**
```
main (production-ready baseline)
├── develop (integration/staging)
├── feature/digital-ocean-deployment-updates (current work - deployment optimizations)
├── feature/checkout-v1-backup (backup of current checkout system)
├── feature/checkout-v2-invoice-system (NEW - invoice-based implementation)
├── feature/production-branch-cleanup (NEW - remove docs/debug files)
├── feature/ui-rework (UI improvements)
├── feature/build-time-content-generation (content generation features)
└── deploy/digital-ocean-setup (deploy configuration)
```

### **🔄 Current Working State:**
- **Active Branch**: `feature/digital-ocean-deployment-updates`
- **Status**: Clean working tree, up-to-date with remote
- **Recent Work**: Checkout V1 system implementation and bug fixes

---

## 🚀 **Recommended Git Workflow**

### **Branch Types & Purposes:**

#### **1. Core Branches**
- **`main`** - Production-ready code, tagged releases
- **`develop`** - Integration branch, staging environment
- **`deploy/*`** - Deployment-specific configurations

#### **2. Feature Branches**
- **`feature/*`** - New features and major improvements
- **`bugfix/*`** - Bug fixes and small corrections
- **`hotfix/*`** - Emergency production fixes

#### **3. Specialized Branches (Current Project)**
- **`feature/checkout-v1-backup`** - Preserve current checkout system
- **`feature/checkout-v2-invoice-system`** - New invoice-based approach
- **`feature/production-branch-cleanup`** - Remove docs/debug files for deployment

---

## 📋 **Implementation Strategy for V2 Checkout**

### **Phase 1: Parallel Development (Current)**
```
feature/digital-ocean-deployment-updates (continue current work)
├── Continue debugging production checkout issues
├── Address vite.config and deployment concerns
└── Maintain stability while planning V2

feature/checkout-v2-invoice-system (new implementation)
├── Implement invoice-based message system
├── Create Stripe invoice integration
└── Build simplified frontend flow

feature/production-branch-cleanup (optimization)
├── Remove docs/ directory from production
├── Remove design_system/ debug files
├── Remove headless_api/ documentation
└── Create lean deployment branch
```

### **Phase 2: Integration Strategy**
```
1. Complete V2 implementation in feature/checkout-v2-invoice-system
2. Test V2 thoroughly in isolation
3. Merge production cleanup changes
4. Create production deployment branch
5. Deploy V2 system with clean codebase
```

---

## 🔧 **Workflow Commands**

### **Branch Management:**
```bash
# Switch between development branches
git checkout feature/checkout-v2-invoice-system     # Work on V2 implementation
git checkout feature/production-branch-cleanup      # Clean up production files
git checkout feature/digital-ocean-deployment-updates # Continue current work

# Keep branches synchronized
git fetch origin
git merge origin/main  # Pull latest changes into feature branch

# Backup important work
git checkout -b feature/backup-$(date +%Y%m%d) # Create timestamped backup
```

### **Development Workflow:**
```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
git push origin feature/your-feature-name

# Regular development
git add .
git commit -m "descriptive commit message"
git push origin feature/your-feature-name

# Prepare for merge
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main  # Resolve any conflicts
git push origin feature/your-feature-name
```

---

## 🎯 **Specific Strategy for Checkout V2 Implementation**

### **Step 1: File Removal Strategy**
**Branch**: `feature/production-branch-cleanup`

**Files to Remove for Production:**
```bash
# Documentation directories (development only)
rm -rf docs/
rm -rf design_system/
rm -rf headless_api/CHECKOUT_*.md
rm -rf headless_api/payment_processing_plan.md

# V1 Checkout files (being replaced)
rm checkout.html
rm checkout-free.html
rm checkout-custom.html
rm js/modules/CheckoutPage.js
rm js/modules/CheckoutPageFree.js
rm js/modules/CheckoutPageCustom.js
rm js/pages/checkout.js
rm js/pages/checkout-free.js
rm js/pages/checkout-custom.js

# Update vite.config.js to remove checkout entries
# Update navigation to remove checkout links
```

**Files to Keep:**
```bash
# Core application
index.html, about.html, service.html, contact.html
js/main.js, js/core.js, js/modules/SalesFunnelForm.js
scss/main.scss, styles.css

# Enhanced thank you system
thank-you.html, consultation-thank-you.html, quote-thank-you.html

# Essential documentation
README.md, CLAUDE.md, package.json, vite.config.js

# Backend integration
headless_api/API_DOCUMENTATION.md (essential)
headless_api/stripe-webhook-handler.php (if using)
```

### **Step 2: V2 Implementation Strategy**
**Branch**: `feature/checkout-v2-invoice-system`

**New Files to Create:**
```javascript
// Enhanced SalesFunnelForm.js with invoice generation
// Enhanced thank you pages with invoice messaging
// WordPress PHP functions for Stripe invoice creation
// Database schema updates for invoice tracking
```

**Modified Files:**
```javascript
// js/modules/SalesFunnelForm.js - Add invoice data generation
// thank-you.html - Enhanced messaging for invoice flow
// consultation-thank-you.html - Add invoice CTAs
// quote-thank-you.html - Add invoice expectations
```

### **Step 3: Merge Strategy**
```bash
# 1. Complete both feature branches
git checkout feature/production-branch-cleanup
# ... complete file removal and optimization

git checkout feature/checkout-v2-invoice-system
# ... complete V2 implementation

# 2. Create deployment branch from clean production
git checkout feature/production-branch-cleanup
git checkout -b production/v2-invoice-deployment

# 3. Merge V2 features into clean production branch
git merge feature/checkout-v2-invoice-system

# 4. Test complete deployment
npm run build
# Test all functionality

# 5. Deploy to production
git checkout main
git merge production/v2-invoice-deployment
git tag v2.0.0-invoice-system
git push origin main --tags
```

---

## 📊 **Branch Status Tracking**

### **Current Status:**
| Branch | Status | Purpose | Ready for |
|--------|--------|---------|-----------|
| `main` | ✅ Stable | Production baseline | Deployment |
| `develop` | ✅ Stable | Integration | Staging |
| `feature/digital-ocean-deployment-updates` | 🟡 Active | Current work | Continuation |
| `feature/checkout-v1-backup` | ✅ Backup | Preserve current checkout | Archive |
| `feature/checkout-v2-invoice-system` | 🟢 Ready | V2 implementation | Development |
| `feature/production-branch-cleanup` | 🟢 Ready | File removal | Cleanup |

### **Next Actions:**
1. **Continue current work** in `feature/digital-ocean-deployment-updates`
2. **Start V2 implementation** in `feature/checkout-v2-invoice-system`
3. **Plan production cleanup** in `feature/production-branch-cleanup`
4. **Maintain V1 backup** in `feature/checkout-v1-backup` for rollback capability

---

## ⚠️ **Important Git Rules**

### **Protection Rules:**
- **Never force push** to `main` or `develop`
- **Always create pull requests** for merges to `main`
- **Test thoroughly** before merging feature branches
- **Tag releases** with semantic versioning

### **Commit Message Standards:**
```
feat: add stripe invoice integration
fix: resolve checkout validation error
docs: update git workflow strategy
refactor: simplify checkout system architecture
perf: optimize production build size
```

### **Branch Naming Conventions:**
```
feature/description-of-feature
bugfix/issue-description
hotfix/critical-fix-description
release/version-number
deploy/environment-name
```

---

## 🔄 **Migration Path: V1 → V2**

### **Rollback Strategy:**
```bash
# If V2 fails, rollback to V1
git checkout feature/checkout-v1-backup
git checkout -b hotfix/rollback-to-v1
git checkout main
git merge hotfix/rollback-to-v1
```

### **Feature Flags (Optional):**
```javascript
// Environment-based feature switching
const useInvoiceSystem = process.env.NODE_ENV === 'production' &&
                        process.env.ENABLE_INVOICE_SYSTEM === 'true';

if (useInvoiceSystem) {
    // Use V2 invoice system
} else {
    // Fall back to V1 checkout
}
```

### **Gradual Migration:**
1. **Deploy V2 alongside V1** (both systems working)
2. **A/B test** conversion rates between systems
3. **Gradually migrate users** to V2 system
4. **Remove V1** once V2 is proven stable

---

## 📋 **Development Checklist**

### **Before Starting V2 Development:**
- [x] ✅ Create backup branch (`feature/checkout-v1-backup`)
- [x] ✅ Create V2 implementation branch (`feature/checkout-v2-invoice-system`)
- [x] ✅ Create production cleanup branch (`feature/production-branch-cleanup`)
- [x] ✅ Document git workflow strategy
- [ ] 🔲 Plan database schema changes
- [ ] 🔲 Design Stripe invoice integration
- [ ] 🔲 Update environment configuration

### **During V2 Development:**
- [ ] 🔲 Implement invoice generation in message system
- [ ] 🔲 Create Stripe invoice API integration
- [ ] 🔲 Update frontend forms for invoice flow
- [ ] 🔲 Test end-to-end invoice generation and payment
- [ ] 🔲 Update thank you pages for invoice messaging

### **Before Deployment:**
- [ ] 🔲 Remove development files from production branch
- [ ] 🔲 Test complete invoice workflow
- [ ] 🔲 Verify Stripe webhook integration
- [ ] 🔲 Test rollback procedures
- [ ] 🔲 Update deployment documentation

---

## 🏆 **Success Criteria**

### **Technical Goals:**
- ✅ **Clean git history** with clear feature separation
- ✅ **Rollback capability** to V1 system if needed
- ✅ **Production-ready codebase** without debug files
- ✅ **Simplified architecture** with invoice-based system

### **Business Goals:**
- ✅ **Maintain revenue generation** during transition
- ✅ **Improve security** by eliminating custom checkout endpoints
- ✅ **Reduce maintenance overhead** with Stripe-native invoicing
- ✅ **Professional customer experience** with Stripe invoices

---

**Status**: ✅ **Git Workflow Established**
**Next Phase**: Begin V2 implementation in `feature/checkout-v2-invoice-system`
**Current Branch**: `feature/digital-ocean-deployment-updates` (continue current work)
**Rollback Plan**: `feature/checkout-v1-backup` available for emergency rollback