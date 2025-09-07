# WordPress Form Submission API Integration

This document describes the custom WordPress REST API endpoint for handling form submissions to the JetEngine Custom Content Type (CCT) message table.

## API Endpoint Configuration

### REST Route Registration
```php
add_action('rest_api_init', function () {
  register_rest_route('cmm/v1', '/submit-message', [
    'methods'             => 'POST',
    'callback'            => 'manual_insert_into_cct',
    'permission_callback' => '__return_true', // TODO: lock down later
  ]);
});
```

**Endpoint URL:** `POST /wp-json/cmm/v1/submit-message`

## Frontend API Request Format

### Request Structure
```javascript
const submitMessage = async (messageData) => {
  const response = await fetch('https://christinmorton.local/wp-json/cmm/v1/submit-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData)
  });
  
  return response.json();
};
```

### Required Request Body Format
```javascript
{
  // REQUIRED FIELDS
  "type": "contact",                    // Message type (required)
  "name": "John Doe",                   // User name (required)
  
  // CONTACT INFO (at least one required: email OR phone)
  "email": "john@example.com",          // Email address (validated)
  "phone": "+1-555-123-4567",          // Phone number (validated)
  
  // MESSAGE CONTENT (at least one required: simple_message OR detailed_message)
  "simple_message": "Hello, I need help with my website",     // Plain text
  "detailed_message": "<p>Rich HTML content</p>",             // WYSIWYG HTML
  
  // OPTIONAL FIELDS  
  "subject": "Website Help Request"     // Subject line (optional)
}
```

## Server-Side Data Validation

### Validation Rules

#### Required Fields
- **`type`**: Always required, max 100 characters
- **`name`**: Always required, max 100 characters

#### Contact Method Validation (One Required)
- **`email`**: Must be valid email format if provided
- **`phone`**: Must be 7-15 digits, allows +, -, (), spaces if provided
- **Rule**: At least one of email OR phone must be provided and valid

#### Message Content Validation (One Required)
- **`simple_message`**: Plain text, max 5,000 characters
- **`detailed_message`**: HTML content (sanitized with wp_kses_post), max 200,000 characters
- **Rule**: At least one message field must have content

#### Optional Fields
- **`subject`**: Optional by default, max 100 characters when provided

### Server Response Formats

#### Success Response (200)
```javascript
{
  "success": true,
  "id": 123,                           // Database ID of created message
  "created": "2024-01-15 10:30:45"     // Timestamp when message was created
}
```

#### Validation Error Response (422)
```javascript
{
  "errors": [
    "Name is required.",
    "Provide at least one contact method: email or phone.",
    "Provide a message in either Simple or Detailed field."
  ]
}
```

#### Server Error Response (500)
```javascript
{
  "error": "Database insert failed.",
  "db_error": "Duplicate entry...",    // Detailed error (dev only)
  "table": "wp_jet_cct_message"       // Table name (dev only)
}
```

## Data Processing & Storage

### Automatic Data Enhancement
The server automatically adds several fields during processing:

```php
$data_to_store = [
  // User submitted data (validated)
  'type'                      => $data['type'],
  'name'                      => $data['name'], 
  'email_address'             => $data['email'],
  'phone'                     => $data['phone'],
  'subject'                   => $data['subject'],
  'simple_message'            => $data['simple_message'],
  'detailed_message'          => $data['detailed_message'],
  
  // Server-generated data
  'sender_id'                 => get_current_user_id() ?: '',  // Auto-filled for logged users
  'ip_address'                => get_client_ip(),              // Client IP address  
  'user_agent_signature'      => $_SERVER['HTTP_USER_AGENT'], // Browser info
  'geolocation'               => json_encode($geo_data),       // IP geolocation data
  'media_content'             => json_encode([]),              // File uploads (future)
  
  // Timestamps (auto-generated)
  'created'                   => current_time('mysql'),       // Creation timestamp
  'updated'                   => current_time('mysql'),       // Last updated timestamp
];
```

### Database Table
- **Table**: `wp_jet_cct_message` (JetEngine Custom Content Type)
- **Auto-increment ID**: Primary key
- **Timestamps**: Automatic creation and update times

## Security Features

