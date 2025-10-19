# WordPress Media Upload API Fix

## Issue Summary

The WordPress REST API endpoint `/wp-json/cmm/v2/media/upload` is rejecting file uploads with the error:

```
400 Bad Request: Invalid JSON body passed
```

**Root Cause**: The API endpoint validation is rejecting `post_id = 0`, which is used for standalone media uploads (files not attached to a specific post). The frontend correctly sends `post_id = 0` according to the documentation, but the WordPress backend incorrectly rejects it.

---

## The Problem

### Issue #1: Validation Rejects post_id = 0
**Location**: Line ~785 in the REST API registration

The validation callback requires `post_id > 0`, which incorrectly rejects standalone uploads:

```php
'validate_callback' => function($param) {
    return is_numeric($param) && $param > 0;  // ❌ Rejects 0
}
```

### Issue #2: Permission Check Fails for post_id = 0
**Location**: Lines ~656-698 in `cmm_rest_media_upload_permissions()`

The permission callback tries to verify `edit_post` permission for `post_id = 0`, which fails because post 0 doesn't exist:

```php
// Must be able to edit parent post
if (!current_user_can('edit_post', $post_id)) {  // ❌ Fails when post_id = 0
    return new WP_Error(
        'rest_forbidden',
        'You do not have permission to edit this post.',
        ['status' => 403]
    );
}
```

---

## The Solution

Two small changes are needed to support standalone uploads with `post_id = 0`.

### Fix #1: Update Validation to Allow post_id = 0

**File**: `include/media-upload-integration.php` (or wherever your REST endpoint is registered)
**Location**: Around line 785 in the `rest_api_init` hook

**Find this code:**
```php
'post_id' => [
    'required' => true,
    'type' => 'integer',
    'description' => 'Parent post ID to attach media to',
    'validate_callback' => function($param) {
        return is_numeric($param) && $param > 0;  // ❌ OLD
    }
],
```

**Change to:**
```php
'post_id' => [
    'required' => true,
    'type' => 'integer',
    'description' => 'Parent post ID to attach media to (use 0 for standalone uploads)',
    'validate_callback' => function($param) {
        return is_numeric($param) && $param >= 0;  // ✅ NEW - Allow 0
    }
],
```

**What changed**: `$param > 0` → `$param >= 0`

---

### Fix #2: Update Permission Check to Allow Standalone Uploads

**File**: `include/media-upload-integration.php`
**Location**: Around lines 656-698 in the `cmm_rest_media_upload_permissions()` function

**Find this code:**
```php
function cmm_rest_media_upload_permissions($request) {
    $post_id = $request->get_param('post_id');
    $post_type = $request->get_param('post_type');

    // Must be authenticated
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_forbidden',
            'You must be logged in to upload media.',
            ['status' => 401]
        );
    }

    // Must have upload permission
    if (!current_user_can('upload_files')) {
        return new WP_Error(
            'rest_forbidden',
            'You do not have permission to upload files.',
            ['status' => 403]
        );
    }

    // Must be able to edit parent post
    if (!current_user_can('edit_post', $post_id)) {
        return new WP_Error(
            'rest_forbidden',
            'You do not have permission to edit this post.',
            ['status' => 403]
        );
    }

    // Verify post exists and is correct type
    $post = get_post($post_id);
    if (!$post || $post->post_type !== $post_type) {
        return new WP_Error(
            'rest_invalid_param',
            'Invalid post ID or post type mismatch.',
            ['status' => 400]
        );
    }

    return true;
}
```

**Change to:**
```php
function cmm_rest_media_upload_permissions($request) {
    $post_id = $request->get_param('post_id');
    $post_type = $request->get_param('post_type');

    // Must be authenticated
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_forbidden',
            'You must be logged in to upload media.',
            ['status' => 401]
        );
    }

    // Must have upload permission
    if (!current_user_can('upload_files')) {
        return new WP_Error(
            'rest_forbidden',
            'You do not have permission to upload files.',
            ['status' => 403]
        );
    }

    // ✅ NEW: For standalone uploads (post_id = 0), only upload_files permission is required
    if ($post_id == 0) {
        return true;  // Already verified upload_files permission above
    }

    // For attached uploads, verify post-specific permissions
    if (!current_user_can('edit_post', $post_id)) {
        return new WP_Error(
            'rest_forbidden',
            'You do not have permission to edit this post.',
            ['status' => 403]
        );
    }

    // Verify post exists and is correct type
    $post = get_post($post_id);
    if (!$post || $post->post_type !== $post_type) {
        return new WP_Error(
            'rest_invalid_param',
            'Invalid post ID or post type mismatch.',
            ['status' => 400]
        );
    }

    return true;
}
```

**What changed**: Added early return for `post_id == 0` to skip post-specific permission checks.

---

## Implementation Steps

1. **Locate the file**: Find `include/media-upload-integration.php` in your WordPress theme directory
2. **Make Fix #1**: Update validation callback on line ~785
3. **Make Fix #2**: Update permission function on lines ~656-698
4. **Save the file**
5. **Test the upload**: Try uploading files from your Vite frontend

---

## Testing Checklist

After applying the fixes, test these scenarios:

- [ ] **Standalone upload (post_id = 0)**: Upload files without attaching to a post
  - Frontend sends: `post_id: 0`, `post_type: 'attachment'`, `meta_field: 'media_content'`
  - Expected: Files upload successfully, no "Invalid JSON body" error

- [ ] **Attached upload (post_id > 0)**: Upload files attached to an existing post
  - Frontend sends: `post_id: 123`, `post_type: 'post'`, `meta_field: 'custom_field'`
  - Expected: Files upload and attach to post 123

- [ ] **Permission check**: Upload without being logged in
  - Expected: 401 Unauthorized error

- [ ] **Invalid post**: Upload with post_id = 999999 (non-existent)
  - Expected: 400 Bad Request with proper error message

---

## Why This Fix Works

### Frontend Behavior (Already Correct)
The Vite frontend (`MediaUploadManager.js`) correctly sends:
```javascript
formData.append('post_id', '0');           // Standalone upload
formData.append('post_type', 'attachment');
formData.append('meta_field', 'media_content');
formData.append('return_format', 'ids');
```

This matches the WordPress Media Upload Integration documentation which specifies that `post_id = 0` is valid for standalone uploads.

### Backend Behavior (Fixed)
The WordPress REST API now:
1. ✅ Accepts `post_id >= 0` instead of requiring `> 0`
2. ✅ Skips post-specific permission checks when `post_id = 0`
3. ✅ Still validates all other required fields
4. ✅ Still requires authentication and `upload_files` capability

---

## Related Documentation

- **Frontend Integration**: `docs/FRONTEND_MEDIA_UPLOAD_INTEGRATION.md`
- **WordPress Component**: `docs/REUSABLE_MEDIA_UPLOAD_COMPONENT_V2.md`
- **API Specification**: Lines 80-224 in `FRONTEND_MEDIA_UPLOAD_INTEGRATION.md`

---

## Commit Message Suggestion

```
Fix WordPress media upload API to support standalone uploads

- Allow post_id = 0 for standalone media uploads
- Update validation to accept post_id >= 0 instead of > 0
- Skip post-specific permission checks when post_id = 0
- Fixes "Invalid JSON body passed" error on frontend uploads

The frontend was correctly sending post_id = 0 per the documentation,
but the backend was incorrectly rejecting it. This fix aligns the
backend validation with the documented API specification.
```

---

**Date**: 2025-10-15
**Frontend Project**: cmm_dot_com_frontend_v11
**WordPress Theme**: christin_morton_classic_2025
**API Version**: v2
