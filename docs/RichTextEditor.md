# RichTextEditor Class Documentation

A reusable, WordPress-compatible rich text editor built on TinyMCE with integrated REST API support for content management.

## Overview

The `RichTextEditor` class provides a comprehensive solution for creating rich text editors that seamlessly integrate with WordPress backends. It handles TinyMCE initialization, configuration, media uploads, and WordPress REST API operations while maintaining a clean, reusable interface.

## Features

- 🎨 **Rich Text Editing**: Full-featured TinyMCE editor with customizable toolbar
- 🔗 **WordPress Integration**: Built-in REST API support for posts and media
- 🔐 **Authentication**: Supports Basic Auth, JWT, and no-auth configurations
- 📁 **Media Management**: Direct image upload to WordPress media library
- 💾 **Content Operations**: Create, update, draft, and publish posts
- 🎛️ **Flexible Configuration**: Extensive customization options
- 🧹 **Memory Management**: Proper cleanup and destruction methods

## Installation & Setup

### Prerequisites

Ensure TinyMCE is installed in your project:

```bash
npm install tinymce
```

### Import the Module

```javascript
import RichTextEditor from './js/modules/RichTextEditor.js';
```

## Basic Usage

### Simple Editor

```javascript
// Create a basic editor
const editor = new RichTextEditor('#my-editor');
```

### Advanced Configuration

```javascript
const editor = new RichTextEditor('#advanced-editor', {
    // WordPress API Configuration
    apiUrl: 'https://your-site.com/wp-json/wp/v2',
    authType: 'basic',
    credentials: {
        username: 'your-username',
        password: 'your-app-password'
    },
    
    // Editor Appearance
    height: 500,
    toolbar: 'undo redo | bold italic | bullist numlist | link image',
    
    // Callbacks
    onInit: (editor) => console.log('Editor initialized'),
    onChange: (content) => console.log('Content changed:', content)
});
```

## Configuration Options

### WordPress API Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | `'https://your-wp.com/wp-json/wp/v2'` | WordPress REST API base URL |
| `authType` | string | `'basic'` | Authentication type: `'basic'`, `'jwt'`, or `'none'` |
| `credentials` | object | `{}` | Authentication credentials |
| `credentials.username` | string | `''` | Username for basic auth |
| `credentials.password` | string | `''` | Password or app password for basic auth |
| `credentials.token` | string | `''` | JWT token for JWT auth |

### Editor Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `height` | number | `400` | Editor height in pixels |
| `plugins` | string | `'link lists table image media code paste'` | TinyMCE plugins to load |
| `toolbar` | string | Full toolbar | Toolbar buttons configuration |
| `menubar` | boolean | `false` | Show/hide menu bar |
| `branding` | boolean | `false` | Show/hide TinyMCE branding |
| `resize` | boolean | `true` | Allow editor resizing |

### Content Validation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `valid_elements` | string | `'*[*]'` | HTML elements allowed in content |
| `extended_valid_elements` | string | `'iframe[*]'` | Additional valid elements |
| `entity_encoding` | string | `'raw'` | HTML entity encoding method |
| `block_formats` | string | Predefined | Available block formats |

### Callbacks

| Option | Type | Description |
|--------|------|-------------|
| `onInit` | function | Called when editor is initialized |
| `onChange` | function | Called when content changes |
| `onImageUpload` | function | Called after successful image upload |

## Public Methods

### Content Management

#### `getContent(format)`
Get the current editor content.

```javascript
const htmlContent = editor.getContent(); // Returns HTML
const textContent = editor.getContent('text'); // Returns plain text
```

**Parameters:**
- `format` (string, optional): Content format (`'html'` or `'text'`). Default: `'html'`

**Returns:** String - The editor content

#### `setContent(content, format)`
Set the editor content.

```javascript
editor.setContent('<h1>New Content</h1>');
editor.setContent('Plain text content', 'text');
```

**Parameters:**
- `content` (string): Content to set
- `format` (string, optional): Content format. Default: `'html'`

#### `insertContent(content)`
Insert content at the current cursor position.

```javascript
editor.insertContent('<strong>Bold text</strong>');
```

**Parameters:**
- `content` (string): HTML content to insert

### Editor Control

#### `focus()`
Focus the editor.

```javascript
editor.focus();
```

#### `disable()`
Set editor to read-only mode.

```javascript
editor.disable();
```

#### `enable()`
Enable editor for editing.

```javascript
editor.enable();
```

### WordPress Operations

#### `createPost(title, content, status, additionalData)`
Create a new WordPress post.

```javascript
const post = await editor.createPost(
    'My Blog Post',
    editor.getContent(),
    'publish',
    {
        excerpt: 'Post excerpt',
        categories: [1, 2],
        tags: [3, 4]
    }
);
```

**Parameters:**
- `title` (string): Post title
- `content` (string): Post content (HTML)
- `status` (string, optional): Post status (`'draft'`, `'publish'`, etc.). Default: `'draft'`
- `additionalData` (object, optional): Additional post data

**Returns:** Promise<Object> - WordPress post object

#### `updatePost(postId, updates)`
Update an existing WordPress post.

