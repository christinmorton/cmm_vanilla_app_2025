# Message Polymorphism System

This document describes the polymorphic message system design that leverages the `message` custom content type to handle multiple message categories through a single unified schema.

## System Overview

The `message` content type uses **type-based polymorphism** where the `type` field acts as a discriminator to categorize different kinds of messages while maintaining a consistent data structure. This approach provides flexibility, scalability, and centralized message management.

## Core Concept

Instead of creating separate content types for each message category, we use a single `message` schema with a `type` field to differentiate between:
- Contact messages
- Lead capture messages  
- Future message types (newsletter signups, consultation requests, etc.)

## Message Schema

**Database Table:** `wp_jet_cct_message`  
**Endpoint:** `/wp-json/jet-cct/message`

```javascript
{
  type: "contact|lead|newsletter|consultation",  // Discriminator field
  name: "John Doe",
  email_address: "john@example.com", 
  phone: "+1234567890",
  subject: "Project Inquiry",
  simple_message: "Brief message text",
  detailed_message: "<p>Rich text message content</p>",
  media_content: ["url1", "url2"],  // Repeater field
  chain_id: "unique-chain-identifier"
}
```

## Message Types Implementation

### 1. Contact Messages (`type: "contact"`)

**Use Case:** General contact form submissions  
**Form Location:** Contact page  

**Field Usage:**
- `name` - Required: Contact's full name
- `email_address` - Required: Contact email
- `phone` - Optional: Contact phone number  
- `subject` - Required: Message subject
- `simple_message` - Required: Main message content
- `detailed_message` - Optional: Extended message details
- `media_content` - Optional: Attached files/images
- `chain_id` - Auto-generated: For conversation threading

**Filtering in JetEngine:** `type = "contact"`

---

### 2. Lead Messages (`type: "lead"`)

**Use Case:** Marketing lead capture forms  
**Form Location:** Landing pages, service pages, CTAs  

**Field Usage:**
- `name` - Required: Lead's name
- `email_address` - Required: Lead email
- `phone` - Optional: Lead phone for callbacks
- `subject` - Auto-populated: "Lead Inquiry - [Service]"
- `simple_message` - Required: Interest description
- `detailed_message` - Optional: Project details
- `media_content` - Optional: Project references
- `chain_id` - Auto-generated: For lead tracking

**Filtering in JetEngine:** `type = "lead"`

---

### 3. Newsletter Signups (`type: "newsletter"`)

**Use Case:** Email newsletter subscriptions  
**Form Location:** Footer, blog sidebar, popup modals  

**Field Usage:**
- `name` - Optional: Subscriber name
- `email_address` - Required: Subscription email
- `phone` - Not used
- `subject` - Auto-populated: "Newsletter Subscription"
- `simple_message` - Auto-populated: "Newsletter signup"
- `detailed_message` - Optional: Subscription preferences
- `media_content` - Not used
- `chain_id` - Auto-generated: For unsubscribe tracking

**Filtering in JetEngine:** `type = "newsletter"`

---

### 4. Consultation Requests (`type: "consultation"`)

**Use Case:** Free consultation booking requests  
**Form Location:** Services page, consultation landing page  

**Field Usage:**
- `name` - Required: Client name
- `email_address` - Required: Client email
- `phone` - Required: For consultation scheduling
- `subject` - Auto-populated: "Consultation Request - [Service]"
- `simple_message` - Required: Project overview
- `detailed_message` - Required: Detailed requirements
- `media_content` - Optional: Reference materials
- `chain_id` - Auto-generated: For consultation tracking

**Filtering in JetEngine:** `type = "consultation"`

## Benefits of This System

### 1. **Unified Data Management**
- Single database table for all message types
- Consistent API endpoints
- Centralized message handling logic

### 2. **Scalable Architecture**
- Easy to add new message types without schema changes
- No need to create new database tables
- Maintains data consistency across message types

### 3. **Flexible Field Usage**
- Same fields can serve different purposes based on type
- Optional fields provide flexibility without waste
- Rich text and media support for all message types

### 4. **Simplified Backend Management**
- Single JetEngine listing with type-based filtering
- Unified message processing workflows
- Consistent validation and sanitization

### 5. **Frontend Development Efficiency**
- Single API endpoint for all messages
- Reusable form components
- Type-based rendering logic

## Implementation Guidelines

### Frontend Form Handling

```javascript
// Example form submission
const submitMessage = async (formData, messageType) => {
  const messageData = {
    type: messageType,
    name: formData.name,
    email_address: formData.email,
    phone: formData.phone || '',
    subject: formData.subject || generateSubject(messageType),
    simple_message: formData.message,
    detailed_message: formData.details || '',
    media_content: formData.attachments || [],
    chain_id: generateChainId()
  };

  const response = await fetch('/wp-json/jet-cct/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });

  return response.json();
};
```

### JetEngine Filtering

Create separate views in JetEngine dashboard:
- **Contact Messages:** Filter by `type = "contact"`
- **Leads:** Filter by `type = "lead"`  
- **Newsletters:** Filter by `type = "newsletter"`
- **Consultations:** Filter by `type = "consultation"`

### API Querying

```javascript
// Get messages by type
const getMessagesByType = async (type) => {
  const response = await fetch(
    `/wp-json/jet-cct/message?meta_key=type&meta_value=${type}`
  );
  return response.json();
};

// Get all contact messages
const contactMessages = await getMessagesByType('contact');

// Get all leads
const leadMessages = await getMessagesByType('lead');
```

## Message Type Validation

### Frontend Validation
```javascript
const VALID_MESSAGE_TYPES = ['contact', 'lead', 'newsletter', 'consultation'];

const validateMessageType = (type) => {
  return VALID_MESSAGE_TYPES.includes(type);
};
```

### Backend Validation (WordPress)
```php
// JetEngine meta field validation
function validate_message_type($value) {
    $valid_types = ['contact', 'lead', 'newsletter', 'consultation'];
    return in_array($value, $valid_types);
}
```

## Future Extensibility

This system easily accommodates new message types:

### Potential Future Types:
- `type: "quote"` - Project quote requests
- `type: "support"` - Technical support messages  
- `type: "feedback"` - Client feedback submissions
- `type: "partnership"` - Business partnership inquiries
- `type: "job_inquiry"` - Employment applications

### Adding New Types:
1. Update validation arrays with new type
2. Create new JetEngine filtered view
3. Add frontend form for new type
4. Update documentation

## Security Considerations

1. **Input Sanitization:** Validate and sanitize all fields based on message type
2. **Type Validation:** Ensure only valid message types are accepted
3. **Rate Limiting:** Implement rate limiting per message type
4. **Spam Protection:** Add CAPTCHA or honeypot fields to forms
5. **Data Privacy:** Handle PII appropriately based on message type purpose

## Analytics and Reporting

Track message performance by type:
- Conversion rates by message type
- Response times per type
- Popular message types
- Seasonal trends by type

This polymorphic approach provides a robust, scalable foundation for handling diverse message types while maintaining system simplicity and developer productivity.