/**
 * ProjectDiscovery.js
 * Handles the project discovery page functionality including
 * rich text editor, file uploads, and comprehensive form submission
 */

import SalesFunnelForm from './SalesFunnelForm.js';

class ProjectDiscovery {
    constructor() {
        this.salesFunnel = null;
        this.uploadedFiles = {
            project_documents: []
        };
        this.maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
        this.allowedTypes = {
            project_documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx']
        };

        // Immediately prevent form submission until initialization completes
        this.setupTemporaryFormHandler();

        this.init();
    }

    /**
     * Setup temporary form handler to prevent default submission during initialization
     */
    setupTemporaryFormHandler() {
        const form = document.getElementById('projectDiscoveryForm');
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
            
            console.log('ProjectDiscovery initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ProjectDiscovery:', error);
        }
    }

    /**
     * Initialize the rich text editor for project description
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
     * Initialize file upload functionality for project documents
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

        // Remove from display
        fileElement.remove();

        // Update upload area appearance
        const uploadArea = fileElement.closest('.file-upload-area');
        const fileList = uploadArea.querySelector('.file-list');
        if (fileList && fileList.children.length === 0) {
            uploadArea.classList.remove('has-files');
        }
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
     * Initialize form submission handling
     */
    initializeFormSubmission() {
        const form = document.getElementById('projectDiscoveryForm');
        if (!form) return;

        // Remove temporary handler if it exists
        if (this.tempHandler) {
            form.removeEventListener('submit', this.tempHandler);
            this.tempHandler = null;
            console.log('ProjectDiscovery: Temporary form handler removed, permanent handler attached');
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
            if (!this.validateDiscoveryForm(form)) {
                this.showValidationErrors();
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

            // Submit using sales funnel with 'project_planning' type (HTML storage)
            const result = await this.salesFunnel.handleFormSubmission('project_planning', form, {
                userMessage: editorContent,
                files: allFiles  // Pass File objects directly
            });

            if (result.success) {
                this.handleSubmissionSuccess(result);
            } else {
                this.handleSubmissionError(result.error);
            }

        } catch (error) {
            console.error('Discovery submission failed:', error);
            this.handleSubmissionError('An unexpected error occurred. Please try again.');
        } finally {
            this.setFormLoadingState(false);
        }
    }

    /**
     * Validate the discovery form
     */
    validateDiscoveryForm(form) {
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
     * Show validation error messages
     */
    showValidationErrors() {
        const firstError = document.querySelector('.form-error, .editor-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Please fill in all required fields correctly.');
        }
    }

    /**
     * Extract form data for submission (excluding file inputs)
     */
    extractFormData(form) {
        const formData = {};
        const formDataObj = new FormData(form);
        
        // File input names to exclude from form data (handled separately)
        const fileInputNames = ['projectDocuments'];

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
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const form = document.getElementById('projectDiscoveryForm');
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
        this.trackDiscoverySubmission('success');
        
        // Show success message
        if (this.salesFunnel) {
            this.salesFunnel.showSuccessMessage('project_planning');
        }
        
        // Redirect to project discovery thank you page after delay
        setTimeout(() => {
            window.location.href = '/project-discovery-thank-you.html';
        }, 2000);
    }

    /**
     * Handle form submission error
     */
    handleSubmissionError(error) {
        console.error('Discovery submission error:', error);
        
        // Track failed submission
        this.trackDiscoverySubmission('error');
        
        // Show error message
        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Failed to submit project discovery. Please try again.');
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'project-discovery',
                funnel_stage: 'project_planning'
            });
        }
    }

    /**
     * Track discovery submission attempts
     */
    trackDiscoverySubmission(status) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('discovery_submission', {
                status: status,
                files_uploaded: this.getAllFilesForUpload().length,
                form_type: 'project_discovery'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProjectDiscovery();
});

export default ProjectDiscovery;