# Polymorphic Message System Documentation

## Overview

The portfolio website implements a **polymorphic message system** where all form submissions flow through a unified `message` Custom Content Type (CCT) in WordPress. The `type` field acts as the **discriminator** to identify different kinds of messages, enabling a flexible and extensible communication system that supports the sales funnel workflow.

## Architecture Pattern

### Core Concept
Instead of having separate tables/endpoints for each form type, all messages are stored in a single `message` CCT with a discriminator field that determines the message type and how it should be processed.

### Key Benefits
- **Unified Storage**: All communications in one place for easy management
- **Flexible Threading**: Chain related messages using `chain_id` and `conversation_id`
- **Sales Funnel Integration**: Seamless flow from initial contact to payment
- **Extensible Design**: Easy to add new message types without schema changes

## Message Types (Discriminator Values)

The system currently supports these message types via the `type` field:

### 1. Contact Messages (`type: 'contact'`)
**Purpose**: Basic contact form submissions
**Form Module**: `ContactForm.js`
**Storage Strategy**: Simple CSV format in `simple_message` field

**Fields Used**:
```javascript
{
  type: 'contact',
  name: 'Contact name',
  email_address: 'contact@example.com',
  phone: 'Optional phone number',
  subject: 'Optional subject line',
  simple_message: 'Message content'
}
```

### 2. Lead Generation (`type: 'lead'`)
**Purpose**: Sales funnel lead capture forms
**Form Module**: `SalesFunnelForm.js`
**Storage Strategy**: CSV format for simple forms

**Fields Used**:
```javascript
{
  type: 'lead',
  name: 'Lead name',
  email_address: 'lead@example.com',
  phone: 'Optional phone',
  subject: 'Lead Inquiry - [Service Interest]',
  simple_message: 'CSV formatted lead data'
}
```

### 3. Consultation Requests (`type: 'consultation'`)
**Purpose**: Free consultation booking requests
**Form Module**: `ProjectQuotePage.js`, `ProjectDiscovery.js`
**Storage Strategy**: HTML format in `detailed_message` for complex data

**Fields Used**:
```javascript
{
  type: 'consultation',
  name: 'Client name',
  email_address: 'client@example.com',
  subject: 'Consultation Request - [Project Type]',
  detailed_message: 'Structured HTML with project details'
}
```

### 4. Quote Requests (`type: 'quote'`)
**Purpose**: Project quote and proposal requests
**Form Module**: `ProjectQuotePage.js`
**Storage Strategy**: HTML format for complex project details

**Fields Used**:
```javascript
{
  type: 'quote',
  name: 'Client name',
  email_address: 'client@example.com',
  subject: 'Quote Request - [Project Type]',
  detailed_message: 'Structured HTML with project requirements',
  media_content: [/* File attachments */]
}
```

### 5. Appointment Bookings (`type: 'appointment'`)
**Purpose**: Scheduled consultation appointments
**Form Module**: `ConsultationBooking.js`
**Storage Strategy**: CSV format with appointment details

**Fields Used**:
```javascript
{
  type: 'appointment',
  name: 'Client name',
  email_address: 'client@example.com',
  subject: '[Consultation Type] - [Selected Date]',
  simple_message: 'Appointment details in CSV format',
  chain_id: 'appointment_[timestamp]_[random]'
}
```

### 6. Future Message Types
The system is designed to support additional types:
- `payment`: Payment confirmations and receipts
- `support`: Customer support requests
- `user_message`: User-initiated conversation messages
- `saraii_response`: AI assistant responses
- `system_message`: Automated system notifications

## Message Threading System

### Chain ID (`chain_id`)
- **Purpose**: Groups related messages in a conversation thread
- **Format**: `[prefix]_[timestamp]_[random]`
- **Examples**:
  - `appointment_1706297453_a7b2c8`
  - `session_1706297453_x9m4p1`
  - `form_quote_1706297453_k5n7w3`

### Message ID (`message_id`)
- **Purpose**: Links appointments and invoices back to original messages
- **Usage**: Created by WordPress when message is stored, then referenced by related records

