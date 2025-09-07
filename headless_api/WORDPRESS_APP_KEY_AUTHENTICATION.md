# WordPress Application Password Authentication

This document provides detailed implementation guidance for WordPress Application Password authentication, which serves as the first layer of security in our dual authentication system.

## Overview

WordPress Application Passwords are secure credentials that authenticate the **frontend application** with the WordPress backend using HTTP Basic Authentication. This provides application-level access control independent of individual user authentication, preventing unauthorized applications from accessing your API resources while allowing legitimate client applications to interact with WordPress data.

## WordPress Application Password Configuration

### Setup Requirements
- WordPress 5.6+ (Application Passwords feature built-in)
- WordPress REST API active
- User account with appropriate permissions

### Backend WordPress Configuration

#### 1. Generate Application Password
In WordPress admin:
1. Go to **Users > Profile**
2. Scroll to **Application Passwords** section
3. Enter application name: "CMM Frontend Application"
4. Click **Add New Application Password**
5. Copy the generated password (shown only once)

#### 2. Environment Configuration
Store credentials in `.env` file:
```env
# WordPress Application Password Credentials
WORDPRESS_APP_USER=your_username
WORDPRESS_APP_PASSWORD=generated_password_here
WORDPRESS_API_BASE_DEV=http://christinmorton.local/wp-json
WORDPRESS_API_BASE_PROD=https://cms.christinmorton.com/wp-json
```

#### 3. Application Password Validation Middleware  
```php
// functions.php or custom plugin
function validate_app_password($request) {
    $auth_header = $request->get_header('Authorization');
    
    if (!$auth_header || !preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
        return new WP_Error(
            'missing_app_auth', 
            'Application authentication required', 
            ['status' => 401]
        );
    }
    
    $credentials = base64_decode($matches[1]);
    
    if (!$credentials || !str_contains($credentials, ':')) {
        return new WP_Error(
            'invalid_app_auth_format',
            'Invalid application authentication format',
            ['status' => 401]
        );
    }
    
    list($username, $app_password) = explode(':', $credentials, 2);
    
    // Validate application password
    $user = wp_authenticate_application_password(null, $username, $app_password);
    
    if (is_wp_error($user)) {
        return new WP_Error(
            'invalid_app_credentials',
            'Invalid application credentials',
            ['status' => 401]
        );
    }
    
    // Store authenticated user data in request
    $request->set_param('_app_user', $user);
    
    return true;
}
```

#### 4. Apply Application Password Protection to Endpoints
```php
// Secure the analytics endpoint
register_rest_route('cmm/v1', '/analytics-event', [
    'methods' => 'POST',
    'callback' => 'handle_analytics_event', 
    'permission_callback' => 'validate_app_password' // App authentication required
]);

// Secure the contact form endpoint  
register_rest_route('cmm/v1', '/submit-message', [
    'methods' => 'POST',
    'callback' => 'handle_message_submission',
    'permission_callback' => 'validate_app_password' // App authentication required
]);

// Example: Public endpoint (no app password needed)
register_rest_route('cmm/v1', '/public-content', [
    'methods' => 'GET', 
    'callback' => 'get_public_content',
    'permission_callback' => '__return_true' // Public access
]);
```

## Frontend Implementation

### AppPasswordManager Class
```javascript
/**
 * Manages WordPress Application Password authentication
 */
class AppPasswordManager {
    constructor(config = {}) {
        this.apiBaseUrl = config.apiBaseUrl || this.getEnvironmentApiUrl();
        this.appUser = __WORDPRESS_APP_USER__;
        this.appPassword = __WORDPRESS_APP_PASSWORD__;
        
        // Validate credentials are available
        if (!this.appUser || !this.appPassword) {
            throw new Error('WordPress Application Password credentials not found in environment variables');
        }
    }

    /**
     * Get environment-specific API URL
     */
    getEnvironmentApiUrl() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('localhost') || hostname.includes('.local')) {
            return __WORDPRESS_API_BASE_DEV__ || 'http://christinmorton.local/wp-json';
        }
        
        return __WORDPRESS_API_BASE_PROD__ || 'https://cms.christinmorton.com/wp-json';
    }

    /**
     * Initialize app authentication (always ready with Application Passwords)
     */
    async initialize() {
        // Application passwords don't need initialization - they're always ready
        return this.testCredentials();
    }

    /**
     * Test Application Password credentials
     */
    async testCredentials() {
        try {
            const response = await this.makeRequest(`${this.apiBaseUrl}/wp/v2/users/me`);
            return response.ok;
        } catch (error) {
            console.error('Application Password test failed:', error);
            return false;
        }
    }

    /**
     * Get Basic Auth credentials (Base64 encoded)
     */
    getEncodedCredentials() {
        const credentials = `${this.appUser}:${this.appPassword}`;
        return btoa(credentials);
    }

    /**
     * Get authentication headers for requests
     */
    getAuthHeaders() {
        return {
            'Authorization': `Basic ${this.getEncodedCredentials()}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make authenticated API request with Application Password
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const authenticatedOptions = {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...(options.headers || {})
                }
            };

            const response = await fetch(endpoint, authenticatedOptions);
            
            // Handle authentication errors
            if (response.status === 401) {
                console.error('Application Password authentication failed. Check credentials in .env file');
                throw new Error('Application Password authentication failed');
            }
            
            return response;
            
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    }

    /**
     * Get current environment
     */
    getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('localhost') || hostname.includes('.local')) {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('dev.')) {
            return 'staging';
        }
        
        return 'production';
    }
}
```

### Usage Examples

#### Initialize App Authentication
```javascript
// Initialize app authentication on page load
const appKeyManager = new AppKeyManager();

