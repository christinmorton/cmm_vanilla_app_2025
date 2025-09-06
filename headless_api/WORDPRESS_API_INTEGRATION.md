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
- **API Base URL**: `https://christinmorton.local/wp-json/`
- **Custom Endpoint**: `cmm/v1/submit-message`
- **Full URL**: `https://christinmorton.local/wp-json/cmm/v1/submit-message`

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
    // Development environment
    return 'https://christinmorton.local/wp-json';
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