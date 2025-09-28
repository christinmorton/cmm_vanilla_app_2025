# WordPress Headless API Documentation

## Overview

This document details the WordPress REST API integration for the portfolio website, including JetEngine Custom Content Types (CCT), authentication methods, and API endpoints for data management and form submissions.

## Architecture

### CMS Backend
- **Development**: `http://christinmorton.local` (Local WordPress installation)
- **Production**: `https://cms.christinmorton.com` (WordPress headless CMS)

### Frontend Integration
- **Development**: `christinmorton.local` (Vite dev server)
- **Production**: `christinmorton.com` (Static frontend)

## Authentication System

### Application Password Authentication
The system uses WordPress Application Passwords for secure API access without exposing credentials.

**Implementation**: `js/modules/AppPasswordManager.js`

```javascript
class AppPasswordManager {
    constructor() {
        this.appUser = __WORDPRESS_APP_USER__;        // From environment
        this.appPassword = __WORDPRESS_APP_PASSWORD__; // From environment
        this.apiBaseUrl = getEnvironmentConfig().apiBaseUrl;
    }
}
```

**Environment Variables** (Vite configuration):
```javascript
// Development
__WORDPRESS_APP_USER__: 'christinmorton'
__WORDPRESS_APP_PASSWORD__: '[generated-app-password]'
__WORDPRESS_API_BASE_DEV__: 'http://christinmorton.local/wp-json'

// Production
__WORDPRESS_API_BASE_PROD__: 'https://cms.christinmorton.com/wp-json'
```

**Security Features**:
- Application-specific passwords (not main account password)
- Environment-specific credential isolation
- Automatic credential validation on initialization
- Secure HTTP authentication headers

## API Configuration System

### Environment-Aware Configuration
**File**: `js/config/api-config.js`

**Environment Detection**:
```javascript
export const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;

  if (hostname === 'christinmorton.local' || hostname.includes('localhost')) {
    return {
      environment: 'development',
      apiBaseUrl: 'http://christinmorton.local/wp-json',
      tablePrefix: 'wp_jet_cct'
    };
  } else {
    return {
      environment: 'production',
      apiBaseUrl: 'https://cms.christinmorton.com/wp-json',
      tablePrefix: '4cm_jet_cct'
    };
  }
};
```

### Database Table Prefixes
Different environments use different table prefixes to avoid conflicts:

**Development Tables**:
- `wp_jet_cct_message`
- `wp_jet_cct_analytics_event`
- `wp_jet_cct_appointment`
- `wp_jet_cct_invoice`

**Production Tables**:
- `4cm_jet_cct_message`
- `4cm_jet_cct_analytics_event`
- `4cm_jet_cct_appointment`
- `4cm_jet_cct_invoice`

## JetEngine Custom Content Types (CCT)

### Message Content Type
**Purpose**: Store contact form submissions and inquiry messages
**Endpoint**: `/wp-json/jet-cct/message`

**Fields**:
```javascript
{
  "type": "string",              // Message type: user_message, saraii_response, system_message (required)
  "name": "string",              // Contact name
  "email_address": "string",     // Contact email address
  "phone": "string",             // Phone number (optional)
  "subject": "string",           // Message subject
  "simple_message": "textarea",   // Simple text message
  "detailed_message": "wysiwyg", // Rich text detailed message
  "reply_to": "string",          // Reply-to email address
  "chain_id": "string",          // Message chain identifier
  "media_content": "repeater",   // Array of media attachments (URLs)
  "conversation_id": "string",   // Conversation thread identifier
  "message_timestamp": "datetime", // Message timestamp
  "message_status": "select"     // Status: pending, delivered, read, archived
}
```

**Usage Example**:
```javascript
// Submit contact form
const response = await fetch(`${apiBaseUrl}/jet-cct/message`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(appUser + ':' + appPassword)}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Project inquiry...',
    form_type: 'contact',
    source_page: 'contact.html'
  })
});
```

### Analytics Event Content Type
**Purpose**: Track user interactions and conversion events
**Endpoint**: `/wp-json/jet-cct/analytics_event`

**Fields**:
```javascript
{
  "event_type": "string",           // Type of event (page_view, form_submit, etc.)
  "ts_loaded": "string",            // Timestamp when page/content loaded
  "ts_submitted": "string",         // Timestamp when event was submitted
  "user_agent_signature": "string", // Browser user agent signature
  "page_path": "string",            // Current page path
  "referrer": "string",             // Referring page URL
  "session_id": "string",           // Session identifier
  "user_id": "string",              // Anonymous user identifier
  "ip_address": "string",           // User IP address
  "message_id": "string",           // Related message ID (if applicable)
  "chain_id": "string",             // Message chain identifier
  "conversation_id": "string"       // Conversation thread identifier
}
```

