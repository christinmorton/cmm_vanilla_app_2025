# Headless API Documentation

This document outlines the API resources available through the WordPress JetEngine headless CMS setup for the CMM frontend application.

## Overview

The API provides access to custom post types (CPT) and custom content types (CCT) through WordPress REST API endpoints. All content is managed via JetEngine plugin and accessible via HTTP requests.

## Base API Endpoints

```
GET /wp-json/wp/v2/{post_type}
GET /wp-json/jet-cct/{content_type}
```

---

## Custom Post Types (CPT)

These content types are stored as WordPress posts with custom meta fields.

### 1. Frequently Asked Questions (`faqs`)

**Endpoint:** `/wp-json/wp/v2/faqs`

**Purpose:** Store FAQ content with multiple answer formats

**Fields:**
- `question` (wysiwyg) - The FAQ question with rich text
- `simple_answer` (textarea) - Plain text short answer
- `detailed_answer` (wysiwyg) - Rich text detailed answer
- `select_answer` (select) - Dropdown answer option
- `checkbox_answer` (checkbox) - Boolean answer option
- `multiple_choice_answer` (repeater: text) - Array of choice options
- `category` (text) - FAQ category for grouping
- `order` (number) - Sort order
- `related_faq` (repeater: post_id) - Array of related FAQ IDs

**Use Cases:**
- FAQ pages
- Help documentation
- Support content

---

### 2. Dynamic Card (`dynamic_card`)

**Endpoint:** `/wp-json/wp/v2/dynamic_card`

**Purpose:** Reusable card components for various UI sections

**Fields:**
- `title` (text) - Card title
- `card_heading` (text) - Card heading
- `card_body` (textarea) - Card content
- `card_media` (repeater: url) - Array of media URLs
- `cta_label` (text) - Call-to-action button text
- `cta_link` (text/url) - Call-to-action URL

**Use Cases:**
- Feature cards
- Service cards
- Portfolio previews
- Landing page sections

---

### 3. Dynamic Section (`dynamic_section`)

**Endpoint:** `/wp-json/wp/v2/dynamic_section`

**Purpose:** Flexible content sections with multiple layout options

**Fields:**
- `layout_style` (select) - Section layout variant
- `title` (text) - Section title
- `subtext` (text) - Section subtitle
- `description` (textarea) - Section description
- `featured_image` (media/url) - Hero/featured image
- `simple_content` (textarea) - Plain text content
- `styles_content` (wysiwyg) - Rich text content with styling
- `content_media` (repeater: url) - Array of media URLs
- `is_featured` (boolean) - Featured section flag
- `cta_primary_label` (text) - Primary CTA text
- `cta_primary_link` (text/url) - Primary CTA URL

**Use Cases:**
- Homepage sections
- About page content
- Service descriptions
- Landing page blocks

---

### 4. Social Proof (`social_proof`)

**Endpoint:** `/wp-json/wp/v2/social_proof`

**Purpose:** Social media mentions, shares, and proof content

**Fields:**
- `full_name` (text) - Person's full name
- `social_media_platform` (text) - Platform name (Twitter, LinkedIn, etc.)
- `username` (text) - Social media handle
- `profile_link` (text/url) - Link to social profile
- `share_link` (text/url) - Link to specific share/post
- `screenshot_upload` (repeater: url) - Array of screenshot URLs
- `share_date` (datetime) - When content was shared
- `is_featured` (boolean) - Featured social proof flag

**Use Cases:**
- Social proof sections
- Testimonial carousels
- Homepage credibility
- Client showcase

---

### 5. Case Study (`case_study`)

**Endpoint:** `/wp-json/wp/v2/case_study`

**Purpose:** Detailed project case studies and portfolio pieces

**Fields:**
- `project_title` (text) - Project name
- `client_name` (text) - Client organization
- `project_problem` (wysiwyg) - Problem description with rich text
- `project_solution` (wysiwyg) - Solution description with rich text
- `project_media` (repeater: url) - Array of project media URLs
- `outcome` (wysiwyg) - Project results and outcomes
- `project_date` (date) - Project completion date
- `is_featured` (boolean) - Featured case study flag
- `technologies_used` (textarea) - Tech stack and tools used

