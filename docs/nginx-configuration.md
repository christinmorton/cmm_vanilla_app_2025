# Nginx Configuration Templates

This document contains nginx configuration templates for different types of applications you might deploy on Digital Ocean.

---

## 1. Vite Static Site Configuration (Current Project)

### Simple and Correct Configuration

This is the **recommended configuration** for your current Vite portfolio application:

```nginx
server {
    # Document root - where Vite build files are served from
    root /var/www/christinmorton.com/dist;

    # Default files to serve
    index index.html;

    # Server names
    server_name christinmorton.com www.christinmorton.com;

    # Gzip compression for better performance
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Main location block for serving static files
    location / {
        # Try to serve file directly, fallback to adding .html extension, then to directory, then 404
        try_files $uri $uri.html $uri/ =404;

        # Cache static assets aggressively
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSL Configuration (managed by Certbot)
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    # SSL certificate lines will be added by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = www.christinmorton.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = christinmorton.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80 default_server;
    listen [::]:80 default_server;
    server_name christinmorton.com www.christinmorton.com;
    return 404; # managed by Certbot
}
```

### How This Works

1. **`try_files $uri $uri.html $uri/ =404`** handles URL resolution:
   - `/about` → tries `/about` → then `/about.html` → then `/about/` → 404
   - This allows clean URLs without `.html` extensions
   - No complex rewriting needed - nginx finds the right file

2. **Static file serving** - Direct file serving, no proxy needed
3. **Asset caching** - Long-term caching for JS/CSS/images

---

## 2. Next.js Application Configuration

### For Node.js/Next.js Applications

This is your **original configuration** (save for future Next.js projects):

```nginx
server {
    root /var/www/html;

    # Add index.php to the list if you are using PHP
    index index.html index.htm index.nginx-debian.html;

    server_name christinmorton.com www.christinmorton.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Additional proxy headers for better handling
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL Configuration (managed by Certbot)
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    # SSL certificate lines will be added by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = www.christinmorton.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = christinmorton.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80 default_server;
    listen [::]:80 default_server;
    server_name christinmorton.com www.christinmorton.com;
    return 404; # managed by Certbot
}
```

### Use Cases for Next.js Config:
- Next.js applications
- Express.js servers
- Any Node.js application running on port 3000
- Applications requiring server-side rendering

---

## 3. WordPress Configuration

### For WordPress Sites

```nginx
server {
    root /var/www/christinmorton.com/wordpress;
    index index.php index.html index.htm;
    server_name christinmorton.com www.christinmorton.com;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }

    # WordPress specific security
    location ~* /(?:uploads|files)/.*\.php$ {
        deny all;
    }

    # SSL Configuration (managed by Certbot)
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
}
```

---

## Deployment Instructions

### For Vite Application (Current Project)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload dist folder to server:**
   ```bash
   rsync -avz --delete dist/ user@your-server:/var/www/christinmorton.com/dist/
   ```

3. **Update nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/christinmorton.com
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Directory Structure Expected

```
/var/www/christinmorton.com/
├── dist/                          # Vite build output
│   ├── index.html                 # Home page
│   ├── about.html                 # About page
│   ├── services.html              # Services page
│   ├── contact.html               # Contact page
│   ├── consultation.html          # Free consultation
│   ├── consultation/
│   │   ├── book.html             # Consultation booking
│   │   ├── book/
│   │   │   └── success.html      # Booking success
│   │   └── success.html          # Consultation success
│   ├── project/
│   │   ├── discovery.html        # Project discovery
│   │   ├── discovery/
│   │   │   └── success.html      # Discovery success
│   │   ├── quote.html            # Project quote
│   │   └── quote/
│   │       └── success.html      # Quote success
│   ├── checkout.html             # Checkout page
│   ├── payment/
│   │   ├── success.html          # Payment success
│   │   └── cancel.html           # Payment cancel
│   ├── thank-you.html            # General thank you
│   └── assets/                   # JS, CSS, images (auto-generated)
│       ├── index-[hash].js
│       ├── styles-[hash].css
│       └── ...
```

