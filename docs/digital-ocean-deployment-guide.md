# Digital Ocean VPS Deployment Guide
*Streamlined CI/CD Setup with GitHub Actions for Automatic Deployment*

## Overview

This guide will help you set up automatic deployment from GitHub to your Digital Ocean VPS using GitHub Actions. Since you already have Nginx, Let's Encrypt SSL, and nvm installed, we'll focus on the deployment workflow setup.

## Architecture Overview

```
GitHub Repository (Push)
    ↓
GitHub Actions (Build & Test)
    ↓
Digital Ocean VPS (Deploy)
    ↓
Your Live Website
```

---

## Prerequisites ✅ (You Already Have These)

### What You Have:
1. ✅ **Digital Ocean VPS** - Your droplet
2. ✅ **Nginx** - Web server installed and configured
3. ✅ **Let's Encrypt SSL** - SSL certificates set up
4. ✅ **nvm** - Node Version Manager installed
5. ✅ **SSH Key Access** - You can already connect to your server
6. ✅ **Sudo User** - User with sudo privileges created
7. ✅ **Domain Name** - Pointed to your VPS IP address
8. ✅ **GitHub Repository** - Your code repository

### What We'll Set Up:
- **GitHub Actions Workflow** - Automatic deployment pipeline
- **GitHub SSH Key** - Separate key for GitHub Actions automation
- **Website Directory Structure** - Organized static file deployment
- **Static File Deployment** - Direct dist folder deployment (no PM2 needed)

---

## Step 1: VPS Directory Setup (Quick Setup)

### 1.1 Connect to Your VPS
```bash
ssh your-username@your-server-ip
```

### 1.2 Verify Your Current Setup
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Node.js via nvm
nvm --version
node --version

# Check SSL certificates
sudo certbot certificates

# Check current website directory (if any)
ls -la /var/www/
```

### 1.3 Create Web Directory Structure
```bash
# Create website directory (if not already exists)
sudo mkdir -p /var/www/christinmorton.com/{html,backups,logs}