**Use Cases:**
- Portfolio pages
- Case study details
- Client work showcase
- Project galleries

---

### 6. Testimonial (`testimonial`)

**Endpoint:** `/wp-json/wp/v2/testimonial`

**Purpose:** Client testimonials and reviews

**Fields:**
- `reviewer_name` (text) - Client/reviewer name
- `review_content` (wysiwyg) - Review text with rich formatting
- `star_rating` (select) - Rating value
- `reviewer_media` (repeater: url) - Array of reviewer photos/media
- `service_type` (text) - Service category reviewed
- `date_submitted` (datetime) - When review was submitted
- `is_featured` (boolean) - Featured testimonial flag

**Use Cases:**
- Testimonial sections
- Service pages
- Homepage social proof
- Client feedback display

---

## Custom Content Types (CCT)

These are stored in dedicated database tables, not as WordPress posts.

### 1. Message (`message`)

**Endpoint:** `/wp-json/jet-cct/message`  
**Database Table:** `wp_jet_cct_message`

**Purpose:** Contact form submissions and user messages

**Fields:**
- `type` (text) - Message type/category
- `name` (text) - Sender's name
- `email_address` (text) - Sender's email
- `phone` (text) - Phone number
- `subject` (text) - Message subject
- `simple_message` (textarea) - Plain text message
- `detailed_message` (wysiwyg) - Rich text detailed message
- `media_content` (repeater: url) - Array of attached media URLs
- `chain_id` (text) - Message chain identifier

**Use Cases:**
- Contact forms
- Support requests
- Lead capture
- Client communication

---

### 2. Analytics Event (`analytics_event`)

**Endpoint:** `/wp-json/jet-cct/analytics_event`  
**Database Table:** `wp_jet_cct_analytics_event`

**Purpose:** Custom analytics and user interaction tracking

**Fields:**
- `event_type` (text) - Type of event tracked
- `ts_loaded` (text) - Page load timestamp
- `ts_submitted` (text) - Event submission timestamp
- `user_agent_signature` (text) - Browser/device signature
- `page_path` (text) - Current page path
- `referrer` (text) - Referring page URL
- `session_id` (text) - User session identifier
- `user_id` (text) - User identifier
- `ip_address` (text) - Client IP address
- `message_id` (text) - Related message ID
- `chain_id` (text) - Event chain identifier

**Use Cases:**
- Custom analytics
- User behavior tracking
- Performance monitoring
- Conversion tracking

### 3. Appointment (`appointment`) ✅ **IMPLEMENTED**

**Endpoint:** `/wp-json/jet-cct/appointment`  
**Database Table:** `wp_jet_cct_appointment`  
**Status:** 🟢 **Active** - WordPress CCT implemented and ready for frontend integration

**Purpose:** Store consultation appointments and meeting scheduling details

**Fields:**
- `message_id` (text) - Reference to related message in message table (required)
- `chain_id` (text) - Message chain identifier for related conversations
- `appointment_status` (text) - Current appointment status
  - Options: `scheduled`, `confirmed`, `rescheduled`, `cancelled`, `completed`, `no_show`
- `appointment_type` (text) - Type of consultation meeting
  - Options: `phone`, `video`, `in-person`
- `scheduled_date` (date) - Date of the appointment (YYYY-MM-DD format)
- `scheduled_time` (time) - Time of the appointment (24-hour format: HH:MM)
- `meeting_duration` (text) - Duration in minutes (30, 45, 60, 90)
- `timezone` (text) - Timezone for the appointment (e.g., 'EST', 'PST', 'UTC')
- `meeting_platform` (text) - Platform for video/remote meetings
  - Options: `zoom`, `google_meet`, `microsoft_teams`, `skype`, `phone`, `in_person`
