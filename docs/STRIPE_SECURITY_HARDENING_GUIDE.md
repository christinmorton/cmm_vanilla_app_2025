# Stripe Payment Security Hardening Guide

## Project Context
This guide addresses critical security vulnerabilities found in the `fn-stripe-payment.php` file for a WordPress-based portfolio website with:
- Custom Stripe checkout system (standard, custom amount, free consultation)
- JetEngine headless CMS with invoice tracking
- WordPress REST API endpoints for payment processing
- Production deployment requirements on Digital Ocean

## Security Assessment Summary

### ⚠️ CRITICAL SECURITY ISSUES IDENTIFIED

**Current Risk Level: HIGH - DO NOT DEPLOY WITHOUT FIXES**

The payment system has solid functionality but **critical security gaps** that must be addressed before production deployment.

---

## Issue 1: Authentication & Authorization (CRITICAL)

### **Problem:**
```php
// Lines 17, 160, 446 - VULNERABLE
'permission_callback' => '__return_true'
```
**Risk:** Unrestricted public access to payment endpoints allows anyone to create unlimited checkout sessions.

### **Required Fix:**
```php
'permission_callback' => function($request) {
    // Option A: WordPress capability check + nonce
    if (current_user_can('manage_options')) {
        return true;
    }

    // Option B: Custom API key validation
    return validate_api_key($request->get_header('X-API-Key'));

    // Option C: Rate-limited public access with CSRF
    return verify_csrf_token($request) && check_rate_limit($request);
}
```

### **Implementation Priority:** 🔴 **IMMEDIATE**

---

## Issue 2: Input Validation & CSRF Protection (HIGH)

### **Problems:**
- No CSRF protection on payment endpoints
- URL parameters not validated against domain whitelist
- Missing comprehensive input sanitization

### **Required Fixes:**

#### **CSRF Protection:**
```php
function verify_csrf_token($request) {
    $token = $request->get_header('X-CSRF-Token');
    $session_token = wp_get_session_token();
    return hash_equals(wp_hash($session_token), $token);
}
```

#### **URL Validation:**
```php
function validate_redirect_url($url, $allowed_domains) {
    $parsed = parse_url($url);
    if (!$parsed || !isset($parsed['host'])) {
        return false;
    }

    return in_array($parsed['host'], $allowed_domains);
}
```

### **Implementation Priority:** 🟡 **HIGH**

---

## Issue 3: Environment Configuration (HIGH)

### **Problem:**
Missing validation for required wp-config.php constants, potential fatal errors.

### **Required Fix:**
```php
function validate_stripe_environment() {
    $required_constants = [
        'STRIPE_SECRET_KEY_TEST',
        'STRIPE_SECRET_KEY_LIVE',
        'STRIPE_WEBHOOK_SECRET_TEST',
        'STRIPE_WEBHOOK_SECRET_LIVE',
        'STRIPE_LIVE_MODE'
    ];

    foreach ($required_constants as $constant) {
        if (!defined($constant)) {
            return new WP_Error('config_missing', "Required constant {$constant} not defined");
        }
    }

    return true;
}
```

### **Implementation Priority:** 🟡 **HIGH**

---

## Issue 4: Webhook Security (CRITICAL FOR PRODUCTION)

### **Problem:**
Test mode skips signature verification entirely, creating vulnerability.

### **Required Fix:**
```php
function handle_stripe_webhook($request) {
    // ALWAYS require signature verification in production
    if (defined('STRIPE_LIVE_MODE') && STRIPE_LIVE_MODE) {
        if (!verify_webhook_signature($request)) {
            return new WP_Error('invalid_signature', 'Webhook signature verification failed');
        }
    } else {
        // Even in test mode, verify if secret is available
        if (defined('STRIPE_WEBHOOK_SECRET_TEST') && !empty(STRIPE_WEBHOOK_SECRET_TEST)) {
            if (!verify_webhook_signature($request)) {
                error_log('TEST MODE: Webhook signature verification failed');
                return new WP_Error('invalid_signature', 'Test webhook signature failed');
            }
        }
    }
    // ... rest of webhook handling
}
```

### **Implementation Priority:** 🔴 **IMMEDIATE**

---

## Implementation Strategy

### **Phase 1: Critical Security Fixes (Week 1)**

#### **Day 1-2: Authentication System**
1. **Implement API key authentication** for payment endpoints
2. **Add rate limiting** using WordPress transients or your existing rate limiting
3. **Create nonce-based CSRF protection** for form submissions

#### **Day 3-4: Input Validation**
1. **Add URL domain validation** for redirect URLs
2. **Enhance input sanitization** beyond current `sanitize_text_field()`
3. **Implement comprehensive parameter validation**

#### **Day 5-7: Environment & Configuration**
1. **Add configuration validation** on plugin/theme activation
2. **Create environment check endpoint** for deployment verification
3. **Add proper error handling** for missing constants

### **Phase 2: Production Hardening (Week 2)**

