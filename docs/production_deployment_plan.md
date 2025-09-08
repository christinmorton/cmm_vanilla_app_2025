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

## Next Steps

1. **User Action Required**: Gather all production environment values
2. **Claude Action**: Create GitHub Actions workflow file
3. **User Action**: Configure GitHub repository secrets
4. **User Action**: Set up Digital Ocean droplet and domain
5. **Collaborative**: Test deployment and go live

---

**Current Status**: Ready for environment variable setup
**Next Milestone**: GitHub Actions workflow creation
**Target**: Production deployment by end of week