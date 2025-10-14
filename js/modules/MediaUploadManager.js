/**
 * MediaUploadManager.js
 * Handles file uploads to WordPress media library with support for
 * both standalone uploads and message-associated uploads
 */

import AppPasswordManager from './AppPasswordManager.js';
import { API_ENDPOINTS } from '../config/api-config.js';

class MediaUploadManager {
    constructor() {
        this.authManager = null;
        this.apiEndpoint = null;
        this.uploadProgress = 0;
        this.isUploading = false;

        // File validation rules from FRONTEND_MEDIA_UPLOAD_INTEGRATION.md
        this.validationRules = {
            general: {
                maxFileSize: 10 * 1024 * 1024, // 10MB
                maxTotalSize: 20 * 1024 * 1024, // 20MB
                maxFiles: 3,
                allowedTypes: [
                    // Images
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'image/avif', 'image/bmp', 'image/tiff', 'image/svg+xml',
                    // Videos
                    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/quicktime',
                    // Documents
                    'application/pdf'
                ]
            },
            document: {
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxTotalSize: 100 * 1024 * 1024, // 100MB
                maxFiles: 5,
                allowedTypes: [
                    // Images (for design mockups, logos, etc.)
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                    'image/svg+xml', 'image/bmp', 'image/tiff',
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
                    'text/plain', 'text/rtf', 'application/rtf', 'text/csv',
                    // OpenOffice/LibreOffice
                    'application/vnd.oasis.opendocument.text',
                    'application/vnd.oasis.opendocument.spreadsheet',
                    'application/vnd.oasis.opendocument.presentation'
                ]
            }
        };

        this.initialize();
    }

    /**
     * Initialize authentication and API endpoint
     */
    async initialize() {
        try {
            this.authManager = new AppPasswordManager();
            await this.authManager.initialize();

            // Use centralized endpoint configuration
            this.apiEndpoint = API_ENDPOINTS.MEDIA_UPLOAD;

            console.log('MediaUploadManager initialized with endpoint:', this.apiEndpoint);
        } catch (error) {
            console.warn('MediaUploadManager authentication setup failed:', error.message);
            // Fallback to centralized configuration
            this.apiEndpoint = API_ENDPOINTS.MEDIA_UPLOAD;
        }
    }

    /**
     * Upload files for message association (Workflow A)
     * This is the primary workflow for quote/consultation form attachments
     *
     * @param {File[]} files - Array of File objects to upload
     * @param {string} messageType - Type of message (quote, consultation, etc.)
     * @param {string} validationType - Validation profile to use ('general' or 'document')
     * @returns {Promise<Object>} Upload result with attachment IDs
     */
    async uploadForMessage(files, messageType, validationType = 'document') {
        // Validate files
        const validation = this.validateFiles(files, validationType);
        if (!validation.valid) {
            return {
                success: false,
                message: 'File validation failed',
                errors: validation.errors
            };
        }

        // Create FormData
        const formData = new FormData();
        files.forEach(file => formData.append('files[]', file));

        // Message-associated parameters
        formData.append('post_id', '0');
        formData.append('post_type', 'attachment');
        formData.append('meta_field', 'media_content');
        formData.append('return_format', 'ids'); // Return IDs for CCT storage
        formData.append('context_tag', `${messageType}_attachment`);

        return await this.upload(formData);
    }

    /**
     * Upload files standalone (Workflow B)
     * For profile pictures, general asset management, etc.
     *
     * @param {File[]} files - Array of File objects to upload
     * @param {string} contextTag - Context identifier for tracking
     * @param {string} validationType - Validation profile to use
     * @returns {Promise<Object>} Upload result with full attachment metadata
     */
    async uploadStandalone(files, contextTag = 'general_upload', validationType = 'general') {
        // Validate files
        const validation = this.validateFiles(files, validationType);
        if (!validation.valid) {
            return {
                success: false,
                message: 'File validation failed',
                errors: validation.errors
            };
        }

        // Create FormData
        const formData = new FormData();
        files.forEach(file => formData.append('files[]', file));

        // Standalone parameters
        formData.append('post_id', '0');
        formData.append('post_type', 'attachment');
        formData.append('meta_field', 'standalone');
        formData.append('return_format', 'objects'); // Return full metadata
        formData.append('context_tag', contextTag);

        return await this.upload(formData);
    }

