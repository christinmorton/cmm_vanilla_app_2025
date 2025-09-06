# Message Polymorphism System

This document describes the highly flexible polymorphic message system that leverages the `message` custom content type as a universal communication schema. The system is designed as a "one-size-fits-all" solution for sharing information between frontend and backend.

## System Overview

The `message` content type uses **adaptive polymorphism** where the `type` field acts as a discriminator, but the schema remains extremely flexible to accommodate diverse use cases from simple contact forms to complex chat systems and file sharing workflows.

## Design Philosophy

This message system follows the principle of **maximum flexibility with minimal constraints**:

- **Backend Requirements**: Only `name` and `type` fields are required
- **Frontend Flexibility**: Different forms can enforce different field requirements
- **Adaptive UI**: Forms can be as simple or complex as needed
- **Multi-Purpose**: Same schema works for contact forms, chat messages, file sharing, etc.
- **Rich Content Support**: Toggle between simple text and rich WYSIWYG content

## Core Concept

Instead of creating separate content types for each message category, we use a single `message` schema with a `type` field to differentiate between:
- Contact messages
- Lead capture messages  
- Future message types (newsletter signups, consultation requests, etc.)

## Flexible Message Schema

**Database Table:** `wp_jet_cct_message`  
**Endpoint:** `/wp-json/jet-cct/message`

### Schema Structure (Backend Constraints)
```javascript
{
  // REQUIRED FIELDS (Backend)
  type: "contact|lead|newsletter|consultation|chat|file_share|custom",  // Required
  name: "John Doe",  // Required
  
  // OPTIONAL FIELDS (All optional on backend, frontend can enforce as needed)
  email_address: "john@example.com",     // Optional - for email-based forms
  phone: "+1234567890",                  // Optional - for phone-based forms  
  subject: "Project Inquiry",            // Optional - contextual subject
  
  // MESSAGE CONTENT (Choose one or both based on form complexity)
  simple_message: "Brief message text",           // Textarea - simple forms
  detailed_message: "<p>Rich text content</p>",   // WYSIWYG - complex forms
  
  // MEDIA SUPPORT (JetEngine Repeater: array of media URLs)
  media_content: [                       // File upload support
    "https://site.com/uploads/file1.pdf",
    "https://site.com/uploads/image1.jpg"
  ],
  
  chain_id: "unique-chain-identifier"    // Optional - for threading/conversations
}
```

### Content Field Usage Patterns

#### Simple Message vs Detailed Message
- **`simple_message`**: Plain textarea input for basic forms
- **`detailed_message`**: Rich text WYSIWYG editor (uses RichTextEditor.js)
- **Toggle Option**: Forms can offer users choice between simple/detailed input
- **Both Fields**: Can be used simultaneously for different purposes

## Adaptive Message Types & Use Cases

The system's flexibility allows for numerous implementation patterns. Here are examples showing how the same schema adapts to different needs:

### 1. Simple Contact Form (`type: "contact"`)

**Use Case:** Minimal contact form with just essential fields  
**Frontend Requirements:** Name, Subject, Simple Message  
**Backend Storage:** Only required fields + simple_message

```javascript
// Minimal contact form submission
{
  type: "contact",
  name: "Jane Doe",           // Required
  subject: "Quick Question",   // Frontend enforced
  simple_message: "Hi, I need help with my website", // Textarea
  // All other fields omitted - perfectly valid
}
```

### 2. Complex Contact Form (`type: "contact"`)

**Use Case:** Detailed contact form with rich text and file uploads  
**Frontend Requirements:** Name, Email, Rich Message Editor, File Upload  
**Backend Storage:** All relevant fields populated

```javascript
// Complex contact form submission  
{
  type: "contact",
  name: "John Smith",
  email_address: "john@example.com",
  subject: "Website Redesign Project",
  detailed_message: "<p>I need a <strong>complete redesign</strong> with the following features:</p><ul><li>Responsive design</li><li>E-commerce integration</li></ul>",
  media_content: [
    "uploads/current-site-screenshot.png",
    "uploads/design-inspiration.pdf"
  ],
  chain_id: "contact_thread_001"
}
```

### 3. Phone-Preferred Form (`type: "lead"`)

**Use Case:** Lead form preferring phone contact over email  
**Frontend Requirements:** Name, Phone, Simple Message  
**Backend Storage:** No email required

```javascript
// Phone-based lead form
{
  type: "lead", 
  name: "Mike Johnson",
  phone: "+1-555-123-4567",    // Primary contact method
  subject: "SEO Services Inquiry",
  simple_message: "Please call me about your SEO packages"
  // No email_address - demonstrates flexibility
}
```

### 4. Chat System Messages (`type: "chat"`)

