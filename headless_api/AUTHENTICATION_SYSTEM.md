# Dual JWT Authentication System

This document outlines the comprehensive authentication architecture for the CMM headless WordPress integration, featuring a dual-token system for both application-level and user-level security.

## Authentication Architecture Overview

### Two-Tier Authentication System

The system implements **two distinct authentication methods** to provide layered security:

1. **WordPress Application Password (App-Level Basic Auth)**
   - Authenticates the frontend application with the WordPress backend using HTTP Basic Auth
   - Uses WordPress Application Password feature for secure app-to-app communication
   - Protects against spam, abuse, and unauthorized data access
   - Always required for API access

2. **User Authentication JWT (User-Level JWT)** 
   - Authenticates individual users within the application
   - Handles user login/logout, user-specific data, and permissions
   - Optional for anonymous/guest interactions
   - Required for user-specific functionality

### Security Model

```
Frontend Application Request
         ↓
[App Password Basic Auth] ← Always Required (Application Authentication)
         ↓
WordPress Backend Validates App Password
         ↓
[User JWT] ← Sometimes Required (User Authentication)  
         ↓
WordPress Processes Request Based on User Context
```

## Authentication Scenarios

### Scenario 1: Anonymous User Actions
**Use Case:** Contact forms, analytics events, public content access  
**Authentication Required:** App Password Basic Auth only
```javascript
{
  "headers": {
    "Authorization": "Basic <BASE64_ENCODED_CREDENTIALS>",
    "Content-Type": "application/json"
  }
}
```

### Scenario 2: Authenticated User Actions  
**Use Case:** User dashboard, personalized content, user profile updates  
**Authentication Required:** Both App Password Basic Auth + User JWT
```javascript
{
  "headers": {
    "Authorization": "Basic <BASE64_ENCODED_CREDENTIALS>", 
    "X-User-Token": "Bearer <USER_JWT>",
    "Content-Type": "application/json"
  }
}
```

### Scenario 3: Admin/Privileged Actions
**Use Case:** Content management, analytics dashboard, user management  
**Authentication Required:** App Password Basic Auth + User JWT (with admin privileges)
```javascript
{
  "headers": {
    "Authorization": "Basic <BASE64_ENCODED_CREDENTIALS>",
    "X-User-Token": "Bearer <ADMIN_USER_JWT>", 
    "Content-Type": "application/json"
  }
}
```

## Authentication Lifecycle Management

### WordPress Application Password
- **Lifetime:** Long-lived (no automatic expiry - manual rotation)
- **Renewal:** Manual rotation in WordPress admin when needed
- **Storage:** Environment variables (.env file) - never in client code
- **Scope:** Application-wide access to WordPress API resources

### User Authentication JWT  
- **Lifetime:** Short-lived (1-24 hours)
- **Renewal:** Refresh token mechanism or re-authentication
- **Storage:** Memory or short-term secure storage
- **Scope:** User-specific permissions and data access

## Security Considerations

### App Key JWT Security
1. **Environment Separation:** Different keys for dev/staging/production
2. **Key Rotation:** Regular rotation schedule for enhanced security  
3. **Rate Limiting:** Per-key rate limiting to prevent abuse
4. **Monitoring:** Log and monitor app key usage patterns
5. **Revocation:** Ability to revoke compromised keys immediately

### User JWT Security
1. **Short Expiration:** Minimize exposure window for compromised tokens
2. **Secure Storage:** Never store in plain text or unsecured locations
3. **HTTPS Only:** All authentication must occur over encrypted connections
4. **Refresh Tokens:** Separate refresh mechanism for seamless user experience
5. **Session Management:** Proper logout and session invalidation

## Implementation Components

### Frontend Components

#### 1. AuthManager Class
Central authentication coordinator managing both token types:
```javascript
class AuthManager {
  constructor() {
    this.appKeyManager = new AppKeyManager();
    this.userAuthManager = new UserAuthManager();
  }

  async makeAuthenticatedRequest(url, options = {}) {
    // Ensures both app and user auth as needed
  }
}
```

#### 2. AppKeyManager Class
Handles WordPress Application Key authentication:
```javascript
class AppKeyManager {
  getAppToken() // Retrieve current app token
  refreshAppToken() // Refresh expired token
  validateAppToken() // Check token validity
}
```