**Event Types**:
- `page_view`: Page navigation tracking
- `form_submit`: Form submission events
- `button_click`: CTA button interactions
- `scroll_depth`: Scroll engagement tracking
- `file_download`: Document download tracking
- `external_link`: External link clicks

### Appointment Content Type
**Purpose**: Store consultation and meeting bookings
**Endpoint**: `/wp-json/jet-cct/appointment`

**Fields**:
```javascript
{
  "message_id": "string",             // Related message ID
  "chain_id": "string",               // Message chain identifier
  "appointment_status": "string",      // Status of appointment
  "appointment_type": "string",        // Type of appointment
  "scheduled_date": "date",            // Scheduled appointment date
  "scheduled_time": "time",            // Scheduled appointment time
  "meeting_duration": "string",        // Duration of meeting
  "timezone": "string",               // Timezone for appointment
  "meeting_platform": "string",        // Platform (Zoom, Google Meet, etc.)
  "meeting_link": "string",            // Video call link
  "meeting_passcode": "string",        // Meeting passcode/PIN
  "location_address": "textarea",      // Physical meeting address
  "location_details": "textarea",      // Additional location details
  "agenda_topics": "wysiwyg",          // Meeting agenda topics
  "project_type": "string",            // Type of project discussed
  "preperation_notes": "wysiwyg",      // Preparation notes
  "follow_up_actions": "wysiwyg",      // Follow-up action items
  "internal_notes": "wysiwyg",         // Internal notes
  "reminder_sent": "checkbox",         // Whether reminder was sent
  "confirmation_sent": "checkbox",     // Whether confirmation was sent
  "created_date": "datetime",          // Creation timestamp
  "last_modified": "datetime",         // Last modification timestamp
  "rescheduled_count": "string",       // Number of times rescheduled
  "original_scheduled_date": "date",   // Original scheduled date
  "original_scheduled_time": "time"    // Original scheduled time
}
```

**Appointment Types**:
- `free_consultation`: Free discovery call
- `project_consultation`: Paid project consultation
- `technical_review`: Code/architecture review
- `follow_up`: Project follow-up meeting

### Invoice Content Type
**Purpose**: Store Stripe invoice information and payment tracking
**Endpoint**: `/wp-json/jet-cct/invoice`

**Fields**:
```javascript
{
  "stripe_payment_intent_id": "string", // Stripe payment intent ID
  "message_id": "string",              // Related message ID
  "chain_id": "string",                // Message chain identifier
  "customer_name": "string",            // Customer name
  "customer_email": "string",           // Customer email address
  "deposit_amount": "string",           // Deposit amount
  "currency": "string",                // Currency code (USD, EUR, etc.)
  "payment_status": "string",           // Payment status
  "stripe_customer_id": "string",       // Stripe customer ID
  "project_type": "string",             // Type of project
  "invoice_date": "datetime",           // Invoice creation date
  "payment_date": "datetime",           // Payment completion date
  "notes": "wysiwyg",                  // Additional notes
  "_receipt_url": "string",             // Stripe receipt URL
  "created_date": "datetime",           // Creation timestamp
  "last_modified": "datetime"           // Last modification timestamp
}
```

**Invoice Statuses**:
- `draft`: Invoice created but not sent
- `open`: Invoice sent, awaiting payment
- `paid`: Payment completed
- `void`: Invoice cancelled
- `uncollectible`: Payment failed

## Custom Post Types

### FAQ Post Type
**Purpose**: Frequently asked questions content
**Endpoint**: `/wp-json/wp/v2/faqs`

**Meta Fields**:
```javascript
{
  "question": "wysiwyg",            // FAQ question (required, show_in_rest: true)
  "simple_answer": "textarea",      // Simple text answer (show_in_rest: true)
  "detailed_answer": "wysiwyg",     // Detailed rich text answer (show_in_rest: true)
  "select_answer": "select",        // Select-based answer options (show_in_rest: true)
  "checkbox_answer": "checkbox",    // Checkbox answer options (show_in_rest: true)
  "multiple_choice_answer": "repeater", // Multiple choice answers (show_in_rest: true)
  "category": "text",              // FAQ category (show_in_rest: true)
  "order": "text",                 // Display order (show_in_rest: true)
  "related_faq": "repeater"         // Related FAQ IDs with nested faq_id field (show_in_rest: true)
}
```