### Conversation ID (`conversation_id`)
- **Purpose**: Long-term conversation threading across multiple chains
- **Usage**: Tracks entire customer relationship from first contact to project completion

## Storage Strategies

### Simple CSV Format (`simple_message`)
Used for basic forms with limited fields:

```
Service Interest: Web Development, Budget Range: $5k-10k, Timeline: 3 months, Company: Tech Startup Inc., Message: Looking for a modern website with e-commerce capabilities...
```

**Parsing**:
```javascript
parseCSVMessage(csvString) {
  const data = {};
  csvString.split(', ').forEach(item => {
    const [key, ...valueParts] = item.split(': ');
    if (key && valueParts.length > 0) {
      data[key.trim()] = valueParts.join(': ').trim();
    }
  });
  return data;
}
```

### Structured HTML Format (`detailed_message`)
Used for complex forms with multiple sections:

```html
<div class="structured-form-data">
  <h4>Contact Information</h4>
  <p><strong>Company:</strong> Tech Startup Inc.</p>
  <p><strong>Website:</strong> https://example.com</p>

  <h4>Project Details</h4>
  <p><strong>Project Type:</strong> E-commerce Website</p>
  <p><strong>Budget Range:</strong> $5,000 - $10,000</p>

  <h4>Project Description</h4>
  <div class="user-content">
    Detailed project requirements with rich formatting...
  </div>
</div>
```

## Sales Funnel Integration

### 1. Initial Contact
```javascript
// User submits contact form
{
  type: 'contact',
  name: 'John Doe',
  email_address: 'john@example.com',
  simple_message: 'Interested in web development services'
}
```

### 2. Lead Qualification
```javascript
// User fills out detailed lead form
{
  type: 'lead',
  name: 'John Doe',
  email_address: 'john@example.com',
  simple_message: 'Project Type: E-commerce, Budget: $10k-25k, Timeline: 6 months'
}
```

### 3. Consultation Booking
```javascript
// Message record first
{
  type: 'appointment',
  name: 'John Doe',
  email_address: 'john@example.com',
  simple_message: 'Consultation Type: video, Date: 2025-02-15, Time: 10:00 AM'
}

// Then appointment record with message_id reference
{
  message_id: '123',
  appointment_type: 'video',
  scheduled_date: '2025-02-15',
  scheduled_time: '10:00'
}
```

### 4. Project Quote
```javascript
{
  type: 'quote',
  name: 'John Doe',
  email_address: 'john@example.com',
  detailed_message: '<structured HTML with full project requirements>',
  media_content: [/* Design files, brand assets */]
}
```

### 5. Payment Processing
```javascript
// Invoice record references the original message
{
  message_id: '123',
  stripe_payment_intent_id: 'pi_1234567890',
  customer_name: 'John Doe',
  deposit_amount: '500.00'
}
```

## Form Submission Workflow

### Step 1: Universal Message Creation
All forms use `SalesFunnelForm.createMessageSubmission()`:

```javascript
async createMessageSubmission(formType, formData, userMessage = '') {
  const baseMessage = {
    type: formType,  // Discriminator field
    name: formData.name,
    email_address: formData.email,
    subject: this.generateSubject(formType, formData)
  };

  // Storage strategy based on complexity
  if (this.isSimpleForm(formType)) {
    baseMessage.simple_message = this.formatAsCSV(formData, userMessage);
  } else {
    baseMessage.detailed_message = this.formatAsHTML(formData, userMessage);
  }

  return baseMessage;
}
```

### Step 2: Message Submission
```javascript
// Submit to WordPress API
const response = await fetch('/wp-json/jet-cct/message', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify(messageData)
});

const result = await response.json();
const messageId = result.id; // WordPress-generated ID
```

### Step 3: Related Record Creation
For complex forms, additional records are created:

```javascript
// Example: Appointment booking
if (formType === 'appointment') {
  await this.createAppointmentRecord(messageId, formData);
}

// Example: Invoice generation
if (formType === 'payment') {
  await this.createInvoiceRecord(messageId, paymentData);
}
```

## API Endpoints

### Message Endpoint
```javascript
POST /wp-json/jet-cct/message
```