### Testing the Configuration

After deployment, test these URLs to ensure clean URLs work:
- `https://christinmorton.com/` → serves `index.html`
- `https://christinmorton.com/about` → serves `about.html`
- `https://christinmorton.com/services` → serves `services.html`
- `https://christinmorton.com/contact` → serves `contact.html`
- `https://christinmorton.com/consultation` → serves `consultation.html`
- `https://christinmorton.com/checkout` → serves `checkout.html`

All URLs should work without showing `.html` extensions and serve the correct pages.

---

## Configuration Summary

| Application Type | Nginx Behavior | Use Case |
|------------------|----------------|----------|
| **Vite Static** | Direct file serving with `try_files` | Static sites, SPAs, portfolios |
| **Next.js** | Proxy to Node.js server on port 3000 | SSR applications, dynamic content |
| **WordPress** | PHP-FPM integration | Content management, blogs |

Choose the appropriate configuration based on your deployment needs.

---

## 4. WordPress Headless API + Vite Frontend Setup

### For Cross-Domain API Access (cms.christinmorton.com → christinmorton.com)

Since your Vite frontend runs on `christinmorton.com` and needs to access WordPress API on `cms.christinmorton.com`, you have two options:

#### Option A: CORS Configuration (Recommended)

**Add to your Vite nginx config:**
```nginx
server {
    root /var/www/christinmorton.com/dist;
    index index.html;
    server_name christinmorton.com www.christinmorton.com;

    # ... existing configuration ...

    # Optional: Proxy API requests to avoid CORS (if you prefer)
    location /api/ {
        proxy_pass https://cms.christinmorton.com/wp-json/;
        proxy_set_header Host cms.christinmorton.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Add CORS headers
        add_header Access-Control-Allow-Origin "https://christinmorton.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials true always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://christinmorton.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # ... rest of configuration ...
}
```

**WordPress API Server (cms.christinmorton.com) nginx config:**
```nginx
server {
    root /var/www/cms.christinmorton.com/wordpress;
    index index.php index.html;
    server_name cms.christinmorton.com;

    # Standard WordPress configuration
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;

        # Add CORS headers for API requests
        add_header Access-Control-Allow-Origin "https://christinmorton.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-WP-Nonce" always;
        add_header Access-Control-Allow-Credentials true always;
    }

    # Specific CORS handling for WordPress REST API
    location ~ ^/wp-json/ {
        try_files $uri $uri/ /index.php?$args;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://christinmorton.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-WP-Nonce" always;
        add_header Access-Control-Allow-Credentials true always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://christinmorton.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-WP-Nonce";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # WordPress security
    location ~ /\.ht {
        deny all;
    }

    location ~* /(?:uploads|files)/.*\.php$ {
        deny all;
    }

    # SSL Configuration
    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    # SSL certificate lines added by Certbot
}
```

#### Option B: WordPress CORS Plugin Configuration

Instead of nginx CORS, you can handle CORS in WordPress itself:

**Install a CORS plugin or add to your WordPress theme's functions.php:**
```php
// Add to your WordPress theme's functions.php
function add_cors_headers() {
    // Only add headers for REST API requests
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
        header('Access-Control-Allow-Origin: https://christinmorton.com');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-WP-Nonce');
        header('Access-Control-Allow-Credentials: true');

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit();
        }
    }
}
add_action('init', 'add_cors_headers');
```

### API Access Patterns

With either setup, your Vite frontend can access the API using:

**Direct API calls (Option A - CORS):**
```javascript
// Direct API access
const response = await fetch('https://cms.christinmorton.com/wp-json/wp/v2/posts', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
});
```

**Proxied API calls (Option A - Proxy route):**
```javascript
// Proxied through your domain
const response = await fetch('/api/wp/v2/posts', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
});
```

### Recommendation

For your setup, I recommend **Option A with CORS headers** on the WordPress server. This approach:
- Keeps your API separate and clean
- Allows direct API access from your frontend
- Maintains clear separation between frontend and backend
- Works well with your existing headless architecture

The proxy option is useful if you want to hide your API domain or add additional processing.