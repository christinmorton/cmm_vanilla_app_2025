# Frontend Media Upload Integration Guide

## Overview

This document provides the API specification for integrating file uploads from the Vite frontend application into the WordPress media upload system. This guide is designed to be read by developers (or AI assistants) working in the frontend project to implement media upload functionality that integrates with the polymorphic message system.

**Important**: This is a reference document that explains the WordPress API contract. Frontend implementation code should be written in the Vite project, not here.

---

## Architecture Summary

### Two Upload Workflows

#### 1. Standalone Media Upload
Upload files independently without associating them to any message or post.

**Use Cases**:
- Profile pictures
- General asset uploads
- Media library management
- Testing/development

#### 2. Message-Associated Media Upload
Upload files and link them to a specific message in the polymorphic message system.

**Use Cases**:
- Quote requests with design files
- Consultation requests with project documents
- Support tickets with screenshots
- Any message that needs file attachments

---

## REST API Endpoint

### Endpoint URL
```
POST /wp-json/cmm/v2/media/upload
```

### Base URLs
- **Development**: `http://christinmorton.local/wp-json/cmm/v2/media/upload`
- **Production**: `https://cms.christinmorton.com/wp-json/cmm/v2/media/upload`

---

## Authentication

### Required Headers
```javascript
{
  'X-WP-Nonce': wpNonce  // WordPress REST API nonce
}
```

### Authentication Methods

#### Option 1: Cookie Authentication (Browser-based)
WordPress automatically includes authentication cookies when requests come from the same domain.

```javascript
// Just include the nonce header
headers: {
  'X-WP-Nonce': wpApiSettings.nonce
}
```

#### Option 2: Application Password (Recommended for Vite)
Generate an application password in WordPress user profile, then use Basic Auth.

```javascript
const credentials = btoa(`${username}:${appPassword}`);
headers: {
  'Authorization': `Basic ${credentials}`
}
```

---

## Workflow 1: Standalone Media Upload

### Purpose
Upload files to WordPress Media Library without associating them to any post or message.

### Request Format

#### Multipart Form Data
```javascript
const formData = new FormData();

// Required: Files to upload
for (let file of fileInput.files) {
  formData.append('files[]', file);
}

// Required: Must specify a post_id (use 0 for unattached)
formData.append('post_id', 0);  // 0 = standalone, no parent

// Required: Post type (for permissions check)
formData.append('post_type', 'attachment');

// Required: Meta field name (can be 'standalone' for unattached files)
formData.append('meta_field', 'standalone');

// Optional: Return format
formData.append('return_format', 'objects');  // 'ids' | 'urls' | 'objects'

// Optional: Context tag for tracking
formData.append('context_tag', 'general_upload');
```

### Example Request
```javascript
async function uploadStandaloneFiles(files) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files[]', file);
  });

  formData.append('post_id', 0);  // Standalone
  formData.append('post_type', 'attachment');
  formData.append('meta_field', 'standalone');
  formData.append('return_format', 'objects');
  formData.append('context_tag', 'profile_picture');

  const response = await fetch('/wp-json/cmm/v2/media/upload', {
    method: 'POST',
    headers: {
      'X-WP-Nonce': wpApiSettings.nonce
    },
    body: formData
  });

  return await response.json();
}
```

### Success Response
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "attachments": [
      {
        "id": 501,
        "url": "https://cms.christinmorton.com/wp-content/uploads/2025/01/design-mockup.jpg",
        "filename": "design-mockup.jpg",
        "type": "image/jpeg",
        "size": 245600,
        "width": 1920,
        "height": 1080
      }
    ],
    "field_value": [501],
    "stats": {
      "uploaded_count": 1,
      "failed_count": 0,
      "total_size": 245600,
      "processing_time": 0.8
    },
    "meta_updated": false
  }
}
```

---

## Workflow 2: Message-Associated Media Upload

### Purpose
Upload files and automatically associate them with a message in the polymorphic message system by updating the message's `media_content` field.

### Important Concept: Two-Step Process

#### Current WordPress Integration
The WordPress media upload API can automatically update a post's meta field with uploaded attachment IDs.

**For Messages**: Since messages are stored in a JetEngine Custom Content Type (CCT), not WordPress posts, the API cannot directly update CCT fields. However, it can still handle the upload and return the attachment IDs for your frontend to store.

#### Recommended Approach

**Option A: Frontend Updates Message (Simpler)**
1. Upload files to media API
2. Get back attachment IDs
3. Frontend updates the message record via `/wp-json/jet-cct/message` endpoint

**Option B: Create Placeholder Post (Advanced)**
1. Create a temporary WordPress post as an upload container
2. Upload files associated with that post
3. Store the post ID in the message record
4. Query attachments later via post parent relationship

### Request Format (Option A - Recommended)

```javascript
const formData = new FormData();