# Set permissions
sudo chown -R www-data:www-data /var/www/christinmorton.com
sudo chmod -R 755 /var/www/christinmorton.com
```

### 1.4 Update Your Existing Nginx Configuration (Optional)
Since you already have Nginx and SSL configured, you may just need to ensure your site config supports your multi-page application:

```bash
# Check your current Nginx config
sudo nginx -t
cat /etc/nginx/sites-available/your-site-name
```

**Key settings to verify in your Nginx config:**
```nginx
server {
    # Your existing SSL configuration...

    root /var/www/christinmorton.com/html;  # Make sure this points to your deployment directory
    index index.html index.htm;

    # Handle your multi-page routes
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Cache static assets (optional optimization)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**If you need to update your config:**
```bash
# Edit your existing site config
sudo nano /etc/nginx/sites-available/your-site-name

# Test configuration
sudo nginx -t

# Reload if changes made
sudo systemctl reload nginx
```

---

## Step 2: GitHub Actions Setup

### 2.1 Rename and Update Your Workflow File

**Rename your workflow:**
```bash
# In your local project
mv .github/workflows/node.js.yml .github/workflows/deploy-to-vps.yml
```

### 2.2 Update Workflow Configuration

**Edit `.github/workflows/deploy-to-vps.yml`:**
```yaml
name: Deploy to Digital Ocean VPS

on:
  push:
    branches: [ "feature/digital-ocean-deployment-updates", "main" ]
  workflow_dispatch: {}  # Manual trigger option

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build project
      run: npm run build
      env:
        NODE_ENV: production
        WORDPRESS_APP_USER: ${{ secrets.WORDPRESS_APP_USER }}
        WORDPRESS_APP_PASSWORD: ${{ secrets.WORDPRESS_APP_PASSWORD }}
        WORDPRESS_API_BASE_PROD: ${{ secrets.WORDPRESS_API_BASE_PROD }}
        VITE_STRIPE_PUBLISHABLE_KEY_PROD: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY_PROD }}

    - name: Deploy to VPS
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        port: 22
        script: |
          # Create backup
          if [ -d "/var/www/christinmorton.com/html" ]; then
            sudo cp -r /var/www/christinmorton.com/html /var/www/christinmorton.com/backups/backup-$(date +%Y%m%d-%H%M%S)
          fi

          # Clear current files
          sudo rm -rf /var/www/christinmorton.com/html/*

    - name: Copy files to VPS
      uses: appleboy/scp-action@v0.1.7
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        port: 22
        source: "dist/*"
        target: "/var/www/christinmorton.com/html/"
        strip_components: 1

    - name: Set permissions and reload
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        port: 22
        script: |
          # Set correct permissions
          sudo chown -R www-data:www-data /var/www/christinmorton.com/html
          sudo chmod -R 755 /var/www/christinmorton.com/html

          # Test and reload Nginx
          sudo nginx -t && sudo systemctl reload nginx

          # Log deployment
          echo "Deployment completed at $(date)" | sudo tee -a /var/www/christinmorton.com/logs/deploy.log

          # Verify deployment
          if [ -f "/var/www/christinmorton.com/html/index.html" ]; then
            echo "✅ Deployment successful!"
          else
            echo "❌ Deployment failed!"
            exit 1
          fi
```

---

## Step 3: GitHub Secrets Configuration

### 3.1 Generate SSH Key for GitHub Actions

Since you already have SSH access, we just need to create a separate key specifically for GitHub Actions automation:

**On your VPS (logged in as your sudo user):**
```bash
# Generate SSH key pair for GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions-deployment" -f ~/.ssh/github-actions
# Press Enter for no passphrase when prompted

# Add the public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github-actions*

# Display the private key (copy this entire output for GitHub secrets)
cat ~/.ssh/github-actions
```

**Important:** Copy the entire private key output (including the `-----BEGIN` and `-----END` lines) - you'll need this for GitHub secrets.

### 3.2 Add Secrets to GitHub Repository

Go to **GitHub Repository → Settings → Secrets and variables → Actions**

**Add these Repository Secrets:**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `your-server-ip` | Your Digital Ocean droplet IP |
| `VPS_USERNAME` | `root` or `your-username` | SSH username |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Private key from step 3.1 |
| `WORDPRESS_APP_USER` | `your-wp-username` | WordPress app user |
| `WORDPRESS_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` | WordPress app password |
| `WORDPRESS_API_BASE_PROD` | `https://cms.christinmorton.com/wp-json` | Production WordPress API |
| `VITE_STRIPE_PUBLISHABLE_KEY_PROD` | `pk_live_...` | Stripe production key |

### 3.3 Environment Variables Reference

**Your `.env` file should contain:**
```env
# Development
WORDPRESS_API_BASE_DEV=http://christinmorton.local/wp-json
VITE_STRIPE_PUBLISHABLE_KEY_DEV=pk_test_...

# Production (these come from GitHub secrets)
WORDPRESS_API_BASE_PROD=https://cms.christinmorton.com/wp-json
VITE_STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...

# Shared
WORDPRESS_APP_USER=your-username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## Step 4: Test Your Deployment

### 4.1 Initial Test Deploy

**Trigger your first deployment:**
```bash
# In your local project
git add .
git commit -m "Setup automatic deployment to Digital Ocean VPS"
git push origin feature/digital-ocean-deployment-updates
```

### 4.2 Monitor Deployment

1. **Go to GitHub Repository → Actions**
2. **Watch your workflow run**
3. **Check for any errors in the logs**

### 4.3 Verify Website

```bash
# Check if files are deployed
ssh your-username@your-server-ip
ls -la /var/www/christinmorton.com/html/

# Check Nginx status
sudo systemctl status nginx

# Check deployment logs
sudo tail -f /var/www/christinmorton.com/logs/deploy.log
```

### 4.4 Test Your Website

**Visit your website:**
- `https://christinmorton.com`
- `https://christinmorton.com/about.html`
- `https://christinmorton.com/contact.html`

---

## Step 5: Optimization & Monitoring

### 5.1 Set Up Monitoring

**Create a simple uptime script:**
```bash
# On your VPS
sudo nano /home/monitor.sh
```

```bash
#!/bin/bash
if curl -f -s https://christinmorton.com > /dev/null; then
    echo "$(date): Website is UP" >> /var/log/website-monitor.log
else
    echo "$(date): Website is DOWN" >> /var/log/website-monitor.log
fi
```

**Add to crontab:**
```bash
sudo crontab -e
# Add this line:
*/5 * * * * /home/monitor.sh
```

### 5.2 Log Rotation

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/christinmorton.com
```

```
/var/www/christinmorton.com/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
```

---

## Step 6: Troubleshooting

### Common Issues & Solutions

#### 6.1 SSH Connection Failed
```bash
# Check SSH key format
cat ~/.ssh/github-actions | head -1
# Should start with: -----BEGIN OPENSSH PRIVATE KEY-----

# Test SSH connection
ssh -i ~/.ssh/github-actions your-username@your-server-ip
```

#### 6.2 Permission Denied
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/christinmorton.com
sudo chmod -R 755 /var/www/christinmorton.com
```

#### 6.3 Nginx Configuration Error
```bash
# Test config
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

#### 6.4 Build Fails
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure environment variables match your `.env` file

#### 6.5 Website Not Loading
```bash
# Check if files exist
ls -la /var/www/christinmorton.com/html/

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates
```

---

## Step 7: Advanced Features (Optional)

### 7.1 Blue-Green Deployment
```bash
# Create multiple deployment directories
sudo mkdir -p /var/www/christinmorton.com/{blue,green}

# Use symlink for active deployment
sudo ln -sf /var/www/christinmorton.com/blue /var/www/christinmorton.com/html
```

### 7.2 Database Backups (if using one)
```bash
# Add to deployment script
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql
```

### 7.3 Slack/Discord Notifications
Add to your GitHub Actions workflow:
```yaml
- name: Notify deployment
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Step 8: Security Best Practices

### 8.1 SSH Security
```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 8.2 Firewall Setup
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 8.3 Fail2Ban
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Final Workflow Summary

Once set up, your deployment process is:

1. **Make changes locally**
2. **Commit and push to GitHub**
3. **GitHub Actions automatically:**
   - Builds your project
   - Deploys to your VPS
   - Reloads Nginx
   - Verifies deployment
4. **Your website is live!**

### Next Steps After Setup:
- ✅ Test deployment with a small change
- ✅ Set up monitoring and alerts
- ✅ Configure automatic backups
- ✅ Set up domain and SSL properly
- ✅ Test all website functionality

---

## Quick Reference Commands

### Deploy Manually (Emergency)
```bash
# Build locally
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/christinmorton.com/html/

# Fix permissions
ssh user@server "sudo chown -R www-data:www-data /var/www/christinmorton.com/html"
```

### Check Deployment Status
```bash
# GitHub Actions: Repository → Actions tab
# Server logs: tail -f /var/www/christinmorton.com/logs/deploy.log
# Nginx logs: sudo tail -f /var/log/nginx/access.log
```

### Rollback Deployment
```bash
# List backups
ls -la /var/www/christinmorton.com/backups/

# Restore backup
sudo cp -r /var/www/christinmorton.com/backups/backup-YYYYMMDD-HHMMSS/* /var/www/christinmorton.com/html/
```

This setup gives you a professional, automated deployment pipeline that will serve you well for production use!