**Request Body**:
```javascript
{
  "type": "contact|lead|consultation|quote|appointment",
  "name": "string",
  "email_address": "string",
  "phone": "string (optional)",
  "subject": "string",
  "simple_message": "string (for simple forms)",
  "detailed_message": "string (for complex forms)",
  "media_content": ["array of file URLs"],
  "chain_id": "string (for threading)",
  "conversation_id": "string (for long-term tracking)"
}
```

### Related Endpoints
```javascript
// Appointment records
POST /wp-json/jet-cct/appointment

// Invoice records
POST /wp-json/jet-cct/invoice

// Analytics events
POST /wp-json/jet-cct/analytics_event
```

## Message Processing Logic

### Backend Processing (WordPress)
1. **Message Storage**: All messages stored in `message` CCT
2. **Type-Based Routing**: Custom WordPress actions based on `type` field
3. **Email Notifications**: Different templates for different message types
4. **CRM Integration**: Messages forwarded to appropriate sales/support queues

### Frontend Handling
1. **Form Identification**: Each form determines its `type`
2. **Data Formatting**: Choose CSV vs HTML based on complexity
3. **Submission Flow**: Universal submission through `SalesFunnelForm`
4. **Success Actions**: Type-specific redirect and thank you pages

## Environment Configuration

### Development
- **API Base**: `http://christinmorton.local/wp-json`
- **Table Prefix**: `wp_jet_cct`
- **Message Table**: `wp_jet_cct_message`

### Production
- **API Base**: `https://cms.christinmorton.com/wp-json`
- **Table Prefix**: `4cm_jet_cct`
- **Message Table**: `4cm_jet_cct_message`

## Error Handling

### Message Type Validation
```javascript
const validTypes = ['contact', 'lead', 'consultation', 'quote', 'appointment'];
if (!validTypes.includes(messageData.type)) {
  throw new Error(`Invalid message type: ${messageData.type}`);
}
```

### Fallback Strategies
- **API Unavailable**: Development mode with console logging
- **Invalid Type**: Default to 'contact' type
- **Missing Required Fields**: Client-side validation before submission

## Analytics Integration

Each message submission triggers analytics events:

```javascript
// Track message submission
analytics.trackFormSubmit({
  messageId: result.id,
  type: messageData.type,
  timestamp: new Date().toISOString()
});

// Track with chain ID for funnel analysis
analytics.trackEvent('message_created', {
  message_type: messageData.type,
  chain_id: messageData.chain_id,
  funnel_stage: this.getFunnelStage(messageData.type)
});
```

## Security Considerations

### Input Validation
- **Type Whitelisting**: Only allowed message types accepted
- **Email Validation**: Server-side email format checking
- **Content Sanitization**: HTML content sanitized before storage

### Authentication
- **WordPress App Passwords**: Secure API authentication
- **Environment-Specific Credentials**: Different auth per environment
- **Request Rate Limiting**: Prevent abuse and spam

## Usage Examples

### Simple Contact Form
```javascript
import ContactForm from './modules/ContactForm.js';

// Creates message with type: 'contact'
const contactForm = new ContactForm('#contactForm');
```

### Complex Quote Request
```javascript
import SalesFunnelForm from './modules/SalesFunnelForm.js';

const funnel = new SalesFunnelForm();
await funnel.handleFormSubmission('quote', formElement, {
  userMessage: richTextContent
});
```

### Appointment with Threading
```javascript
import ConsultationBooking from './modules/ConsultationBooking.js';

// Creates message with type: 'appointment' + appointment record
const booking = new ConsultationBooking();
// Automatically handles message creation and appointment linking
```

## Future Enhancements

### Planned Message Types
- **AI Responses**: `type: 'saraii_response'` for automated responses
- **System Messages**: `type: 'system_message'` for automated notifications
- **User Messages**: `type: 'user_message'` for ongoing conversations

### Advanced Features
- **Message Status Tracking**: Read/unread states
- **Automated Workflows**: Trigger actions based on message type
- **CRM Integration**: Sync with external customer management systems
- **AI Processing**: Automated response generation based on message content

This polymorphic message system provides a robust foundation for managing all customer communications while maintaining flexibility for future growth and feature additions.