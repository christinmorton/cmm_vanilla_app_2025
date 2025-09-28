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
  "name": "string",           // Contact name
  "email": "string",          // Contact email
  "phone": "string",          // Phone number (optional)
  "subject": "string",        // Message subject
  "message": "text",          // Message content
  "form_type": "string",      // Type of form submitted
  "source_page": "string",    // Page where form was submitted
  "status": "string",         // Processing status
  "created_date": "datetime", // Submission timestamp
  "ip_address": "string",     // User IP for tracking
  "user_agent": "string"      // Browser information
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
  "event_type": "string",     // Type of event (page_view, form_submit, etc.)
  "event_name": "string",     // Specific event name
  "page_url": "string",       // Current page URL
  "referrer": "string",       // Referring page
  "user_id": "string",        // Anonymous user identifier
  "session_id": "string",     // Session identifier
  "event_data": "json",       // Additional event data
  "timestamp": "datetime",    // Event timestamp
  "ip_address": "string",     // User IP
  "user_agent": "string"      // Browser information
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
  "client_name": "string",        // Client name
  "client_email": "string",       // Client email
  "client_phone": "string",       // Client phone
  "appointment_type": "string",   // Type of appointment
  "preferred_date": "date",       // Requested date
  "preferred_time": "time",       // Requested time
  "timezone": "string",           // Client timezone
  "project_description": "text", // Project details
  "budget_range": "string",       // Expected budget
  "status": "string",            // Booking status
  "meeting_link": "string",      // Video call link
  "notes": "text",               // Additional notes
  "created_date": "datetime"     // Booking timestamp
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
  "stripe_invoice_id": "string",   // Stripe invoice ID
  "client_email": "string",        // Client email
  "client_name": "string",         // Client name
  "amount": "decimal",             // Invoice amount
  "currency": "string",            // Currency code
  "service_type": "string",        // Type of service
  "project_description": "text",   // Project details
  "status": "string",              // Payment status
  "due_date": "date",              // Payment due date
  "paid_date": "datetime",         // Payment completion date
  "created_date": "datetime",      // Invoice creation date
  "stripe_payment_intent": "string", // Stripe payment intent ID
  "metadata": "json"               // Additional Stripe metadata
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

### Dynamic Card Post Type
**Purpose**: Reusable content cards for homepage sections
**Endpoint**: `/wp-json/wp/v2/dynamic_card`

### Dynamic Section Post Type
**Purpose**: Flexible page sections with custom content
**Endpoint**: `/wp-json/wp/v2/dynamic_section`

### Social Proof Post Type
**Purpose**: Client testimonials and reviews
**Endpoint**: `/wp-json/wp/v2/social_proof`

### Case Study Post Type
**Purpose**: Detailed project case studies
**Endpoint**: `/wp-json/wp/v2/case_study`

### Testimonial Post Type
**Purpose**: Client testimonials and feedback
**Endpoint**: `/wp-json/wp/v2/testimonial`

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