**Use Case:** Real-time chat or messaging system  
**Frontend Requirements:** Name only (user identification)  
**Backend Storage:** Minimal data for rapid message exchange

```javascript
// Chat message in conversation thread
{
  type: "chat",
  name: "ChatUser123",         // User identifier
  simple_message: "Hello, are you available for a quick question?",
  chain_id: "chat_room_abc123" // Links messages in same conversation
  // Ultra-minimal - perfect for chat systems
}
```

### 5. File Sharing (`type: "file_share"`)

**Use Case:** File upload and sharing system  
**Frontend Requirements:** Name, Files  
**Backend Storage:** Focus on media_content array

```javascript
// File sharing submission
{
  type: "file_share",
  name: "Design Team",
  subject: "Project Assets - Q1 Campaign", 
  simple_message: "Here are the final assets for review",
  media_content: [
    "uploads/logo-variations.zip",
    "uploads/brand-guidelines.pdf", 
    "uploads/mockups-final.sketch",
    "uploads/presentation.pptx"
  ],
  chain_id: "project_q1_assets"
}
```

### 6. Lead Messages (`type: "lead"`)

**Use Case:** Marketing lead capture forms  
**Form Location:** Landing pages, service pages, CTAs  
**Frontend Requirements:** Typically name, email, interest description
**Backend Storage:** Focus on lead qualification data

```javascript
// Standard lead capture
{
  type: "lead",
  name: "Alex Thompson",
  email_address: "alex@business.com",
  phone: "+1-555-987-6543", 
  subject: "Lead Inquiry - SEO Services",
  simple_message: "Interested in SEO packages for my local restaurant chain",
  chain_id: "lead_seo_q1_2024"
}
```

**Filtering in JetEngine:** `type = "lead"`

---

### 7. Newsletter Signups (`type: "newsletter"`)

**Use Case:** Email newsletter subscriptions  
**Form Location:** Footer, blog sidebar, popup modals  
**Frontend Requirements:** Usually just name and email
**Backend Storage:** Minimal data for subscription management

```javascript
// Newsletter subscription
{
  type: "newsletter",
  name: "Emma Rodriguez",
  email_address: "emma@email.com",
  subject: "Newsletter Subscription",
  simple_message: "Newsletter signup from blog sidebar",
  // Minimal fields - perfect for quick signups
}
```

**Filtering in JetEngine:** `type = "newsletter"`

---

### 8. Consultation Requests (`type: "consultation"`)

**Use Case:** Free consultation booking requests  
**Form Location:** Services page, consultation landing page  
**Frontend Requirements:** Comprehensive project details
**Backend Storage:** Detailed consultation information

```javascript
// Consultation request with detailed requirements
{
  type: "consultation",
  name: "Michael Chen",
  email_address: "michael@startup.com",
  phone: "+1-555-456-7890",
  subject: "Consultation Request - Web Development",
  detailed_message: "<p>Looking for consultation on <strong>SaaS platform development</strong>:</p><ul><li>User authentication system</li><li>Subscription billing</li><li>API development</li></ul>",
  media_content: ["uploads/wireframes.pdf", "uploads/requirements.docx"],
  chain_id: "consultation_saas_project"
}
```

**Filtering in JetEngine:** `type = "consultation"`

---

### 9. Rich Content Toggle Form (`type: "consultation"`)

**Use Case:** Form offering users choice between simple/rich text input  
**Frontend Feature:** Toggle between textarea and WYSIWYG editor  
**Backend Storage:** Uses either simple_message OR detailed_message

```javascript
// User chose rich text editor
{
  type: "consultation",
  name: "Sarah Wilson",
  email_address: "sarah@company.com",
  subject: "E-commerce Development",
  detailed_message: `
    <h3>Project Requirements</h3>
    <p>We need an e-commerce solution with:</p>
    <ul>
      <li><strong>Payment Integration</strong>: Stripe & PayPal</li>
      <li><strong>Inventory Management</strong>: Real-time stock tracking</li>  
      <li><strong>Mobile Responsive</strong>: Progressive Web App</li>
    </ul>
    <p>Timeline: <em>3-4 months</em></p>
  `,
  media_content: ["uploads/current-site-audit.pdf"]
}

// Same form - user chose simple textarea  
{
  type: "consultation",
  name: "Mark Davis", 
  email_address: "mark@startup.com",
  subject: "E-commerce Development",
  simple_message: "Need basic online store for handmade crafts. About 50 products. Stripe payments. Mobile friendly. Budget around $5k."
}
```

## Technical Implementation Details

### RichTextEditor.js Integration

The `detailed_message` field is specifically designed to work with the RichTextEditor.js component for WordPress-compatible rich text content.