- `meeting_link` (text/url) - Generated meeting room URL (for video calls)
- `meeting_passcode` (text) - Meeting room passcode/access code
- `location_address` (textarea) - Physical address for in-person meetings
- `location_details` (textarea) - Additional location instructions (suite number, parking, etc.)
- `agenda_topics` (wysiwyg) - Topics and questions to discuss during consultation
- `project_type` (text) - Related project type (if known)
- `preparation_notes` (wysiwyg) - Pre-meeting preparation notes and requirements
- `follow_up_actions` (wysiwyg) - Post-meeting follow-up items and next steps
- `internal_notes` (wysiwyg) - Private notes for internal use only
- `reminder_sent` (checkbox) - Flag indicating if reminder email was sent
- `confirmation_sent` (checkbox) - Flag indicating if confirmation was sent
- `created_date` (datetime) - When the appointment was originally created
- `last_modified` (datetime) - When the appointment was last updated
- `rescheduled_count` (number) - Number of times the appointment has been rescheduled
- `original_scheduled_date` (date) - Original appointment date (for rescheduled appointments)
- `original_scheduled_time` (text) - Original appointment time (for rescheduled appointments)

**Relationships:**
- **Many-to-One with Message:** Links to the `message` CCT via `message_id`
- **Chain Relationship:** Uses `chain_id` to link related messages and appointments

**Use Cases:**
- Consultation scheduling from contact forms
- Appointment management and tracking
- Meeting logistics coordination
- Calendar system integration
- Automated reminder systems
- Appointment history tracking
- Follow-up workflow management

**Status Workflow:**
1. `scheduled` - Initial appointment booking
2. `confirmed` - Client/admin confirmation received
3. `rescheduled` - Appointment moved to new date/time
4. `cancelled` - Appointment cancelled by either party
5. `completed` - Meeting successfully conducted
6. `no_show` - Client failed to attend scheduled meeting

**Location Handling:**
- **Phone:** No location needed, phone number stored in related message
- **Video:** Meeting platform and generated link stored
- **In-Person:** Full address and location details required

**Data Migration Notes:**
- Current appointment data stored in `message.simple_message` (CSV format) should be migrated to this dedicated table
- Existing appointment messages will maintain their `type: "appointment"` but appointment details move to this CCT
- `message_id` creates the relationship between the original form submission and appointment details

**API Example Response:**
```json
{
  "id": 123,
  "message_id": "456",
  "chain_id": "appointment_chain_789",
  "appointment_status": "confirmed",
  "appointment_type": "video",
  "scheduled_date": "2024-03-15",
  "scheduled_time": "14:30",
  "meeting_duration": 60,
  "timezone": "EST",
  "meeting_platform": "zoom",
  "meeting_link": "https://zoom.us/j/123456789",
  "meeting_passcode": "consulting123",
  "agenda_topics": "<p>Discuss website redesign project requirements</p>",
  "project_type": "website_redesign",
  "reminder_sent": true,
  "confirmation_sent": true,
  "created_date": "2024-03-10T10:30:00Z",
  "last_modified": "2024-03-12T16:45:00Z"
}
```

### 4. Invoice (`invoice`) ✅ **IMPLEMENTED**

**Endpoint:** `/wp-json/jet-cct/invoice`  
**Database Table:** `wp_jet_cct_invoice`  
**Status:** 🟢 **Active** - WordPress CCT implemented and ready for payment system integration

**Purpose:** Track deposit payments and project invoices with Stripe integration

**Fields:**
- `id` (auto-generated) - WordPress/JetEngine auto-generated unique identifier (serves as invoice_id)
- `stripe_payment_intent_id` (text) - Stripe transaction reference
- `message_id` (text) - Link to original form submission (required)
- `chain_id` (text) - Link to related appointments/quotes
- `customer_name` (text) - Customer name
- `customer_email` (text) - Customer email
- `deposit_amount` (text) - Deposit amount ($99/$250/$500)
- `currency` (text) - Currency (USD)
- `payment_status` (text) - Payment status
  - Options: `paid`, `pending`, `failed`, `refunded`
- `stripe_customer_id` (text) - Stripe customer reference
- `project_type` (text) - Type of project deposit
- `invoice_date` (datetime) - When invoice was created
- `payment_date` (datetime) - When payment was completed
- `notes` (wysiwyg) - Internal notes about the transaction
- `receipt_url` (text) - Stripe receipt URL
- `created_date` (datetime) - Record creation timestamp
- `last_modified` (datetime) - Last update timestamp

**Relationships:**
- **Many-to-One with Message:** Links to the `message` CCT via `message_id`
- **Chain Relationship:** Uses `chain_id` to link related messages, appointments, and invoices