### Dynamic Card Post Type
**Purpose**: Reusable content cards for homepage sections
**Endpoint**: `/wp-json/wp/v2/dynamic_card`

**Meta Fields**:
```javascript
{
  "title": "text",           // Card title (show_in_rest: true)
  "card_heading": "text",    // Card heading (show_in_rest: true)
  "card_media": "media",     // Card image/media (URL format, show_in_rest: true)
  "card_body": "textarea",   // Card body text (show_in_rest: true)
  "cta_label": "text",       // Call-to-action label (show_in_rest: true)
  "cta_link": "text"         // Call-to-action link (show_in_rest: true)
}
```

### Dynamic Section Post Type
**Purpose**: Flexible page sections with custom content
**Endpoint**: `/wp-json/wp/v2/dynamic_section`

**Meta Fields**:
```javascript
{
  "layout_style": "select",        // Layout: Left/Right, Full Width, Centered (show_in_rest: true)
  "title": "text",                // Optional display heading (show_in_rest: true)
  "subtext": "text",              // Subheading text (show_in_rest: true)
  "_description": "textarea",     // Description text (show_in_rest: false)
  "featured_image": "media",      // Featured image (URL format, show_in_rest: true)
  "simple_content": "textarea",   // Simple text description (show_in_rest: true)
  "section_body": "wysiwyg",      // Styled content with paragraphs, links, etc. (show_in_rest: true)
  "content_media": "repeater",    // Media items with nested content_item field (show_in_rest: true)
  "is_featured": "switcher",      // Highlight on homepage/funnel entry points (show_in_rest: true)
  "cta_primary_label": "text",    // Primary CTA label (show_in_rest: true)
  "cta_primary_link": "text"      // Primary CTA link (show_in_rest: false)
}
```

### Social Proof Post Type
**Purpose**: Social media testimonials and shoutouts
**Endpoint**: `/wp-json/wp/v2/social_proof`

**Meta Fields**:
```javascript
{
  "full_name": "text",             // Full name of person (required, show_in_rest: false)
  "social_media_platform": "text", // Platform: Twitter/X, Instagram, Facebook, TikTok, Other (required, show_in_rest: false)
  "username": "text",              // @handle or username (show_in_rest: false)
  "profile_link": "text",          // Link to social profile (required, show_in_rest: false)
  "share_link": "text",            // Direct URL to the share/tweet/post (show_in_rest: false)
  "screenshot_upload": "repeater",  // Screenshot backup images with nested media field (show_in_rest: false)
  "share_date": "datetime-local",   // When they posted about you (show_in_rest: false)
  "is_featured": "switcher"         // Featured status (show_in_rest: false)
}
```

### Case Study Post Type
**Purpose**: Detailed project case studies
**Endpoint**: `/wp-json/wp/v2/case_study`

**Meta Fields**:
```javascript
{
  "project_title": "text",        // Project title (show_in_rest: true)
  "client_name": "text",          // Name of client or business (show_in_rest: true)
  "project_problem": "wysiwyg",   // What the client needed (show_in_rest: true)
  "project_solution": "wysiwyg",  // What you did/built (show_in_rest: true)
  "technologies_used": "textarea", // Technologies and tools used (show_in_rest: true)
  "project_media": "media",       // Gallery of images or single upload (show_in_rest: true)
  "project_outcome": "wysiwyg",   // The impact of your work (show_in_rest: true)
  "project_date": "date",         // When project was completed/delivered (show_in_rest: true)
  "is_featured": "switcher"       // Show prominently on homepage (show_in_rest: true)
}
```

### Testimonial Post Type
**Purpose**: Client testimonials and feedback
**Endpoint**: `/wp-json/wp/v2/testimonial`

**Meta Fields**:
```javascript
{
  "reviewer_name": "text",           // Name of person giving testimonial (required, show_in_rest: false)
  "review_content": "text",          // Main body of testimonial (required, show_in_rest: false)
  "review_content_wsywig": "wysiwyg", // Rich text version of testimonial (show_in_rest: false)
  "star_rating": "select",           // 1-5 star rating (★ to ★★★★★) (show_in_rest: false)
  "reviewer_photo": "media",         // Optional reviewer image (URL format, show_in_rest: false)
  "service_type": "select",          // Type of service reviewed (show_in_rest: false)
  "date_submitted": "datetime-local", // When testimonial was submitted (show_in_rest: false)
  "is_featured": "switcher",         // Useful for front page testimonials (show_in_rest: false)
  "is_guest": "switcher"             // Marks as "floating" or unauthenticated (show_in_rest: false)
}
```