    /**
     * Core upload method (shared by both workflows)
     *
     * @param {FormData} formData - Prepared form data with files and parameters
     * @returns {Promise<Object>} Upload result from WordPress API
     */
    async upload(formData) {
        if (this.isUploading) {
            return {
                success: false,
                message: 'Upload already in progress'
            };
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        try {
            // Build headers
            const headers = {};

            // Add authentication if available
            if (this.authManager) {
                const authHeaders = await this.authManager.getAuthHeaders();
                Object.assign(headers, authHeaders);
            }

            // Use XMLHttpRequest for progress tracking
            const result = await this.uploadWithProgress(formData, headers);

            this.isUploading = false;
            return result;

        } catch (error) {
            this.isUploading = false;
            console.error('Upload error:', error);

            return {
                success: false,
                message: error.message || 'Upload failed',
                error: error
            };
        }
    }

    /**
     * Upload with progress tracking using XMLHttpRequest
     *
     * @param {FormData} formData - Form data to upload
     * @param {Object} headers - HTTP headers including auth
     * @returns {Promise<Object>} Upload result
     */
    uploadWithProgress(formData, headers) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    this.uploadProgress = (e.loaded / e.total) * 100;
                    this.onProgressUpdate(this.uploadProgress);
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Invalid JSON response from server'));
                    }
                } else {
                    try {
                        const errorResult = JSON.parse(xhr.responseText);
                        reject(new Error(errorResult.message || 'Upload failed'));
                    } catch (error) {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            // Open connection and set headers
            xhr.open('POST', this.apiEndpoint);

            // Set auth headers (don't set Content-Type, browser will set it with boundary)
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });

            // Send request
            xhr.send(formData);
        });
    }

    /**
     * Validate files against validation rules
     *
     * @param {File[]} files - Files to validate
     * @param {string} validationType - Validation profile ('general' or 'document')
     * @returns {Object} Validation result with errors array
     */
    validateFiles(files, validationType = 'general') {
        const errors = [];
        const rules = this.validationRules[validationType] || this.validationRules.general;

        // Check file count
        if (files.length > rules.maxFiles) {
            errors.push(`Maximum ${rules.maxFiles} files allowed`);
        }

        // Check each file
        let totalSize = 0;
        files.forEach((file, index) => {
            // Check file type
            if (!rules.allowedTypes.includes(file.type)) {
                errors.push(`File "${file.name}": Invalid file type (${file.type || 'unknown'})`);
            }

            // Check file size
            if (file.size > rules.maxFileSize) {
                const maxSizeMB = (rules.maxFileSize / (1024 * 1024)).toFixed(0);
                errors.push(`File "${file.name}": Exceeds ${maxSizeMB}MB limit`);
            }

            totalSize += file.size;
        });

        // Check total size
        if (totalSize > rules.maxTotalSize) {
            const maxTotalMB = (rules.maxTotalSize / (1024 * 1024)).toFixed(0);
            errors.push(`Total upload size exceeds ${maxTotalMB}MB limit`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Format file size for display
     *
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Progress update callback (can be overridden)
     *
     * @param {number} progress - Upload progress (0-100)
     */
    onProgressUpdate(progress) {
        // Override this method to handle progress updates in UI
        console.log(`Upload progress: ${progress.toFixed(1)}%`);
    }

    /**
     * Get current upload progress
     *
     * @returns {number} Current upload progress (0-100)
     */
    getProgress() {
        return this.uploadProgress;
    }

    /**
     * Check if upload is in progress
     *
     * @returns {boolean} True if upload is in progress
     */
    isUploadInProgress() {
        return this.isUploading;
    }
}

export default MediaUploadManager;