#### 3. UserAuthManager Class  
Handles user-specific JWT authentication:
```javascript
class UserAuthManager {
  login(credentials) // User login
  logout() // User logout
  getUserToken() // Current user token
  refreshUserToken() // Refresh user token
}
```

### Backend Components (WordPress)

#### 1. App Key Validation Middleware
```php
function validate_app_key_middleware($request) {
  $app_token = get_app_token_from_request($request);
  return validate_wordpress_app_key($app_token);
}
```

#### 2. User Authentication Integration
```php
function validate_user_jwt_middleware($request) {
  $user_token = get_user_token_from_request($request);  
  return validate_user_jwt_token($user_token);
}
```

#### 3. Dual Authentication Middleware
```php
function require_dual_auth($request) {
  $app_valid = validate_app_key_middleware($request);
  $user_valid = validate_user_jwt_middleware($request);
  
  return $app_valid && $user_valid;
}
```

## API Endpoint Security Configuration

### Contact Form Endpoint
```php
register_rest_route('cmm/v1', '/submit-message', [
  'methods' => 'POST',
  'callback' => 'handle_message_submission',
  'permission_callback' => 'validate_app_key_middleware' // App key only
]);
```

### Analytics Endpoint
```php
register_rest_route('cmm/v1', '/analytics-event', [
  'methods' => 'POST', 
  'callback' => 'handle_analytics_event',
  'permission_callback' => 'validate_app_key_middleware' // App key only  
]);
```

### User Dashboard Endpoint
```php
register_rest_route('cmm/v1', '/user-dashboard', [
  'methods' => 'GET',
  'callback' => 'get_user_dashboard',
  'permission_callback' => 'require_dual_auth' // Both tokens required
]);
```

## Error Handling Strategy

### Authentication Error Types
1. **Missing App Key** (401): Application not authenticated
2. **Invalid App Key** (401): Application key expired/invalid
3. **Missing User Token** (401): User authentication required  
4. **Invalid User Token** (401): User token expired/invalid
5. **Insufficient Permissions** (403): User lacks required permissions

### Error Response Format
```javascript
{
  "error": "authentication_failed",
  "error_type": "invalid_app_key|missing_user_token|insufficient_permissions",
  "message": "Human-readable error message",
  "requires_reauth": true, // Whether user needs to re-authenticate
  "auth_url": "/login" // Redirect URL for authentication
}
```

## Implementation Phases

### Phase 1: WordPress App Key Foundation
- [ ] Generate and configure WordPress Application Keys
- [ ] Implement AppKeyManager class
- [ ] Create app key validation middleware
- [ ] Secure analytics and contact form endpoints
- [ ] Test app-level authentication

### Phase 2: User JWT Integration  
- [ ] Integrate with existing JWT Authentication for WP-API plugin
- [ ] Implement UserAuthManager class
- [ ] Create dual authentication middleware
- [ ] Implement user login/logout workflows
- [ ] Test user-specific functionality

### Phase 3: Complete AuthManager Integration
- [ ] Implement central AuthManager coordinator
- [ ] Add automatic token refresh mechanisms
- [ ] Implement secure token storage
- [ ] Add comprehensive error handling
- [ ] Performance optimization and monitoring

### Phase 4: Security Hardening
- [ ] Implement token rotation schedules
- [ ] Add rate limiting and abuse protection  
- [ ] Security audit and penetration testing
- [ ] Monitoring and alerting systems
- [ ] Documentation and training

## Configuration Management

### Environment Variables
```javascript
// Development
const AUTH_CONFIG = {
  APP_KEY_ENDPOINT: 'http://christinmorton.local/wp-json/jwt-auth/v1/token/app',
  USER_AUTH_ENDPOINT: 'http://christinmorton.local/wp-json/jwt-auth/v1/token',
  API_BASE: 'http://christinmorton.local/wp-json'
};

// Production  
const AUTH_CONFIG = {
  APP_KEY_ENDPOINT: 'https://cms.christinmorton.com/wp-json/jwt-auth/v1/token/app',
  USER_AUTH_ENDPOINT: 'https://cms.christinmorton.com/wp-json/jwt-auth/v1/token', 
  API_BASE: 'https://cms.christinmorton.com/wp-json'
};
```

This dual JWT authentication system provides robust security while maintaining flexibility for both anonymous interactions and authenticated user experiences.