### Input Sanitization
- **Text fields**: `sanitize_text_field()` - removes HTML tags and dangerous characters
- **Email**: `sanitize_email()` + `is_email()` validation
- **Phone**: Regex validation for format, length checking
- **HTML content**: `wp_kses_post()` - allows safe HTML tags only
- **Textarea**: `sanitize_textarea_field()` - preserves line breaks

### Rate Limiting (Optional)
```php
// Commented out but available for implementation
$result = apply_ip_rate_limit('guest_message_submit', 300); // 5 minute cooldown
if (is_wp_error($result)) { 
  return $result; 
}
```

### User Authentication
- Automatically detects logged-in WordPress users
- Sets `sender_id` field for authenticated users
- Prevents guests from spoofing user IDs

## Frontend Implementation Guidelines

### Basic Form Submission
```javascript
const handleContactForm = async (formData) => {
  try {
    const response = await fetch('https://christinmorton.local/wp-json/cmm/v1/submit-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'contact',
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject || '',
        simple_message: formData.message,
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('Message sent successfully:', result.id);
      return result;
    } else {
      console.error('Validation errors:', result.errors);
      throw new Error(result.errors?.join(', ') || 'Unknown error');
    }
  } catch (error) {
    console.error('Submission failed:', error);
    throw error;
  }
};
```

### Error Handling Strategy
```javascript
const submitWithErrorHandling = async (messageData) => {
  try {
    const result = await submitMessage(messageData);
    
    // Success
    showSuccessMessage('Your message has been sent!');
    resetForm();
    
  } catch (error) {
    // Handle different error types
    if (error.response?.status === 422) {
      // Validation errors - show to user
      displayValidationErrors(error.response.data.errors);
    } else if (error.response?.status === 500) {
      // Server errors - generic message
      showErrorMessage('There was a problem sending your message. Please try again.');
    } else {
      // Network errors
      showErrorMessage('Connection failed. Please check your internet and try again.');
    }
  }
};
```

### Validation Configuration Options

The WordPress endpoint accepts different validation configurations:

```php
// Default configuration
list($errors, $data) = validate_message_data($request->get_json_params(), [
  'require_contact_one_of' => ['email', 'phone'],          // Require at least one
  'require_message_one_of' => ['simple_message', 'detailed_message'], // Require at least one  
  'subject_required'       => false,                       // Subject optional
  'max_simple_chars'       => 5000,                       // Simple message limit
  'max_wysiwyg_chars'      => 200000,                     // Rich text limit
]);
```

## Server Configuration

### Development Environment
- **WordPress Site**: christinmorton.local (Local by Flywheel)
- **API Base URL**: `http://christinmorton.local/wp-json/` (HTTP to avoid SSL certificate issues)
- **Custom Endpoint**: `cmm/v1/submit-message`
- **Full URL**: `http://christinmorton.local/wp-json/cmm/v1/submit-message`
- **db table name**: `wp_jet_cct_analytics_event`
- **route**: `POST` `http://christinmorton.local/wp-json/jet-cct/analytics_event`


### Production Environment
- **Frontend Site**: christinmorton.com (this Vite project)
- **WordPress Backend**: cms.christinmorton.com (headless WordPress)
- **API Base URL**: `https://cms.christinmorton.com/wp-json/`
- **Custom Endpoint**: `cmm/v1/submit-message`
- **Full URL**: `https://cms.christinmorton.com/wp-json/cmm/v1/submit-message`

### Environment-Aware Configuration
```javascript
// Environment configuration for API endpoints
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'christinmorton.local' || hostname.includes('localhost')) {
    // Development environment - use HTTP to avoid SSL certificate issues
    return 'http://christinmorton.local/wp-json';
  } else {
    // Production environment
    return 'https://cms.christinmorton.com/wp-json';
  }
};

const API_ENDPOINTS = {
  SUBMIT_MESSAGE: `${getApiBaseUrl()}/cmm/v1/submit-message`,
  ANALYTICS_EVENT: `${getApiBaseUrl()}/jet-cct/analytics_event`
};
```

## Testing & Debugging

### Test Request Example
```bash
curl -X POST https://christinmorton.local/wp-json/cmm/v1/submit-message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "name": "Test User",
    "email": "test@example.com",
    "simple_message": "This is a test message"
  }'
```

