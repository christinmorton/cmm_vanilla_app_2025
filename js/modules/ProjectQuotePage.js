/**
 * ProjectQuotePage.js
 * Handles the project quote request page functionality including
 * rich text editor, file uploads, and form submission
 */

import SalesFunnelForm from './SalesFunnelForm.js';

class ProjectQuotePage {
    constructor() {
        this.salesFunnel = null;
        this.uploadedFiles = {
            design: [],
            brand: [],
            documents: []
        };
        this.maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
        this.allowedTypes = {
            design: ['.png', '.jpg', '.jpeg', '.pdf', '.psd', '.ai', '.sketch'],
            brand: ['.png', '.jpg', '.jpeg', '.pdf', '.svg', '.ai', '.eps'],
            documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf']
        };

        // Immediately prevent form submission until initialization completes
        this.setupTemporaryFormHandler();

        this.init();
    }

    /**
     * Setup temporary form handler to prevent default submission during initialization
     */
    setupTemporaryFormHandler() {
        const form = document.getElementById('projectQuoteForm');
        if (form) {
            const tempHandler = (e) => {
                e.preventDefault();
                console.log('Form submission prevented - initialization still in progress');

                // Show loading message
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Initializing...';
                    submitBtn.disabled = true;

                    // Re-enable after a moment
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }, 2000);
                }
            };

            form.addEventListener('submit', tempHandler);
            this.tempHandler = tempHandler;
        }
    }

    async init() {
        try {
            // Initialize sales funnel with analytics tracking
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });
            
            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.initializeRichTextEditor();
            this.initializeFileUploads();
            this.initializeFormSubmission();
            this.trackPageView();
            
            console.log('ProjectQuotePage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ProjectQuotePage:', error);
        }
    }

    /**
     * Initialize the rich text editor
     */
    initializeRichTextEditor() {
        const editor = document.getElementById('projectDescription');
        const hiddenInput = document.getElementById('projectDescriptionInput');
        const toolbar = document.querySelector('.editor-toolbar');

        if (!editor || !hiddenInput || !toolbar) return;

        // Handle toolbar buttons
        toolbar.addEventListener('click', (e) => {
            if (e.target.matches('.editor-btn')) {
                e.preventDefault();
                const command = e.target.dataset.command;
                this.executeEditorCommand(command);
                editor.focus();
            }
        });

        // Handle content changes
        editor.addEventListener('input', () => {
            hiddenInput.value = editor.innerHTML;
            this.validateEditor();
        });

        // Handle placeholder behavior
        editor.addEventListener('focus', () => {
            if (editor.textContent.trim() === '') {
                editor.classList.add('editor-focused');
            }
        });

        editor.addEventListener('blur', () => {
            if (editor.textContent.trim() === '') {
                editor.classList.remove('editor-focused');
            }
        });

        // Handle paste events to clean up HTML
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    }

    /**
     * Execute rich text editor commands
     */
    executeEditorCommand(command) {
        try {
            document.execCommand(command, false, null);
        } catch (error) {
            console.warn('Editor command failed:', command, error);
        }
    }

    /**
     * Validate rich text editor content
     */
    validateEditor() {
        const editor = document.getElementById('projectDescription');
        const hiddenInput = document.getElementById('projectDescriptionInput');
        
        if (!editor || !hiddenInput) return;

        const content = editor.textContent.trim();
        const isValid = content.length >= 50; // Minimum 50 characters
        
        editor.classList.toggle('editor-error', !isValid);
        
        return isValid;
    }

    /**
     * Initialize file upload functionality
     */
    initializeFileUploads() {
        const uploadAreas = document.querySelectorAll('.file-upload-area');
        
        uploadAreas.forEach(area => {
            const fileInput = area.querySelector('.file-input');
            const uploadType = area.dataset.uploadType;
            
            if (!fileInput || !uploadType) return;

            // Handle drag and drop
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('drag-over');
            });

            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                if (!area.contains(e.relatedTarget)) {
                    area.classList.remove('drag-over');
                }
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('drag-over');
                this.handleFileSelection(e.dataTransfer.files, uploadType, area);
            });

            // Handle click to browse
            area.addEventListener('click', (e) => {
                if (!e.target.matches('.file-remove')) {
                    fileInput.click();
                }
            });

            // Handle file input change
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files, uploadType, area);
            });
        });
    }

    /**
     * Handle file selection and validation
     */
    handleFileSelection(files, uploadType, uploadArea) {
        const allowedExtensions = this.allowedTypes[uploadType];
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            // Check file size
            if (file.size > this.maxFileSize) {
                errors.push(`${file.name}: File too large (max 10MB)`);
                return;
            }

            // Check file type
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(extension)) {
                errors.push(`${file.name}: File type not allowed`);
                return;
            }

            validFiles.push(file);
        });

        // Show errors
        if (errors.length > 0) {
            this.showFileErrors(errors, uploadArea);
        }

        // Process valid files
        if (validFiles.length > 0) {
            this.addFilesToUpload(validFiles, uploadType, uploadArea);
        }
    }

    /**
     * Add valid files to the upload queue
     */
    addFilesToUpload(files, uploadType, uploadArea) {
        const fileList = uploadArea.querySelector('.file-list');
        if (!fileList) return;

        files.forEach(file => {
            // Add to our tracking
            this.uploadedFiles[uploadType].push(file);

            // Create file display element
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="file-remove" data-file-name="${file.name}" data-upload-type="${uploadType}">
                    <span class="sr-only">Remove file</span>
                    ×
                </button>
            `;

            fileList.appendChild(fileItem);

            // Handle file removal
            fileItem.querySelector('.file-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(file.name, uploadType, fileItem);
            });
        });

        // Update upload area appearance
        uploadArea.classList.add('has-files');

        // Validate all files after adding
        this.validateAllFiles();
    }

    /**
     * Remove a file from upload queue
     */
    removeFile(fileName, uploadType, fileElement) {
        // Remove from tracking
        const fileArray = this.uploadedFiles[uploadType];
        const index = fileArray.findIndex(file => file.name === fileName);
        if (index > -1) {
            fileArray.splice(index, 1);
        }

        // Get upload area BEFORE removing element from DOM
        const uploadArea = fileElement.closest('.file-upload-area');
        const fileList = uploadArea ? uploadArea.querySelector('.file-list') : null;

        // Remove from display
        fileElement.remove();

        // Update upload area appearance
        if (fileList && fileList.children.length === 0 && uploadArea) {
            uploadArea.classList.remove('has-files');
        }

        // Re-validate all files after removal
        this.validateAllFiles();
    }

    /**
     * Show file upload errors
     */
    showFileErrors(errors, uploadArea) {
        let errorContainer = uploadArea.querySelector('.upload-errors');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'upload-errors';
            uploadArea.appendChild(errorContainer);
        }

        errorContainer.innerHTML = errors.map(error => `
            <div class="upload-error">${error}</div>
        `).join('');

        // Auto-hide errors after 5 seconds
        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate all uploaded files using MediaUploadManager rules
     * Shows persistent inline error messages
     */
    validateAllFiles() {
        const allFiles = this.getAllFilesForUpload();
        console.log(`🔍 validateAllFiles called with ${allFiles.length} files`);

        // Clear any existing validation errors first
        this.clearValidationErrors();

        // If no files, nothing to validate
        if (allFiles.length === 0) {
            console.log('✅ No files to validate');
            return { valid: true, errors: [] };
        }

        // Use the same validation rules as MediaUploadManager (document type)
        const rules = {
            maxFileSize: 50 * 1024 * 1024, // 50MB
            maxTotalSize: 100 * 1024 * 1024, // 100MB
            maxFiles: 5,
            allowedTypes: [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                'image/svg+xml', 'image/bmp', 'image/tiff',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/rtf', 'application/rtf', 'text/csv',
                'application/vnd.oasis.opendocument.text',
                'application/vnd.oasis.opendocument.spreadsheet',
                'application/vnd.oasis.opendocument.presentation'
            ]
        };

        const errors = [];

        // Check file count
        if (allFiles.length > rules.maxFiles) {
            errors.push({
                type: 'count',
                message: `Maximum ${rules.maxFiles} files allowed. You have ${allFiles.length} files.`,
                fix: `Please remove ${allFiles.length - rules.maxFiles} file(s) to continue.`
            });
        }

        // Check each file
        let totalSize = 0;
        allFiles.forEach((file) => {
            // Check file type
            if (!rules.allowedTypes.includes(file.type)) {
                errors.push({
                    type: 'type',
                    message: `File "${file.name}": Invalid file type (${file.type || 'unknown'})`,
                    fix: 'Allowed types: PDF, Word, Excel, PowerPoint, Images, and text files.'
                });
            }

            // Check file size
            if (file.size > rules.maxFileSize) {
                const maxSizeMB = (rules.maxFileSize / (1024 * 1024)).toFixed(0);
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                errors.push({
                    type: 'size',
                    message: `File "${file.name}": Exceeds ${maxSizeMB}MB limit (${fileSizeMB}MB)`,
                    fix: `Please compress or split this file, or remove it.`
                });
            }

            totalSize += file.size;
        });

        // Check total size
        if (totalSize > rules.maxTotalSize) {
            const maxTotalMB = (rules.maxTotalSize / (1024 * 1024)).toFixed(0);
            const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
            errors.push({
                type: 'total',
                message: `Total upload size exceeds ${maxTotalMB}MB limit (${totalSizeMB}MB total)`,
                fix: 'Please remove some files or compress them before uploading.'
            });
        }

        console.log(`📊 Validation complete. Errors found: ${errors.length}`, errors);

        // Show errors if any
        if (errors.length > 0) {
            console.log('⚠️ About to call showValidationErrors...');
            try {
                this.showValidationErrors(errors);
                console.log('✅ showValidationErrors completed');
            } catch (error) {
                console.error('❌ Error in showValidationErrors:', error);
            }
            return { valid: false, errors };
        }

        console.log('✅ All files valid!');
        return { valid: true, errors: [] };
    }

    /**
     * Show persistent validation errors in the form
     */
    showValidationErrors(errors) {
        console.log('📝 showValidationErrors called with:', errors);
        console.trace('Stack trace for showValidationErrors');

        // Find the file upload section
        const uploadSection = document.querySelector('.file-upload-section');
        console.log('🔍 uploadSection query result:', uploadSection);

        if (!uploadSection) {
            console.error('❌ Could not find .file-upload-section element');
            alert('ERROR: Could not find .file-upload-section element in the DOM');
            return;
        }

        console.log('✅ Found upload section:', uploadSection);

        // Remove any existing validation error container
        console.log('🧹 Calling clearValidationErrors...');
        this.clearValidationErrors();
        console.log('🧹 clearValidationErrors completed');

        // Create validation error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors';
        errorContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        errorContainer.innerHTML = `
            <div class="validation-error-title">
                <span class="error-icon">⚠️</span>
                <span>File Validation Issues</span>
            </div>
            <ul class="validation-error-list">
                ${errors.map(error => `
                    <li class="validation-error-item">${error.message}</li>
                `).join('')}
            </ul>
            <div class="validation-error-fix">
                <strong>How to fix:</strong>
                <p>${errors[0].fix}</p>
            </div>
        `;

        console.log('📦 Error container created:', errorContainer);
        console.log('📦 Error container HTML:', errorContainer.outerHTML.substring(0, 200));

        // Insert at the top of the upload section
        uploadSection.insertBefore(errorContainer, uploadSection.firstChild);
        console.log('✅ Validation error container inserted into DOM');
        console.log('✅ Error container parent:', errorContainer.parentElement);
        console.log('✅ Error container in document:', document.contains(errorContainer));

        // Add error state to upload areas
        const uploadAreas = document.querySelectorAll('.file-upload-area');
        console.log('🎨 Adding error state to', uploadAreas.length, 'upload areas');
        uploadAreas.forEach(area => {
            area.classList.add('has-validation-errors');
        });

        // Scroll to errors
        console.log('📜 Scrolling to error container...');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('✅ showValidationErrors COMPLETE');
    }

    /**
     * Clear all validation errors
     */
    clearValidationErrors() {
        // Remove validation error containers
        document.querySelectorAll('.validation-errors').forEach(el => el.remove());

        // Remove error state from upload areas
        document.querySelectorAll('.file-upload-area').forEach(area => {
            area.classList.remove('has-validation-errors');
        });
    }

    /**
     * Initialize form submission handling
     */
    initializeFormSubmission() {
        const form = document.getElementById('projectQuoteForm');
        if (!form) return;

        // Remove temporary handler if it exists
        if (this.tempHandler) {
            form.removeEventListener('submit', this.tempHandler);
            this.tempHandler = null;
            console.log('ProjectQuote: Temporary form handler removed, permanent handler attached');
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmission(form);
        });
    }

    /**
     * Handle form submission
     */
    async handleFormSubmission(form) {
        try {
            // Validate form
            if (!this.validateForm(form)) {
                this.showFormFieldValidationErrors();
                return;
            }

            // Show loading state
            this.setFormLoadingState(true);

            // Extract form data
            const formData = this.extractFormData(form);

            // Get rich text content
            const editorContent = document.getElementById('projectDescription').innerHTML;

            // Collect all uploaded File objects (no base64 conversion)
            const allFiles = this.getAllFilesForUpload();

            // Submit using sales funnel with files option
            const result = await this.salesFunnel.handleFormSubmission('quote', form, {
                userMessage: editorContent,
                files: allFiles  // Pass File objects directly
            });

            // Check for explicit success flag
            if (result && result.success === true) {
                console.log('✅ Form submission successful, redirecting...');
                this.handleSubmissionSuccess(result);
            } else {
                console.log('❌ Form submission failed:', result?.error || 'Unknown error');
                this.handleSubmissionError(result?.error || 'Form submission failed');
                // EXPLICITLY return to prevent any further execution
                return;
            }

        } catch (error) {
            console.error('Form submission failed:', error);
            this.handleSubmissionError('An unexpected error occurred. Please try again.');
        } finally {
            this.setFormLoadingState(false);
        }
    }

    /**
     * Validate the entire form
     */
    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Validate required fields
        requiredFields.forEach(field => {
            if (field.id === 'projectDescriptionInput') {
                // Special validation for rich text editor
                if (!this.validateEditor()) {
                    isValid = false;
                }
            } else if (!field.value.trim()) {
                field.classList.add('form-error');
                isValid = false;
            } else {
                field.classList.remove('form-error');
            }
        });

        return isValid;
    }

    /**
     * Show form field validation error messages (for required fields)
     */
    showFormFieldValidationErrors() {
        const firstError = document.querySelector('.form-error, .editor-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Please fill in all required fields correctly.');
        }
    }

    /**
     * Extract form data for submission
     */
    extractFormData(form) {
        const formData = {};
        const formDataObj = new FormData(form);
        
        // File input names to exclude from form data (handled separately)
        const fileInputNames = ['designFiles', 'brandFiles', 'documentFiles'];

        for (let [key, value] of formDataObj.entries()) {
            // Skip file inputs - they're handled separately via uploadedFiles
            if (fileInputNames.includes(key)) {
                continue;
            }
            
            if (formData[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(formData[key])) {
                    formData[key].push(value);
                } else {
                    formData[key] = [formData[key], value];
                }
            } else {
                formData[key] = value;
            }
        }

        return formData;
    }

    /**
     * Get all uploaded File objects for upload to WordPress media API
     * Returns an array of raw File objects (no base64 conversion)
     */
    getAllFilesForUpload() {
        const files = [];

        // Collect all File objects from each category
        Object.values(this.uploadedFiles).forEach(fileArray => {
            files.push(...fileArray);
        });

        return files;
    }

    /**
     * Get file metadata for display/tracking purposes
     */
    getFileMetadata() {
        const metadata = [];
        
        Object.entries(this.uploadedFiles).forEach(([type, fileArray]) => {
            fileArray.forEach(file => {
                metadata.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    category: type,
                    lastModified: file.lastModified
                });
            });
        });

        return metadata;
    }

    /**
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const form = document.getElementById('projectQuoteForm');
        const submitBtn = form.querySelector('.funnel-cta');
        
        if (isLoading) {
            form.classList.add('form-loading');
            submitBtn.classList.add('btn-loading');
            submitBtn.disabled = true;
        } else {
            form.classList.remove('form-loading');
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    }

    /**
     * Handle successful form submission
     */
    handleSubmissionSuccess(result) {
        // Track successful submission
        this.trackQuoteSubmission('success');
        
        // Show success message
        if (this.salesFunnel) {
            this.salesFunnel.showSuccessMessage('quote');
        }
        
        // Redirect to quote thank you page after delay
        setTimeout(() => {
            window.location.href = '/quote-thank-you.html';
        }, 2000);
    }

    /**
     * Handle form submission error
     */
    handleSubmissionError(error) {
        console.error('Quote submission error:', error);
        
        // Track failed submission
        this.trackQuoteSubmission('error');
        
        // Show error message
        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Failed to submit quote request. Please try again.');
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'project-quote',
                funnel_stage: 'quote_request'
            });
        }
    }

    /**
     * Track quote submission attempts
     */
    trackQuoteSubmission(status) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('quote_submission', {
                status: status,
                files_uploaded: this.getAllFilesForUpload().length,
                form_type: 'project_quote'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProjectQuotePage();
});

export default ProjectQuotePage;