document.addEventListener('DOMContentLoaded', async () => {
    const initialized = await appKeyManager.initialize();
    
    if (!initialized) {
        console.error('Failed to initialize app authentication');
        // Handle authentication failure
    } else {
        console.log('App authentication ready');
    }
});
```

#### Make Authenticated API Calls
```javascript
// Submit analytics event with app authentication
const submitAnalytics = async (eventData) => {
    try {
        const response = await appKeyManager.makeRequest(
            `${appKeyManager.apiBaseUrl}/cmm/v1/analytics-event`,
            {
                method: 'POST',
                body: JSON.stringify(eventData)
            }
        );
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`Analytics submission failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Analytics submission error:', error);
        throw error;
    }
};

// Submit contact form with app authentication  
const submitContactForm = async (formData) => {
    try {
        const response = await appKeyManager.makeRequest(
            `${appKeyManager.apiBaseUrl}/cmm/v1/submit-message`,
            {
                method: 'POST', 
                body: JSON.stringify(formData)
            }
        );
        
        return await response.json();
        
    } catch (error) {
        console.error('Contact form submission error:', error);
        throw error;
    }
};
```

#### Integration with Existing Code
```javascript
// Update existing analytics tracker to use app authentication
class AnalyticsTracker {
    constructor() {
        this.appKeyManager = new AppKeyManager();
        this.initializeAuth();
    }
    
    async initializeAuth() {
        this.authReady = await this.appKeyManager.initialize();
    }
    
    async sendAnalyticsEvent(eventType, eventData) {
        if (!this.authReady) {
            console.warn('App authentication not ready, skipping analytics');
            return;
        }
        
        try {
            return await this.appKeyManager.makeRequest(
                `${this.appKeyManager.apiBaseUrl}/cmm/v1/analytics-event`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        event_type: eventType,
                        ...eventData,
                        ts_submitted: new Date().toISOString()
                    })
                }
            );
        } catch (error) {
            console.error('Analytics event failed:', error);
        }
    }
}
```

## Error Handling

### Common Authentication Errors
```javascript
const handleAuthError = (error, response) => {
    switch (response?.status) {
        case 401:
            if (error.message.includes('missing_app_key')) {
                console.error('App key missing - check request headers');
                // Regenerate app key
                return appKeyManager.generateNewAppKey();
            } else if (error.message.includes('invalid_app_key')) {
                console.error('App key invalid - regenerating...');
                return appKeyManager.generateNewAppKey();
            } else if (error.message.includes('wrong_environment')) {
                console.error('App key environment mismatch');
                appKeyManager.clearStoredKey();
                return appKeyManager.generateNewAppKey();
            }
            break;
            
        case 403:
            console.error('App lacks required permissions');
            // Handle permission issues
            break;
            
        case 429:
            console.error('Rate limit exceeded for app key');
            // Implement backoff strategy
            break;
            
        default:
            console.error('Unknown authentication error:', error);
    }
};
```

## Security Best Practices

### Development vs Production
- **Development:** Store keys in plain localStorage for debugging
- **Production:** Encrypt stored keys and use HTTPS exclusively
- **Staging:** Separate keys for staging environment testing

### Key Rotation
- Implement automatic key rotation (every 30-90 days)
- Monitor key usage patterns for suspicious activity
- Maintain key revocation capability

### Rate Limiting
- Implement per-app-key rate limiting on WordPress backend
- Different limits for different endpoint types (analytics vs contact forms)
- Progressive backoff for rate limit violations

### Monitoring
- Log all app key authentication attempts
- Monitor for failed authentication patterns
- Alert on suspicious app key usage

This WordPress App Key authentication system provides the foundation for securing your API endpoints while maintaining usability for legitimate client applications.