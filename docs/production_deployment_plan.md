# Production Deployment Plan - Digital Ocean + GitHub Actions

## Current Project Status

### ✅ Completed
- [x] Vite multi-page application setup with working build process
- [x] Bootstrap 5.3 + custom SCSS styling system
- [x] Three.js animated background implementation
- [x] Working checkout page with Stripe integration
- [x] Contact forms and consultation booking system
- [x] Responsive navigation and mobile-friendly design
- [x] Environment variable configuration in vite.config.js
- [x] Navigation cleanup - removed non-functional blog/portfolio links
- [x] Project moved to deployment branch for production focus

### 🔄 Current State
- **Branch**: `deploy/digital-ocean-setup`
- **Build Tool**: Vite with multi-page configuration
- **Pages Ready**: index.html, about.html, service.html, contact.html, free-consultation.html, checkout.html
- **Features Working**: Contact forms, consultation booking, project discovery, Stripe checkout
- **Content Strategy**: Static HTML pages (no dynamic WordPress integration on this branch)

## Deployment Goal

Deploy the current static multi-page application to Digital Ocean with automated GitHub Actions CI/CD pipeline.

## Deployment Architecture

```
GitHub Repository (deploy branch)
    ↓ (Push/PR trigger)
GitHub Actions Workflow
    ↓ (Build & Deploy)
Digital Ocean Droplet
    ├── Nginx (Web Server)
    ├── Node.js (for build process)
    └── Static Files (dist/)
```

## Implementation Checklist

### Phase 1: Environment & Secrets Setup
- [ ] **Gather Production Values**
  - [ ] WordPress API production URL (if needed for future)
  - [ ] Stripe publishable key (production)
  - [ ] Digital Ocean server details (IP, SSH key, user)
  