**Use Cases:**
- Deposit payment tracking for web development projects
- Invoice generation and management
- Customer payment history
- Project financial tracking
- Stripe transaction reconciliation

**Payment Flow:**
1. `pending` - Invoice created, awaiting payment
2. `paid` - Payment successfully processed via Stripe
3. `failed` - Payment attempt failed
4. `refunded` - Payment refunded (rare for non-refundable deposits)

**Integration Notes:**
- Stripe handles all payment processing and customer data
- WordPress stores minimal invoice records for project tracking
- Webhook integration updates payment status from Stripe events
- Links to existing sales funnel data via message relationships
- `id` field serves as the unique invoice identifier (no separate `invoice_id` field needed)

**API Example Response:**
```json
{
  "id": 789,
  "stripe_payment_intent_id": "pi_1234567890abcdef",
  "message_id": "456",
  "chain_id": "payment_chain_123",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "deposit_amount": "250",
  "currency": "USD",
  "payment_status": "paid",
  "stripe_customer_id": "cus_1234567890",
  "project_type": "website_development",
  "invoice_date": "2024-03-15T10:00:00Z",
  "payment_date": "2024-03-15T10:05:32Z",
  "receipt_url": "https://pay.stripe.com/receipts/...",
  "created_date": "2024-03-15T10:00:00Z",
  "last_modified": "2024-03-15T10:05:35Z"
}
```

### 🐛 **Known Issues - Invoice CCT**

**Issue:** **Unsaved Fields in WordPress Admin**  
**Status:** 🔴 **Bug** - Needs attention for future development  
**Priority:** Medium

**Description:**  
The invoice CCT has several fields that are not saving properly when created through the WordPress admin interface. This affects manual invoice creation and testing but does not impact the frontend payment system which works correctly via API calls.

**Affected Operations:**
- Manual invoice creation through WordPress admin
- Invoice editing through WordPress admin dashboard
- Field validation and error handling in admin interface

**Current Workaround:**
- Frontend payment system bypasses this issue by creating invoices directly via API
- PaymentSuccess.js successfully creates invoice records through programmatic API calls
- All payment processing functionality remains fully operational

**Impact:**
- **No impact on production payment flow** - API-based invoice creation works correctly
- **Admin workflow affected** - Manual invoice management requires API-based solutions
- **Future development** - May need alternative admin interface for invoice management

**Technical Details:**
- Issue appears to be related to WordPress admin form handling of CCT fields
- API endpoints (`/wp-json/jet-cct/invoice`) function correctly for programmatic access
- Field definitions in JetEngine may need review and reconfiguration

**Next Steps:**
- Review JetEngine field configurations for invoice CCT
- Test field types and validation rules in WordPress admin
- Consider custom admin interface for invoice management if needed
- Document alternative API-based admin workflows

**Related Files:**
- `js/modules/PaymentSuccess.js` - Contains working invoice creation implementation
- `headless_api/updated-stripe-endpoint.php` - Stripe integration working correctly

---

## API Usage Notes

### Authentication
- Check WordPress REST API authentication requirements
- May require API keys or JWT tokens for write operations

### Common Query Parameters
- `per_page` - Number of items per request (default: 10)
- `page` - Page number for pagination
- `meta_key` & `meta_value` - Filter by custom fields
- `orderby` - Sort results (date, title, meta_value, etc.)
- `order` - Sort direction (asc, desc)

### Featured Content
Many content types have `is_featured` boolean fields for highlighting important content:
- Featured FAQs for homepage
- Featured case studies for portfolio
- Featured testimonials for credibility
- Featured social proof for landing pages

### Media Handling
Media fields are stored as URLs. Ensure proper validation and handling of:
- Image formats (JPG, PNG, WebP)
- File size limitations
- CDN integration if applicable

### Error Handling
Implement proper error handling for:
- 404 errors for missing content
- Rate limiting
- Network timeouts
- Malformed responses

---

## Development Tips

1. **Data Fetching:** Use async/await or Promise-based approaches for API calls
2. **Caching:** Implement client-side caching for frequently accessed content
3. **Pagination:** Handle pagination for large datasets
4. **Loading States:** Show loading indicators during API requests
5. **Error Boundaries:** Implement error boundaries for failed API calls
6. **Type Safety:** Define TypeScript interfaces for all content types