// Required: Files to upload
for (let file of fileInput.files) {
  formData.append('files[]', file);
}

// Required: Use 0 for post_id since we're not updating a post
formData.append('post_id', 0);

// Required: Post type
formData.append('post_type', 'attachment');

// Required: Meta field (use 'media_content' for consistency)
formData.append('meta_field', 'media_content');

// Required: Return format (use 'ids' for CCT storage)
formData.append('return_format', 'ids');

// Optional: Context tag for tracking
formData.append('context_tag', 'quote_request');

// Optional: Link attachments with post_parent (helpful for queries)
formData.append('link_as_parent', 'false');  // Not using post parent linking
```

### Complete Integration Workflow

```javascript
/**
 * Upload files for a quote request message
 *
 * This demonstrates the complete workflow:
 * 1. Upload files to media API
 * 2. Get attachment IDs
 * 3. Submit message with attachment IDs
 */
async function submitQuoteWithFiles(quoteData, files) {
  let attachmentIds = [];

  // Step 1: Upload files if provided
  if (files && files.length > 0) {
    const uploadResult = await uploadFilesForMessage(files, 'quote_request');

    if (!uploadResult.success) {
      throw new Error('File upload failed: ' + uploadResult.message);
    }

    attachmentIds = uploadResult.data.attachments; // Array of IDs
  }

  // Step 2: Create message with attachment IDs
  const messageData = {
    type: 'quote',
    name: quoteData.name,
    email_address: quoteData.email,
    subject: `Quote Request - ${quoteData.projectType}`,
    detailed_message: quoteData.projectDetails,
    media_content: attachmentIds  // Store attachment IDs in message
  };

  // Step 3: Submit message to CCT
  const messageResponse = await fetch('/wp-json/jet-cct/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': wpApiSettings.nonce
    },
    body: JSON.stringify(messageData)
  });

  return await messageResponse.json();
}

/**
 * Upload files and get attachment IDs
 */
async function uploadFilesForMessage(files, contextTag = 'message_attachment') {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files[]', file);
  });

  formData.append('post_id', 0);
  formData.append('post_type', 'attachment');
  formData.append('meta_field', 'media_content');
  formData.append('return_format', 'ids');  // Return IDs for CCT storage
  formData.append('context_tag', contextTag);

  const response = await fetch('/wp-json/cmm/v2/media/upload', {
    method: 'POST',
    headers: {
      'X-WP-Nonce': wpApiSettings.nonce
    },
    body: formData
  });

  return await response.json();
}
```

### Alternative: Update Existing Message

If you need to add files to an existing message:

```javascript
/**
 * Upload files and add them to an existing message
 */