#### **Day 1-3: Webhook Security**
1. **Enforce signature verification** in all environments
2. **Add webhook event logging** for audit trails
3. **Implement duplicate prevention** for webhook processing

#### **Day 4-5: Monitoring & Logging**
1. **Enhanced security logging** for authentication failures
2. **Rate limit monitoring** and alerting
3. **Payment anomaly detection**

#### **Day 6-7: Testing & Deployment**
1. **Security testing** with various attack vectors
2. **Load testing** payment endpoints
3. **Production deployment** with security checklist

---

## Security Checklist for Production

### **✅ Authentication & Authorization**
- [ ] Replace `__return_true` permission callbacks
- [ ] Implement API key or capability-based authentication
- [ ] Add rate limiting to prevent abuse
- [ ] Configure proper WordPress user roles/capabilities

### **✅ Input Validation & CSRF**
- [ ] Add CSRF token validation
- [ ] Implement URL domain whitelisting
- [ ] Enhance input sanitization and validation
- [ ] Add request size limits

### **✅ Environment Configuration**
- [ ] Validate all required wp-config.php constants
- [ ] Add environment-specific configuration checks
- [ ] Implement graceful degradation for missing configs
- [ ] Create configuration validation endpoint

### **✅ Webhook Security**
- [ ] Enforce signature verification in production
- [ ] Configure webhook secrets in wp-config.php
- [ ] Add webhook event logging and monitoring
- [ ] Implement duplicate event prevention

### **✅ Infrastructure Security**
- [ ] Configure proper SSL/TLS certificates
- [ ] Set up proper firewall rules
- [ ] Configure WordPress security headers
- [ ] Enable appropriate PHP security settings

---

## WordPress-Specific Security Enhancements

### **Leverage Existing WordPress Security Features:**

#### **1. WordPress Nonces:**
```php
function create_payment_nonce() {
    return wp_create_nonce('stripe_payment_action');
}

function verify_payment_nonce($nonce) {
    return wp_verify_nonce($nonce, 'stripe_payment_action');
}
```

#### **2. WordPress Capabilities:**
```php
'permission_callback' => function() {
    return current_user_can('process_payments') || current_user_can('manage_options');
}
```

#### **3. WordPress Transients for Rate Limiting:**
```php
function check_rate_limit($ip_address, $limit = 5, $window = 300) {
    $key = 'rate_limit_' . md5($ip_address);
    $attempts = get_transient($key) ?: 0;

    if ($attempts >= $limit) {
        return false;
    }

    set_transient($key, $attempts + 1, $window);
    return true;
}
```

---

## Testing Strategy

### **Security Testing Checklist:**

#### **Authentication Testing:**
- [ ] Test endpoint access without authentication
- [ ] Test with invalid API keys/tokens
- [ ] Test rate limiting functionality
- [ ] Test CSRF token validation

#### **Input Validation Testing:**
- [ ] Test with malicious URLs in redirect parameters
- [ ] Test with oversized input data
- [ ] Test with special characters and injection attempts
- [ ] Test email validation edge cases

#### **Webhook Testing:**
- [ ] Test webhook with invalid signatures
- [ ] Test webhook replay attacks
- [ ] Test webhook with malformed JSON
- [ ] Test duplicate webhook event handling

---

## Production Deployment Requirements

### **wp-config.php Configuration:**
```php
// Stripe Configuration
define('STRIPE_LIVE_MODE', true); // Set to false for staging
define('STRIPE_SECRET_KEY_LIVE', 'sk_live_...');
define('STRIPE_SECRET_KEY_TEST', 'sk_test_...');
define('STRIPE_WEBHOOK_SECRET_LIVE', 'whsec_...');
define('STRIPE_WEBHOOK_SECRET_TEST', 'whsec_...');

// Security Configuration
define('STRIPE_API_RATE_LIMIT', 100); // requests per hour
define('STRIPE_ALLOWED_DOMAINS', ['yourdomain.com', 'www.yourdomain.com']);
```

### **Server Configuration:**
- SSL/TLS certificate properly configured
- PHP memory limits appropriate for Stripe API calls
- WordPress security headers configured
- Firewall rules restricting unnecessary access

---

## Risk Assessment

### **Current Risk Level: 🔴 HIGH**
- **Immediate action required** before production deployment
- **Payment system functional** but security gaps create significant risk
- **Data breach potential** through unrestricted endpoint access

### **Post-Implementation Risk Level: 🟢 LOW**
- **Production-ready** with proper security hardening
- **Enterprise-grade security** appropriate for payment processing
- **Audit-ready** with comprehensive logging and monitoring

---

## Next Steps

1. **Copy this guide** to your WordPress backend project
2. **Start with Phase 1 critical fixes** (authentication & input validation)
3. **Test each security enhancement** in development environment
4. **Deploy to staging** for comprehensive security testing
5. **Complete security checklist** before production deployment

This security hardening will transform your payment system from a functional but vulnerable system into a production-ready, enterprise-grade payment processing solution.