```javascript
// Rich text editor implementation
import RichTextEditor from './js/RichTextEditor.js';

class AdaptiveMessageForm {
  constructor() {
    this.messageMode = 'simple'; // 'simple' or 'detailed'
    this.richEditor = null;
  }

  // Toggle between simple textarea and rich editor
  toggleMessageMode() {
    const isDetailed = this.messageMode === 'detailed';
    
    if (isDetailed) {
      // Initialize rich text editor for detailed_message
      this.richEditor = new RichTextEditor({
        target: '#detailed-message-editor',
        content: this.getExistingContent()
      });
    } else {
      // Switch to simple textarea
      if (this.richEditor) {
        this.richEditor.destroy();
        this.richEditor = null;
      }
    }
    
    this.messageMode = isDetailed ? 'simple' : 'detailed';
    this.updateUI();
  }

  // Form submission with appropriate message field
  getMessageData() {
    return this.messageMode === 'detailed' 
      ? { detailed_message: this.richEditor.getContent() }
      : { simple_message: this.getSimpleMessage() };
  }
}
```

### Media Content File Upload System

The `media_content` field uses JetEngine's repeater functionality to store multiple file URLs.

```javascript
// File upload handling for media_content array
class MessageFileUploader {
  constructor() {
    this.uploadedFiles = [];
  }

  async uploadFiles(fileList) {
    const uploadPromises = Array.from(fileList).map(file => {
      return this.uploadSingleFile(file);
    });
    
    this.uploadedFiles = await Promise.all(uploadPromises);
    return this.uploadedFiles;
  }

  async uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/wp-json/wp/v2/media', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer ' + this.getWPToken()
      }
    });
    
    const result = await response.json();
    return result.source_url; // Return URL for media_content array
  }

  // Get file URLs for message submission
  getMediaUrls() {
    return this.uploadedFiles;
  }
}
```

## Benefits of This Flexible System

### 1. **Maximum Adaptability**
- Forms can be as simple or complex as needed
- Same backend schema handles vastly different use cases
- Frontend requirements drive field usage, not schema constraints

### 2. **Future-Proof Architecture** 
- New message types require no database changes
- Chat systems, file sharing, surveys - all use same schema
- Easy to prototype new communication features

### 3. **Content Flexibility**
- Simple forms use textarea (simple_message)
- Complex forms use rich text editor (detailed_message)
- Both can coexist in same form for different purposes
- Toggle UI lets users choose their preferred input method

### 4. **Universal File Support**
- Any message type can include file attachments
- JetEngine repeater field stores multiple file URLs
- Supports documents, images, archives - any file type

### 5. **Conversation Threading**
- `chain_id` links related messages across any message type
- Chat conversations, email threads, project communications
- Same threading system works universally

## Implementation Guidelines

### Adaptive Form Submission System

```javascript
// Universal message submission handler
const submitAdaptiveMessage = async (formData, messageType, options = {}) => {
  // Start with required fields only
  const messageData = {
    type: messageType,        // Always required
    name: formData.name       // Always required
  };

  // Add optional fields only if present and valid
  if (formData.email && formData.email.includes('@')) {
    messageData.email_address = formData.email;
  }
  
  if (formData.phone && formData.phone.trim()) {
    messageData.phone = formData.phone;
  }
  
  if (formData.subject && formData.subject.trim()) {
    messageData.subject = formData.subject;
  }

  // Handle message content based on form type
  if (options.useRichEditor && formData.detailed_message) {
    messageData.detailed_message = formData.detailed_message; // Rich HTML content
  } else if (formData.simple_message) {
    messageData.simple_message = formData.simple_message; // Plain text
  }

  // Add media files if uploaded
  if (formData.media_files && formData.media_files.length > 0) {
    messageData.media_content = formData.media_files; // Array of URLs
  }

  // Add chain ID for threading if needed
  if (formData.chain_id || options.createThread) {
    messageData.chain_id = formData.chain_id || generateChainId(messageType);
  }

  const response = await fetch('/wp-json/jet-cct/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });

  return response.json();
};

// Usage examples:

// Simple contact form (name + message only)
await submitAdaptiveMessage({
  name: "John Doe",
  simple_message: "Quick question about your services"
}, "contact");

// Complex consultation form with rich editor
await submitAdaptiveMessage({
  name: "Jane Smith", 
  email: "jane@company.com",
  detailed_message: "<p>Detailed project requirements...</p>"
}, "consultation", { useRichEditor: true });

// Chat message (minimal)
await submitAdaptiveMessage({
  name: "ChatUser123",
  simple_message: "Hello there!",
  chain_id: "chat_room_456"
}, "chat");
```
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