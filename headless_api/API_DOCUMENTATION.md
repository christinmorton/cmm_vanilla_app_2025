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