```javascript
const updatedPost = await editor.updatePost(123, {
    title: 'Updated Title',
    content: editor.getContent(),
    status: 'publish'
});
```

**Parameters:**
- `postId` (number): WordPress post ID
- `updates` (object): Fields to update

**Returns:** Promise<Object> - Updated WordPress post object

#### `saveAsDraft()`
Save current content as a draft post.

```javascript
const draftPost = await editor.saveAsDraft();
```

**Returns:** Promise<Object> - Draft post object

#### `publish()`
Publish current content as a new post.

```javascript
const publishedPost = await editor.publish();
```

**Returns:** Promise<Object> - Published post object

### Cleanup

#### `destroy()`
Destroy the editor instance and clean up resources.

```javascript
editor.destroy();
```

## Static Methods

#### `RichTextEditor.createEditor(selector, options)`
Alternative way to create an editor instance.

```javascript
const editor = RichTextEditor.createEditor('#editor', options);
```

#### `RichTextEditor.destroyAll()`
Destroy all TinyMCE editor instances.

```javascript
RichTextEditor.destroyAll();
```

## Complete Example

```javascript
import RichTextEditor from './js/modules/RichTextEditor.js';

class BlogPostEditor {
    constructor() {
        this.editor = null;
        this.currentPostId = null;
        this.initEditor();
        this.bindEvents();
    }

    async initEditor() {
        this.editor = new RichTextEditor('#post-content', {
            apiUrl: 'https://myblog.com/wp-json/wp/v2',
            authType: 'basic',
            credentials: {
                username: process.env.WP_USERNAME,
                password: process.env.WP_APP_PASSWORD
            },
            height: 600,
            onInit: (editor) => {
                console.log('Post editor ready');
                this.loadDraft();
            },
            onChange: (content) => {
                this.autoSave(content);
            },
            onImageUpload: (media, blobInfo) => {
                console.log('Image uploaded:', media.source_url);
            }
        });
    }

    bindEvents() {
        document.getElementById('save-draft')?.addEventListener('click', () => {
            this.saveDraft();
        });

        document.getElementById('publish')?.addEventListener('click', () => {
            this.publishPost();
        });
    }

    async saveDraft() {
        try {
            const title = document.getElementById('post-title').value;
            const content = this.editor.getContent();
            
            if (this.currentPostId) {
                await this.editor.updatePost(this.currentPostId, {
                    title,
                    content,
                    status: 'draft'
                });
            } else {
                const post = await this.editor.createPost(title, content, 'draft');
                this.currentPostId = post.id;
            }
            
            this.showNotification('Draft saved successfully');
        } catch (error) {
            this.showNotification('Failed to save draft', 'error');
        }
    }

    async publishPost() {
        try {
            const title = document.getElementById('post-title').value;
            const content = this.editor.getContent();
            
            if (this.currentPostId) {
                await this.editor.updatePost(this.currentPostId, {
                    title,
                    content,
                    status: 'publish'
                });
            } else {
                await this.editor.createPost(title, content, 'publish');
            }
            
            this.showNotification('Post published successfully');
        } catch (error) {
            this.showNotification('Failed to publish post', 'error');
        }
    }

    async loadDraft() {
        const draftId = new URLSearchParams(window.location.search).get('draft');
        if (draftId) {
            try {
                const response = await fetch(`https://myblog.com/wp-json/wp/v2/posts/${draftId}`);
                const post = await response.json();
                
                document.getElementById('post-title').value = post.title.rendered;
                this.editor.setContent(post.content.rendered);
                this.currentPostId = post.id;
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }

    autoSave(content) {
        // Implement auto-save logic
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            if (this.currentPostId) {
                this.editor.updatePost(this.currentPostId, { content });
            }
        }, 5000);
    }

    showNotification(message, type = 'success') {
        // Implement notification display
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    destroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BlogPostEditor();
});
```

## Error Handling

The RichTextEditor class throws errors for various failure scenarios:

```javascript
try {
    const editor = new RichTextEditor('#editor', options);
    const post = await editor.createPost('Title', 'Content');
} catch (error) {
    if (error.message.includes('Upload failed')) {
        // Handle image upload errors
    } else if (error.message.includes('Failed to create post')) {
        // Handle post creation errors
    } else {
        // Handle other errors
    }
}
```

## Security Considerations

1. **Authentication**: Always use app passwords instead of regular passwords for Basic Auth
2. **HTTPS**: Ensure your WordPress site uses HTTPS for API calls
3. **Validation**: The editor allows all HTML by default for WordPress compatibility
4. **Sanitization**: WordPress handles content sanitization on the backend

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Editor not initializing**: Check TinyMCE imports and base_url configuration
2. **Image upload failing**: Verify WordPress media endpoint and authentication
3. **Post creation failing**: Check API URL, credentials, and WordPress permissions
4. **CORS errors**: Configure WordPress CORS settings for cross-origin requests

### Debug Mode

Enable debug logging by setting:

```javascript
const editor = new RichTextEditor('#editor', {
    // ... other options
    setup: (editor) => {
        editor.on('init', () => console.log('Editor initialized'));
        editor.on('change', () => console.log('Content changed'));
    }
});
```

## License

This module follows your project's license terms.