## API Endpoints Reference

### Core API Endpoints
```javascript
export const API_ENDPOINTS = {
  // Custom message submission endpoint
  SUBMIT_MESSAGE: `${config.apiBaseUrl}/cmm/v1/submit-message`,

  // JetEngine Custom Content Type endpoints
  ANALYTICS_EVENT: `${config.apiBaseUrl}/jet-cct/analytics_event`,
  APPOINTMENT: `${config.apiBaseUrl}/jet-cct/appointment`,
  INVOICE: `${config.apiBaseUrl}/jet-cct/invoice`,
  MESSAGE: `${config.apiBaseUrl}/jet-cct/message`,

  // Custom Post Type endpoints
  FAQS: `${config.apiBaseUrl}/wp/v2/faqs`,
  DYNAMIC_CARD: `${config.apiBaseUrl}/wp/v2/dynamic_card`,
  DYNAMIC_SECTION: `${config.apiBaseUrl}/wp/v2/dynamic_section`,
  SOCIAL_PROOF: `${config.apiBaseUrl}/wp/v2/social_proof`,
  CASE_STUDY: `${config.apiBaseUrl}/wp/v2/case_study`,
  TESTIMONIAL: `${config.apiBaseUrl}/wp/v2/testimonial`
};
```

### Authentication Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${btoa(username + ':' + applicationPassword)}`
};
```

## Form Submission Integration

### Contact Form Workflow
1. **Frontend Form**: User submits contact form
2. **API Call**: Form data sent to `/jet-cct/message` endpoint
3. **WordPress Storage**: Data stored in JetEngine CCT
4. **Analytics Tracking**: Event recorded in analytics CCT
5. **Email Notification**: WordPress sends notification email
6. **Success Response**: User sees confirmation message

### Sales Funnel Integration
**File**: `js/modules/SalesFunnelForm.js`

**Process**:
1. **Lead Capture**: Form submission creates message record
2. **Analytics Event**: User interaction tracked
3. **Appointment Booking**: Optional consultation scheduling
4. **Invoice Generation**: Automated Stripe invoice creation
5. **Payment Tracking**: Invoice status updates

## Error Handling

### API Response Codes
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (endpoint or resource doesn't exist)
- `500`: Internal Server Error

### Error Response Format
```javascript
{
  "code": "rest_invalid_param",
  "message": "Invalid parameter: email",
  "data": {
    "status": 400,
    "params": {
      "email": "Invalid email format"
    }
  }
}
```

## Development Workflow

### Local Development Setup
1. **WordPress Installation**: Local WordPress with JetEngine plugin
2. **Application Password**: Generate app password for API access
3. **Environment Variables**: Configure Vite with local credentials
4. **Database Setup**: Import CCT definitions and test data

### Production Deployment
1. **CMS Deployment**: WordPress on separate subdomain
2. **Environment Configuration**: Production API credentials
3. **CORS Setup**: Configure WordPress for cross-origin requests
4. **SSL Certificate**: Ensure HTTPS for secure authentication

### Testing API Endpoints
```javascript
// Test authentication
const testAuth = async () => {
  const response = await fetch(`${apiBaseUrl}/wp/v2/users/me`, {
    headers: { 'Authorization': `Basic ${authToken}` }
  });
  return response.ok;
};

// Test CCT endpoint
const testCCT = async () => {
  const response = await fetch(`${apiBaseUrl}/jet-cct/message`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(testData)
  });
  return response.json();
};
```

## Security Considerations

### Data Protection
- **Application Passwords**: Separate from main account credentials
- **Environment Isolation**: Different credentials per environment
- **HTTPS Only**: All API communication over secure connections
- **Input Validation**: Server-side validation for all form data

### Privacy Compliance
- **IP Address Logging**: For analytics and spam prevention
- **Data Retention**: Configurable retention policies
- **GDPR Compliance**: User data deletion capabilities
- **Consent Tracking**: Record user consent for data processing

## Performance Optimization

### Caching Strategy
- **WordPress Caching**: Object caching for frequent queries
- **CDN Integration**: Static asset delivery optimization
- **API Rate Limiting**: Prevent abuse and ensure performance
- **Database Indexing**: Optimized queries for large datasets

### Frontend Optimization
- **Request Debouncing**: Prevent duplicate API calls
- **Error Retry Logic**: Automatic retry for failed requests
- **Loading States**: User feedback during API operations
- **Offline Handling**: Graceful degradation when API unavailable

This documentation provides complete reference for WordPress API integration, enabling effective headless CMS development and maintenance.