async function addFilesToExistingMessage(messageId, files) {
  // Step 1: Upload files
  const uploadResult = await uploadFilesForMessage(files, 'message_update');

  if (!uploadResult.success) {
    throw new Error('Upload failed');
  }

  const newAttachmentIds = uploadResult.data.attachments;

  // Step 2: Get existing message
  const messageResponse = await fetch(`/wp-json/jet-cct/message/${messageId}`);
  const message = await messageResponse.json();

  // Step 3: Merge attachment IDs
  const existingIds = message.media_content || [];
  const updatedIds = [...existingIds, ...newAttachmentIds];

  // Step 4: Update message
  const updateResponse = await fetch(`/wp-json/jet-cct/message/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': wpApiSettings.nonce
    },
    body: JSON.stringify({
      media_content: updatedIds
    })
  });

  return await updateResponse.json();
}
```

---

## Response Format

### Success Response Structure

```typescript
interface UploadSuccessResponse {
  success: true;
  message: string;
  data: {
    attachments: Array<number | string | AttachmentObject>;
    field_value: number[] | string[];
    stats: {
      uploaded_count: number;
      failed_count: number;
      total_size: number;
      processing_time: number;
    };
    meta_updated: boolean;
  };
}
```

### Return Formats

#### IDs (Recommended for CCT storage)
```javascript
formData.append('return_format', 'ids');

// Response
{
  "attachments": [501, 502, 503]
}
```

#### URLs (For immediate display)
```javascript
formData.append('return_format', 'urls');

// Response
{
  "attachments": [
    "https://cms.christinmorton.com/wp-content/uploads/2025/01/file1.jpg",
    "https://cms.christinmorton.com/wp-content/uploads/2025/01/file2.jpg"
  ]
}
```

#### Objects (For rich metadata)
```javascript
formData.append('return_format', 'objects');

// Response
{
  "attachments": [
    {
      "id": 501,
      "url": "https://cms.christinmorton.com/wp-content/uploads/2025/01/file1.jpg",
      "filename": "file1.jpg",
      "type": "image/jpeg",
      "size": 245600,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

### Error Response Structure

```typescript
interface UploadErrorResponse {
  code: string;
  message: string;
  data: {
    status: number;
    errors?: Array<{
      error_code: string;
      message: string;
      file_index?: number;
      file_name?: string;
    }>;
  };
}
```

### Common Error Responses

#### No Files Uploaded
```json
{
  "code": "rest_no_files",
  "message": "No files were uploaded.",
  "data": {
    "status": 400
  }
}
```

#### Unauthorized
```json
{
  "code": "rest_forbidden",
  "message": "You must be logged in to upload media.",
  "data": {
    "status": 401
  }
}
```

#### Invalid File Type
```json
{
  "code": "rest_upload_failed",
  "message": "Upload failed: File type not allowed",
  "data": {
    "status": 500,
    "errors": [
      {
        "error_code": "INVALID_FILE_TYPE",
        "message": "File type not allowed",
        "file_index": 0,
        "file_name": "document.exe"
      }
    ]
  }
}
```

#### File Too Large
```json
{
  "code": "rest_upload_failed",
  "message": "Upload failed: File exceeds maximum size",
  "data": {
    "status": 500,
    "errors": [
      {
        "error_code": "FILE_TOO_LARGE",
        "message": "File exceeds maximum size of 10MB",
        "file_index": 0,
        "file_name": "large-video.mp4"
      }
    ]
  }
}
```

---

## File Validation Rules

### Allowed File Types

The WordPress media upload component supports different file types depending on the upload context:

#### General Upload Context (Default)
- **Images**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`, `image/bmp`, `image/tiff`, `image/svg+xml`
- **Videos**: `video/mp4`, `video/avi`, `video/mov`, `video/wmv`, `video/quicktime`
- **Documents**: `application/pdf`

#### Document Upload Context
For forms that need to accept business documents (quotes, project briefs, etc.), use the document uploader which supports:

> **Note on Google Workspace**: Files exported from Google Docs, Sheets, and Slides are automatically converted to Microsoft Office formats (.docx, .xlsx, .pptx) which are fully supported below.

- **PDF**: `application/pdf`
- **Word Documents**:
  - `.doc` - `application/msword`
  - `.docx` - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Excel Spreadsheets**:
  - `.xls` - `application/vnd.ms-excel`
  - `.xlsx` - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **PowerPoint Presentations**:
  - `.ppt` - `application/vnd.ms-powerpoint`
  - `.pptx` - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Text Files**:
  - `.txt` - `text/plain`
  - `.rtf` - `text/rtf` or `application/rtf`
  - `.csv` - `text/csv` (spreadsheet data)
- **OpenOffice/LibreOffice**:
  - `.odt` - `application/vnd.oasis.opendocument.text` (Writer - word processing)
  - `.ods` - `application/vnd.oasis.opendocument.spreadsheet` (Calc - spreadsheets)
  - `.odp` - `application/vnd.oasis.opendocument.presentation` (Impress - presentations)

**Note**: The document uploader supports larger file sizes (up to 50MB per file) to accommodate business documents.

#### Quick Reference: Office Document MIME Types

For easy copy-paste into your Vite frontend file input accept attribute:

```html
<!-- HTML accept attribute for document uploads -->
<input
  type="file"
  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.odt,.ods,.odp,
          application/pdf,
          application/msword,
          application/vnd.openxmlformats-officedocument.wordprocessingml.document,
          application/vnd.ms-excel,
          application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
          application/vnd.ms-powerpoint,
          application/vnd.openxmlformats-officedocument.presentationml.presentation,
          text/plain,
          text/rtf,
          application/rtf,
          text/csv,
          application/vnd.oasis.opendocument.text,
          application/vnd.oasis.opendocument.spreadsheet,
          application/vnd.oasis.opendocument.presentation"
  multiple
/>
```

**Complete Office Document Support Matrix**:

| Document Type | Extension | MIME Type | Max Size (Document Context) |
|---------------|-----------|-----------|------------------------------|
| PDF | `.pdf` | `application/pdf` | 50 MB |
| Word (Legacy) | `.doc` | `application/msword` | 50 MB |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 50 MB |
| Excel (Legacy) | `.xls` | `application/vnd.ms-excel` | 50 MB |
| Excel | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 50 MB |
| PowerPoint (Legacy) | `.ppt` | `application/vnd.ms-powerpoint` | 50 MB |
| PowerPoint | `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 50 MB |
| Plain Text | `.txt` | `text/plain` | 50 MB |
| Rich Text | `.rtf` | `text/rtf` or `application/rtf` | 50 MB |
| CSV | `.csv` | `text/csv` | 50 MB |
| Writer (OpenOffice/LibreOffice) | `.odt` | `application/vnd.oasis.opendocument.text` | 50 MB |
| Calc (OpenOffice/LibreOffice) | `.ods` | `application/vnd.oasis.opendocument.spreadsheet` | 50 MB |
| Impress (OpenOffice/LibreOffice) | `.odp` | `application/vnd.oasis.opendocument.presentation` | 50 MB |

### File Size Limits

#### General Upload Context
- **Per File**: 10 MB
- **Total Upload**: 20 MB
- **Max Files**: 3 files per upload

#### Document Upload Context
- **Per File**: 50 MB (for large documents)
- **Total Upload**: 100 MB
- **Max Files**: 5 files per upload

#### Gallery Upload Context
- **Per File**: 5 MB (images only)
- **Total Upload**: 10 MB
- **Max Files**: 3 files per upload

### Client-Side Validation (Recommended)
Validate files on the frontend before uploading to provide immediate feedback:

```javascript
/**
 * Validate files for general uploads (images, videos, PDFs)
 */
function validateGeneralFiles(files) {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 3;
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/quicktime',
    // Documents
    'application/pdf'
  ];

  return validateFiles(files, maxFileSize, maxFiles, allowedTypes);
}

/**
 * Validate files for document uploads (Word, Excel, PowerPoint, etc.)
 */
function validateDocumentFiles(files) {
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 5;
  const allowedTypes = [
    // PDF
    'application/pdf',
    // Word
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain',
    'text/rtf',
    'application/rtf',
    'text/csv',
    // OpenOffice/LibreOffice
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ];

  return validateFiles(files, maxFileSize, maxFiles, allowedTypes);
}

/**
 * Core validation function
 */
function validateFiles(files, maxFileSize, maxFiles, allowedTypes) {
  const errors = [];

  // Check file count
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  // Check each file
  files.forEach((file, index) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}": Invalid file type (${file.type})`);
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      errors.push(`File "${file.name}": Exceeds ${maxSizeMB}MB limit`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

---

## Integration with Polymorphic Message System

### Message Types That Support Files

Based on `POLYMORPHIC_MESSAGE_SYSTEM.md`, these message types should support file uploads:

#### Quote Requests (`type: 'quote'`)
**Use Case**: Client uploads design files, brand assets, project documents

```javascript
{
  type: 'quote',
  name: 'Client Name',
  email_address: 'client@example.com',
  subject: 'Quote Request - E-commerce Website',
  detailed_message: '<structured HTML with project requirements>',
  media_content: [501, 502, 503]  // Attachment IDs from media upload API
}
```

#### Consultation Requests (`type: 'consultation'`)
**Use Case**: Client uploads project briefs, reference materials

```javascript
{
  type: 'consultation',
  name: 'Client Name',
  email_address: 'client@example.com',
  subject: 'Consultation Request - Mobile App',
  detailed_message: '<structured HTML with project details>',
  media_content: [504, 505]
}
```

#### Support Messages (Future)
**Use Case**: Screenshots, error logs, debug information

```javascript
{
  type: 'support',
  name: 'Client Name',
  email_address: 'client@example.com',
  subject: 'Issue with Payment Processing',
  simple_message: 'Description of the issue...',
  media_content: [506]  // Screenshot
}
```

### Recommended Frontend Module Structure

```javascript
// MediaUploadManager.js - New module for handling uploads
class MediaUploadManager {
  async uploadFiles(files, contextTag) {
    // Handles file upload to /wp-json/cmm/v2/media/upload
    // Returns attachment IDs
  }

  validateFiles(files) {
    // Client-side validation
  }

  getUploadProgress() {
    // Track upload progress for UI
  }
}

// Update SalesFunnelForm.js to use MediaUploadManager
class SalesFunnelForm {
  constructor() {
    this.mediaManager = new MediaUploadManager();
  }

  async handleFormSubmission(formType, formElement, options = {}) {
    let attachmentIds = [];

    // Check if form has files
    const fileInput = formElement.querySelector('input[type="file"]');
    if (fileInput && fileInput.files.length > 0) {
      // Upload files first
      const uploadResult = await this.mediaManager.uploadFiles(
        fileInput.files,
        `${formType}_attachment`
      );

      if (uploadResult.success) {
        attachmentIds = uploadResult.data.attachments;
      }
    }

    // Create message with attachment IDs
    const messageData = await this.createMessageSubmission(
      formType,
      formData,
      options.userMessage
    );

    // Add attachments to message
    if (attachmentIds.length > 0) {
      messageData.media_content = attachmentIds;
    }

    // Submit message
    return await this.submitMessage(messageData);
  }
}
```

---

## UI/UX Recommendations

### Upload Progress Feedback

```javascript
async function uploadWithProgress(files) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  files.forEach(file => formData.append('files[]', file));
  formData.append('post_id', 0);
  formData.append('post_type', 'attachment');
  formData.append('meta_field', 'media_content');
  formData.append('return_format', 'ids');

  return new Promise((resolve, reject) => {
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        // Update progress bar
        updateProgressBar(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.open('POST', '/wp-json/cmm/v2/media/upload');
    xhr.setRequestHeader('X-WP-Nonce', wpApiSettings.nonce);
    xhr.send(formData);
  });
}
```

### File Preview Before Upload

```javascript
function previewFiles(files) {
  const previews = [];

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({
          name: file.name,
          size: formatFileSize(file.size),
          preview: e.target.result,
          type: 'image'
        });
      };
      reader.readAsDataURL(file);
    } else {
      previews.push({
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileIcon(file.type)
      });
    }
  });

  return previews;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
```

---

## Error Handling Best Practices

### Graceful Degradation

```javascript
async function submitFormWithOptionalFiles(formType, formData, files) {
  let attachmentIds = [];
  let uploadErrors = [];

  // Try to upload files, but don't fail form submission if upload fails
  if (files && files.length > 0) {
    try {
      const uploadResult = await uploadFilesForMessage(files, formType);

      if (uploadResult.success) {
        attachmentIds = uploadResult.data.attachments;
      } else {
        uploadErrors = uploadResult.data.errors || [];
        // Log error but continue with form submission
        console.error('File upload failed:', uploadErrors);
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Continue with form submission without files
    }
  }

  // Submit message (with or without attachments)
  const messageData = {
    type: formType,
    ...formData,
    media_content: attachmentIds
  };

  const result = await submitMessage(messageData);

  // Notify user if files failed but message succeeded
  if (result.success && uploadErrors.length > 0) {
    showWarning('Your message was submitted, but some files failed to upload.');
  }

  return result;
}
```

### Retry Logic

```javascript
async function uploadWithRetry(files, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFilesForMessage(files);
    } catch (error) {
      lastError = error;

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Security Considerations

### Client-Side Validation
- Validate file types and sizes before upload
- Sanitize file names if displaying them
- Limit number of files per upload

### Server-Side Protection
The WordPress API handles:
- Authentication and authorization
- File type validation (whitelist)
- File size limits
- Malware scanning (via WordPress)
- Rate limiting

### CORS Configuration
If Vite app is on a different domain, ensure WordPress has proper CORS headers configured.

#### Troubleshooting CORS Issues

**Common CORS Error Symptoms**:

- Browser console shows: `Access to fetch at 'https://cms.christinmorton.com/wp-json/...' from origin 'http://localhost:5173' has been blocked by CORS policy`
- Network tab shows the request with status `(failed)` or `CORS error`
- Preflight OPTIONS request fails

**How to Verify CORS is Working**:

1. **Check Browser Console**:

   ```javascript
   // Test CORS from browser console on your Vite app
   fetch('https://cms.christinmorton.com/wp-json/cmm/v2/media/upload', {
     method: 'OPTIONS'
   })
   .then(response => console.log('CORS OK:', response.headers.get('Access-Control-Allow-Origin')))
   .catch(error => console.error('CORS Error:', error));
   ```

2. **Inspect Response Headers**:

   Open Network tab in DevTools and check the response headers for:

   ```text
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce
   Access-Control-Allow-Credentials: true
   ```

3. **Required Headers for Media Upload**:

   Your nginx/server must allow:
   - `X-WP-Nonce` header (for WordPress authentication)
   - `Authorization` header (if using Basic Auth)
   - `Content-Type` header (multipart/form-data for file uploads)

**Server Configuration Notes**:

- **Development**: Typically `http://localhost:5173` or `http://localhost:3000` (Vite default)
- **Production**: Your actual Vite app domain
- CORS configuration is handled at the nginx/server level, not in this theme
- Contact your server administrator if CORS issues persist

**Quick Test**:
If you can successfully call other WordPress REST API endpoints (like `/wp-json/wp/v2/posts`) from your Vite app, then CORS is already configured correctly and media uploads should work.

---

## Testing Checklist

### Basic Upload Tests
- [ ] Upload single image file
- [ ] Upload multiple image files (2-5)
- [ ] Upload PDF document
- [ ] Upload video file
- [ ] Verify attachment IDs returned correctly

### Message Integration Tests
- [ ] Submit quote request with files
- [ ] Submit consultation request with files
- [ ] Verify `media_content` field populated in message CCT
- [ ] Add files to existing message
- [ ] Submit message without files (should work)

### Error Handling Tests
- [ ] Upload invalid file type (expect error)
- [ ] Upload file exceeding size limit (expect error)
- [ ] Upload without authentication (expect 401)
- [ ] Upload too many files (expect error)
- [ ] Handle network failure gracefully

### UI/UX Tests
- [ ] File preview displays correctly
- [ ] Upload progress shows accurately
- [ ] Error messages display clearly
- [ ] Success confirmation shown
- [ ] Form remains usable during upload

---

## Quick Reference

### Minimal Working Example

```javascript
// Upload files and submit message
async function quickUploadAndSubmit(files, messageData) {
  // Step 1: Upload files
  const formData = new FormData();
  files.forEach(f => formData.append('files[]', f));
  formData.append('post_id', 0);
  formData.append('post_type', 'attachment');
  formData.append('meta_field', 'media_content');
  formData.append('return_format', 'ids');

  const uploadRes = await fetch('/wp-json/cmm/v2/media/upload', {
    method: 'POST',
    headers: { 'X-WP-Nonce': wpApiSettings.nonce },
    body: formData
  });

  const uploadData = await uploadRes.json();

  // Step 2: Submit message with attachment IDs
  if (uploadData.success) {
    messageData.media_content = uploadData.data.attachments;
  }

  const messageRes = await fetch('/wp-json/jet-cct/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': wpApiSettings.nonce
    },
    body: JSON.stringify(messageData)
  });

  return await messageRes.json();
}
```

---

## Summary

### Key Points

1. **Two Workflows**: Standalone uploads and message-associated uploads
2. **REST API**: `/wp-json/cmm/v2/media/upload`
3. **Two-Step Process**: Upload files first, then submit/update message with IDs
4. **Return Format**: Use `'ids'` for CCT storage
5. **Error Handling**: Implement graceful degradation for file uploads
6. **Validation**: Client-side and server-side validation

### Implementation Steps for Vite Project

1. Create `MediaUploadManager.js` module
2. Add file upload method that calls `/wp-json/cmm/v2/media/upload`
3. Update `SalesFunnelForm.js` to handle file uploads before message submission
4. Add UI components for file selection, preview, and progress
5. Implement error handling and validation
6. Test with quote and consultation forms

### Related Documentation

- `POLYMORPHIC_MESSAGE_SYSTEM.md` - Message system architecture
- `REUSABLE_MEDIA_UPLOAD_COMPONENT_V2.md` - Detailed WordPress API documentation
- `media_upload_namespace_migration.md` - Recent namespace changes

---

**Document Version**: 1.0
**Last Updated**: 2025-10-12
**WordPress Theme**: christin_morton_classic_2025
**API Namespace**: `cmm/v2`