- [ ] **Configure GitHub Secrets** (Repository Settings → Secrets)
  - [ ] `WORDPRESS_API_BASE_PROD` - Production WordPress API URL
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY_PROD` - Stripe production key
  - [ ] `DIGITAL_OCEAN_SERVER_HOST` - Server IP address
  - [ ] `DIGITAL_OCEAN_SSH_KEY` - Private SSH key for server access
  - [ ] `DIGITAL_OCEAN_SERVER_USER` - Server user (root/deploy)

### Phase 2: Digital Ocean Server Setup
- [ ] **Create/Configure Droplet**
  - [ ] Ubuntu 22.04 LTS droplet
  - [ ] SSH key authentication configured
  - [ ] Basic firewall setup (ports 22, 80, 443)
  
- [ ] **Install Server Dependencies**
  - [ ] Nginx web server
  - [ ] Node.js (for building if needed)
  - [ ] PM2 (if running Node processes)
  - [ ] UFW firewall configuration
  - [ ] SSL certificate setup (Let's Encrypt)

- [ ] **Configure Nginx**
  - [ ] Virtual host for domain
  - [ ] Static file serving from `/var/www/your-domain/dist/`
  - [ ] Gzip compression
  - [ ] Cache headers for assets
  - [ ] SSL/HTTPS configuration

### Phase 3: GitHub Actions Workflow
- [ ] **Create Workflow File** (`.github/workflows/deploy.yml`)
  - [ ] Trigger on push to deploy branch
  - [ ] Node.js environment setup
  - [ ] Install dependencies (`npm ci`)
  - [ ] Run build process (`npm run build`)
  - [ ] Deploy files to server via SSH/SCP
  - [ ] Restart services if needed

- [ ] **Workflow Features**
  - [ ] Build caching for faster deployments
  - [ ] Environment variable injection
  - [ ] Build artifact management
  - [ ] Deployment notifications
  - [ ] Rollback capability

### Phase 4: Testing & Go-Live
- [ ] **Pre-Deployment Testing**
  - [ ] Local build verification (`npm run build`)
  - [ ] Asset path verification
  - [ ] Environment variable testing
  - [ ] Mobile responsiveness check
  
- [ ] **Deployment Testing**
  - [ ] GitHub Actions workflow test run
  - [ ] Server file deployment verification
  - [ ] Domain/DNS configuration
  - [ ] SSL certificate validation
  - [ ] Form submissions testing (contact, consultation)
  - [ ] Stripe checkout testing (test mode first)

- [ ] **Production Validation**
  - [ ] All pages load correctly
  - [ ] Three.js background animation works
  - [ ] Contact forms submit properly
  - [ ] Consultation booking works
  - [ ] Stripe payments process (production mode)
  - [ ] Mobile/responsive design validated

## File Structure After Deployment

```
/var/www/christinmorton.com/
├── dist/                          # Built static files
│   ├── index.html
│   ├── about.html
│   ├── service.html
│   ├── contact.html
│   ├── free-consultation.html
│   ├── checkout.html
│   ├── assets/
│   │   ├── *.css
│   │   ├── *.js
│   │   └── *.png|jpg|svg
│   └── images/
├── logs/                          # Deployment logs
└── backups/                       # Previous deployments
```

## Environment Variables

### Production .env (Server-side)
```bash
NODE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...
WORDPRESS_API_BASE_PROD=https://your-wp-site.com/wp-json/wp/v2
```

### GitHub Secrets
```
WORDPRESS_API_BASE_PROD
VITE_STRIPE_PUBLISHABLE_KEY_PROD
DIGITAL_OCEAN_SERVER_HOST
DIGITAL_OCEAN_SSH_KEY
DIGITAL_OCEAN_SERVER_USER
```

## Rollback Plan

- Keep previous 3 deployments in `/var/www/christinmorton.com/backups/`
- Nginx symlink to current deployment for quick rollback
- GitHub Actions manual trigger for previous commit deployment

## Monitoring & Maintenance

- [ ] Nginx access/error logs monitoring
- [ ] SSL certificate auto-renewal (certbot)
- [ ] Server resource monitoring
- [ ] Uptime monitoring
- [ ] Form submission monitoring

## Progress Update - Current Session

### ✅ Completed Tasks
- [x] **Environment Variables Setup**: Updated `.env` file with all production price IDs and configuration
- [x] **Code Updates**: Modified JavaScript to use environment variables instead of hardcoded price IDs
  - Updated `CheckoutPage.js` with dynamic environment detection
  - Updated Stripe API key initialization 
  - Updated Vite config with all HTML pages
- [x] **GitHub Actions Workflow**: Created `.github/workflows/deploy.yml` with full deployment pipeline
- [x] **Repository Setup**: Successfully pushed `deploy/digital-ocean-setup` branch to GitHub
- [x] **Branch Protection**: Configured branch protection rules for deployment branch

### 🔄 In Progress
- [ ] **GitHub Repository Secrets**: Currently adding all required secrets to GitHub repository
  - Stripe production API keys (publishable & secret)
  - Stripe production price IDs (4 total)
  - WordPress API credentials
  - Digital Ocean server credentials

### 📋 Next Steps After Secrets Setup
1. **Finish GitHub Secrets Configuration** (in progress)
2. **Set up Digital Ocean droplet and domain**
3. **Test deployment workflow** - trigger first automated deployment
4. **Configure SSL/HTTPS and domain**
5. **Production validation and go-live**

---

**Current Status**: GitHub Actions workflow ready, configuring repository secrets
**Next Milestone**: First automated deployment test
**Target**: Production deployment by end of week

## GitHub Repository Secrets Required

The following secrets need to be configured in GitHub repository settings:

### Stripe Production Keys
- `VITE_STRIPE_PUBLISHABLE_KEY_PROD` - Live Stripe publishable key
- `STRIPE_SECRET_KEY_PROD` - Live Stripe secret key

### Stripe Production Price IDs
- `VITE_STRIPE_PRICE_ID_WEB_DEV_STARTER_PROD` = `price_1S4vTWFjZiO5qeK7rNGUZoSM`
- `VITE_STRIPE_PRICE_ID_WEB_DEV_STANDARD_PROD` = `price_1S4vTOFjZiO5qeK7UlaWZtxI`
- `VITE_STRIPE_PRICE_ID_WEB_DEV_PREMIUM_PROD` = `price_1S4vTJFjZiO5qeK7FBCPJg0F`
- `VITE_STRIPE_PRICE_ID_CONSULTATION_PROD` = `price_1S4vTBFjZiO5qeK7qpKlyeh1`

### WordPress API
- `WORDPRESS_API_BASE_PROD` = `https://cms.christinmorton.com/wp-json`
- `WORDPRESS_APP_USER` = `vite_frontend_reader`
- `WORDPRESS_APP_PASSWORD` = `mjQd j7N9 7n4v 9L81 ebQ1 iY5Q`

### Digital Ocean Server (Still needed)
- `DIGITAL_OCEAN_SERVER_HOST` - Server IP address
- `DIGITAL_OCEAN_SERVER_USER` - Server username (root or deploy user)
- `DIGITAL_OCEAN_SSH_KEY` - Private SSH key for server access