### WordPress Debug Logging
Server errors are logged to WordPress debug log:
```php
error_log('DB insert failed: ' . $wpdb->last_error . ' | SQL: ' . $wpdb->last_query);
```

## Integration Requirements

### Required WordPress Helper Functions
The API expects these helper functions to exist:
- `get_client_ip()` - Extract client IP address
- `get_geolocation_from_ip($ip)` - IP geolocation data
- `apply_ip_rate_limit()` - Rate limiting (optional)

### Database Dependencies
- JetEngine plugin must be active
- `wp_jet_cct_message` table must exist
- Proper column structure with timestamp fields

This API endpoint provides a robust, validated, and secure way to handle form submissions from your frontend application to the WordPress backend.

---

## Implementation Status

### ✅ **Contact Form Submission - COMPLETED**
**Status:** Fully functional and tested  
**Date Completed:** September 7, 2025  
**Features Implemented:**
- Contact form submission to `/cmm/v1/submit-message` endpoint
- Real-time form validation with user-friendly error messages
- Enhanced status messages with icons and animations
- Smart form state management (clear on success, preserve on error)
- Environment-aware API calls (development vs production)
- Professional error handling for all HTTP status codes
- Loading states and smooth user experience

**Test Results:**
- ✅ Form submission working successfully
- ✅ Message ID 6+ created in WordPress backend
- ✅ Validation working correctly
- ✅ Error handling tested and functional
- ✅ User experience polished and professional

### ⚠️ **Analytics Event Tracking - PENDING FIXES**
**Status:** Partially implemented, authentication issues  
**Current Issues:**

#### **Authentication Problems:**
- **401 Unauthorized** errors on all analytics endpoints
- JetEngine `/jet-cct/analytics_event` endpoint requires authentication
- Page load, form interaction, and form submission analytics all failing

#### **Specific Error Details:**
```
POST http://christinmorton.local/wp-json/jet-cct/analytics_event 401 (Unauthorized)
POST http://christinmorton.local/wp-json/jet-cct/analytics_event 400 (Bad Request)
```

#### **What's Working:**
- ✅ Analytics data collection (session ID, user ID, timestamps, etc.)
- ✅ Environment-aware endpoint detection
- ✅ Analytics event triggers (page load, form start, form submit)
- ✅ Error handling and graceful failures

#### **What Needs Fixing:**
- ❌ WordPress backend authentication for analytics endpoint
- ❌ Possible data format issues causing 400 errors
- ❌ JetEngine CCT REST API permissions configuration

#### **Potential Solutions:**
1. **Make analytics endpoint public** in JetEngine settings
2. **Create custom public endpoint** for analytics (similar to message endpoint)
3. **Add authentication headers** to analytics requests
4. **Verify analytics data format** matches expected schema

#### **Impact:**
- Contact form works perfectly without analytics
- Analytics is supplementary feature that doesn't affect core functionality
- Form submission analytics will work once endpoint authentication is resolved

### ✅ **WordPress Application Password Authentication - COMPLETED**
**Status:** Fully functional and tested  
**Date Completed:** January 7, 2025  
**Features Implemented:**
- WordPress Application Password authentication system
- `AppPasswordManager` class with environment-aware configuration
- Authenticated analytics event tracking via `/wp-json/jet-cct/analytics_event`
- Authenticated contact form submissions via `/wp-json/cmm/v1/submit-message`
- JetEngine analytics endpoint secured with `read` capability requirement
- Environment variables configuration through Vite's `define` feature

**Test Results:**
- ✅ Contact form submission working with authentication
- ✅ Page load analytics events successfully stored in `wp_jet_cct_analytics_event`
- ✅ Form submission analytics events tracked and stored
- ✅ Authentication working in development environment
- ✅ Error handling and graceful fallbacks functional

**Architecture Completed:**
- Dual authentication system design (App Password + User JWT for future)
- Modular `AppPasswordManager` class for reusable authentication
- Integrated analytics tracking with authenticated API calls
- Environment-aware endpoint configuration

### ⚠️ **Minor Issues for Future Resolution:**
**IP Address Collection:** Server-side IP address collection may not work correctly in localhost/development environment. This is expected behavior when accessing through local machine and should resolve in production deployment.

**Next Development Phase:** Ready for additional features or user authentication JWT implementation.