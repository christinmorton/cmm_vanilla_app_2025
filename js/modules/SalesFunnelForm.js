/**
 * SalesFunnelForm.js
 * Core utilities for sales funnel form handling with structured data storage
 */

import AppPasswordManager from './AppPasswordManager.js';
import MediaUploadManager from './MediaUploadManager.js';
import { API_ENDPOINTS } from '../config/api-config.js';

class SalesFunnelForm {
    constructor(options = {}) {
        // Use centralized API configuration
        this.apiEndpoint = options.apiEndpoint || API_ENDPOINTS.SUBMIT_MESSAGE;
        this.analyticsTracker = options.analyticsTracker || null;
        this.authManager = null;
        this.mediaManager = null;

        // Initialize authentication and media upload
        this.initializeAuth();
        this.initializeMediaUpload();
    }

    /**
     * Initialize media upload manager
     */
    async initializeMediaUpload() {
        try {
            this.mediaManager = new MediaUploadManager();
            console.log('MediaUploadManager initialized for SalesFunnelForm');
        } catch (error) {
            console.warn('MediaUploadManager initialization failed:', error.message);
        }
    }

    /**
     * Initialize WordPress Application Password authentication
     */
    async initializeAuth() {
        try {
            this.authManager = new AppPasswordManager();
            const isReady = await this.authManager.initialize();

            // Use centralized endpoint configuration
            this.apiEndpoint = API_ENDPOINTS.SUBMIT_MESSAGE;

            console.log('SalesFunnelForm using API endpoint:', this.apiEndpoint);

            if (!isReady) {
                console.warn('WordPress authentication not available - forms will work in development mode');
            }
        } catch (error) {
            console.warn('WordPress authentication failed - forms will work in development mode:', error.message);
            // Fallback to centralized configuration
            this.apiEndpoint = API_ENDPOINTS.SUBMIT_MESSAGE;
        }
    }

    /**
     * Convert form data to CSV format for simple_message storage
     */
    formatAsCSV(formData, userMessage = '') {
        const csvPairs = [];
        
        Object.entries(formData).forEach(([key, value]) => {
            // Skip basic schema fields that get stored separately
            if (key !== 'name' && key !== 'email' && key !== 'phone' && key !== 'files' && value) {
                if (Array.isArray(value)) {
                    csvPairs.push(`${this.formatKey(key)}: ${value.join(', ')}`);
                } else {
                    csvPairs.push(`${this.formatKey(key)}: ${value}`);
                }
            }
        });
        
        if (userMessage) {
            // Truncate long messages for CSV storage
            const truncated = userMessage.length > 300 
                ? userMessage.substring(0, 297) + '...' 
                : userMessage;
            csvPairs.push(`Message: ${truncated}`);
        }
        
        return csvPairs.join(', ');
    }

    /**
     * Convert form data to structured HTML for detailed_message storage
     */
    formatAsHTML(formData, userMessage = '') {
        let html = '<div class="structured-form-data">';
        
        // Group related fields
        const sections = this.groupFormData(formData);
        
        Object.entries(sections).forEach(([sectionName, fields]) => {
            html += `<h4>${sectionName}</h4>`;
            Object.entries(fields).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    html += `<p><strong>${this.formatKey(key)}:</strong> ${value.join(', ')}</p>`;
                } else {
                    html += `<p><strong>${this.formatKey(key)}:</strong> ${value}</p>`;
                }
            });
        });
        
        if (userMessage) {
            html += '<h4>Project Description</h4>';
            html += `<div class="user-content">${userMessage}</div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Group form fields into logical sections for HTML formatting
     */
    groupFormData(formData) {
        const sections = {
            'Contact Information': {},
            'Project Details': {},
            'Technical Requirements': {},
            'Additional Information': {}
        };

        const contactFields = ['company', 'website', 'preferredContact', 'bestTime'];
        const projectFields = ['projectType', 'industry', 'targetAudience', 'budgetRange', 'timeline'];
        const techFields = ['technologies', 'additionalServices', 'platform'];

        Object.entries(formData).forEach(([key, value]) => {
            if (key !== 'name' && key !== 'email' && key !== 'phone' && key !== 'files' && value) {
                if (contactFields.includes(key)) {
                    sections['Contact Information'][key] = value;
                } else if (projectFields.includes(key)) {
                    sections['Project Details'][key] = value;
                } else if (techFields.includes(key)) {
                    sections['Technical Requirements'][key] = value;
                } else {
                    sections['Additional Information'][key] = value;
                }
            }
        });

        // Remove empty sections
        Object.keys(sections).forEach(section => {
            if (Object.keys(sections[section]).length === 0) {
                delete sections[section];
            }
        });

        return sections;
    }

    /**
     * Format field key for display (camelCase to Title Case)
     */
    formatKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    /**
     * Universal message submission handler
     */
    async createMessageSubmission(formType, formData, userMessage = '') {
        const baseMessage = {
            type: formType,
            name: formData.name,
            email_address: formData.email || formData.email_address,
            subject: this.generateSubject(formType, formData)
        };

        // Ensure we have email in the format WordPress expects
        if (formData.email && !baseMessage.email_address) {
            baseMessage.email_address = formData.email;
        }
        
        // Also add email field for WordPress validation (if it expects 'email' instead of 'email_address')
        if (baseMessage.email_address) {
            baseMessage.email = baseMessage.email_address;
        }

        // Add optional schema fields if present
        if (formData.phone) baseMessage.phone = formData.phone;
        if (formData.chainId) baseMessage.chain_id = formData.chainId;

        // NOTE: media_content is NOT set here - it's set after file upload
        // in handleFormSubmission() with attachment IDs, not File objects

        // Determine storage strategy based on form complexity
        if (this.isSimpleForm(formType)) {
            baseMessage.simple_message = this.formatAsCSV(formData, userMessage);
        } else {
            baseMessage.detailed_message = this.formatAsHTML(formData, userMessage);
        }

        return baseMessage;
    }

    /**
     * Determine if form should use simple CSV or complex HTML storage
     */
    isSimpleForm(formType) {
        return ['lead', 'appointment', 'payment', 'support'].includes(formType);
    }

    /**
     * Generate appropriate subject line based on form type and data
     */
    generateSubject(formType, formData) {
        const subjects = {
            'lead': `Lead Inquiry - ${formData.serviceInterest || 'General Interest'}`,
            'consultation': `Consultation Request - ${formData.projectType || 'General'}`,
            'quote': `Quote Request - ${formData.projectType || 'Project'}`,
            'appointment': `${formData.consultationType || 'Consultation'} - ${formData.selectedDate || 'TBD'}`,
            'payment': `Payment Received - ${formData.projectId || 'Project'}`,
            'support': `Support Request - ${formData.requestType || 'General'}`
        };

        return subjects[formType] || `${formType} Submission`;
    }

    /**
     * Submit form data to WordPress API with authentication
     */
    async submitToAPI(messageData) {
        try {
            // Build headers
            const headers = {
                'Content-Type': 'application/json',
            };

            // Add authentication if available
            if (this.authManager) {
                const authHeaders = await this.authManager.getAuthHeaders();
                Object.assign(headers, authHeaders);
            }

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(messageData)
            });

            // Handle different response types
            if (response.status === 404) {
                console.warn('WordPress API endpoint not found - check if backend is running');
                return this.handleDevelopmentMode(messageData);
            }

            // Parse response
            let result;
            try {
                const textResponse = await response.text();
                result = textResponse ? JSON.parse(textResponse) : {};
            } catch (parseError) {
                console.warn('Invalid JSON response from WordPress API');
                return this.handleDevelopmentMode(messageData);
            }

            if (response.ok) {
                // Track successful submission
                this.trackSubmission(messageData.type, 'success');
                return { success: true, data: result };
            } else {
                console.error('WordPress API Error:', result);
                return { success: false, error: result };
            }
        } catch (error) {
            console.error('Submission Error:', error);
            console.warn('Falling back to development mode');
            return this.handleDevelopmentMode(messageData);
        }
    }

    /**
     * Handle development mode when WordPress API is not available
     */
    handleDevelopmentMode(messageData) {
        console.log('🔧 DEVELOPMENT MODE - Form submission data:', messageData);
        
        // Show the structured data in console for debugging
        if (messageData.simple_message) {
            console.log('📝 CSV Data:', this.parseCSVMessage(messageData.simple_message));
        }
        if (messageData.detailed_message) {
            console.log('🏗️ HTML Data:', messageData.detailed_message);
        }
        
        // Simulate API delay
        return new Promise(resolve => {
            setTimeout(() => {
                this.trackSubmission(messageData.type, 'dev_success');
                resolve({
                    success: true,
                    data: {
                        id: Math.floor(Math.random() * 1000),
                        message: 'Development mode - check console for form data',
                        type: messageData.type
                    },
                    isDevelopment: true
                });
            }, 1000);
        });
    }

    /**
     * Complete form submission workflow with file upload support
     */
    async handleFormSubmission(formType, formElement, options = {}) {
        const formData = this.extractFormData(formElement);
        const userMessage = options.userMessage || '';

        // Validate required fields
        if (!this.validateForm(formData, formType)) {
            return { success: false, error: 'Please fill in all required fields' };
        }

        let attachmentIds = [];

        // Step 1: Upload files FIRST (if provided)
        if (options.files && options.files.length > 0) {
            console.log(`Uploading ${options.files.length} file(s) for ${formType} message...`);

            try {
                const uploadResult = await this.mediaManager.uploadForMessage(
                    options.files,
                    formType,
                    'document' // Use document validation rules for business forms
                );

                if (uploadResult.success) {
                    attachmentIds = uploadResult.data.attachments || [];
                    console.log(`File upload successful. Attachment IDs:`, attachmentIds);
                } else {
                    console.warn('File upload failed:', uploadResult.message);
                    console.log('🚫 BLOCKING FORM SUBMISSION - Validation failed');

                    // Show validation errors to user
                    if (uploadResult.errors && uploadResult.errors.length > 0) {
                        uploadResult.errors.forEach(error => {
                            this.showNotification(error, 'error');
                        });
                    } else {
                        this.showNotification(`File upload failed: ${uploadResult.message}`, 'error');
                    }

                    // BLOCK form submission - return error so user can fix validation issues
                    console.log('🚫 Returning error result, message will NOT be created');
                    return {
                        success: false,
                        error: 'File validation failed. Please review the errors and try again.',
                        validationErrors: uploadResult.errors || [uploadResult.message]
                    };
                }
            } catch (error) {
                console.error('File upload error:', error);
                this.showNotification('Files could not be uploaded due to a network error.', 'error');

                // BLOCK form submission on network error
                return {
                    success: false,
                    error: 'Network error during file upload. Please check your connection and try again.',
                    networkError: true
                };
            }
        }

        // Step 2: Create message submission with attachment IDs
        const messageData = await this.createMessageSubmission(formType, formData, userMessage);

        // Add attachment IDs to simple_message field for easy manual copying
        if (attachmentIds.length > 0) {
            const idsString = attachmentIds.join(', ');
            messageData.simple_message = `Attachment IDs: ${idsString}`;
            console.log('Added attachment IDs to simple_message:', idsString);
        }

        // Step 3: Submit message to API
        const result = await this.submitToAPI(messageData);

        if (result.success) {
            // Handle success (redirect, show thank you, etc.)
            this.handleSubmissionSuccess(formType, result.data);
        } else {
            // Handle error
            this.handleSubmissionError(result.error);
        }

        return result;
    }

    /**
     * Extract form data from form element
     */
    extractFormData(formElement) {
        const formData = {};
        const formDataObj = new FormData(formElement);

        // File input names to exclude (handled separately via MediaUploadManager)
        const fileInputNames = ['designFiles', 'brandFiles', 'documentFiles', 'projectDocuments', 'files'];

        for (let [key, value] of formDataObj.entries()) {
            // Skip file inputs - they're handled separately via uploadedFiles
            if (fileInputNames.includes(key)) {
                continue;
            }

            if (formData[key]) {
                // Handle multiple values (checkboxes, etc.)
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
     * Basic form validation
     */
    validateForm(formData, formType) {
        // Required fields for all forms
        if (!formData.name || !formData.name.trim()) return false;
        if (!formData.email || !formData.email.includes('@')) return false;

        // Type-specific validation
        const typeRequirements = {
            'quote': ['projectType', 'budgetRange', 'timeline'],
            'consultation': ['projectType'],
            'appointment': ['consultationType', 'selectedDate'],
            'payment': ['projectId', 'totalCost']
        };

        const required = typeRequirements[formType] || [];
        return required.every(field => formData[field] && formData[field].trim());
    }

    /**
     * Handle successful form submission
     */
    handleSubmissionSuccess(formType, responseData) {
        // Show success message
        this.showSuccessMessage(formType);

        // Redirect if specified
        const redirectUrls = {
            'lead': '/thank-you.html',
            'consultation': '/consultation-thank-you.html',
            'quote': '/quote-thank-you.html'
        };

        if (redirectUrls[formType]) {
            setTimeout(() => {
                window.location.href = redirectUrls[formType];
            }, 2000);
        }
    }

    /**
     * Generate appropriate checkout URL based on form type and context
     */
    generateCheckoutURL(formType, context = {}) {
        const baseUrls = {
            'consultation': 'checkout-free.html',
            'quote': 'checkout.html',
            'project': 'checkout.html',
            'custom': 'checkout-custom.html'
        };

        // Determine base URL
        let baseUrl = baseUrls[formType] || baseUrls['custom'];

        // Build query parameters
        const params = new URLSearchParams();

        // Add source tracking
        params.set('source', `${formType}_form`);

        // Add form-specific parameters
        switch (formType) {
            case 'consultation':
                // Free consultation checkout
                if (context.urgency) params.set('urgency', context.urgency);
                if (context.projectType) params.set('project_type', context.projectType);
                break;

            case 'quote':
                // Quote form should suggest appropriate deposit
                baseUrl = 'checkout.html';
                if (context.budgetRange) {
                    const deposit = this.calculateRecommendedDeposit(context.budgetRange);
                    params.set('recommended', deposit.toString());
                }
                if (context.projectType) params.set('project_type', context.projectType);
                break;

            case 'custom':
                // Custom amount checkout
                if (context.amount) params.set('amount', context.amount);
                if (context.description) params.set('description', encodeURIComponent(context.description));
                if (context.type) params.set('type', context.type);
                break;

            default:
                // General project inquiry - suggest standard deposit
                params.set('recommended', '150');
                break;
        }

        // Add message ID for tracking if available
        if (context.messageId) {
            params.set('message_id', context.messageId);
        }

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Calculate recommended deposit based on budget range
     */
    calculateRecommendedDeposit(budgetRange) {
        const depositMap = {
            'under-5k': 150,
            '5k-10k': 250,
            '10k-25k': 500,
            '25k-50k': 750,
            'over-50k': 1000
        };

        return depositMap[budgetRange] || 250; // Default deposit
    }

    /**
     * Generate checkout CTA link for thank you pages
     */
    generateCheckoutCTA(formType, formData, messageId) {
        const context = {
            budgetRange: formData.budgetRange,
            projectType: formData.projectType,
            urgency: formData.urgency,
            messageId: messageId
        };

        return this.generateCheckoutURL(formType, context);
    }

    /**
     * Enhanced submission success handling with checkout integration
     */
    handleSubmissionSuccessWithCheckout(formType, responseData, formData) {
        // Show success message
        this.showSuccessMessage(formType);

        // Generate checkout context
        const checkoutContext = {
            budgetRange: formData.budgetRange,
            projectType: formData.projectType,
            urgency: formData.urgency,
            messageId: responseData.id
        };

        // Store checkout URL for thank you pages
        if (window.sessionStorage) {
            sessionStorage.setItem('checkoutURL', this.generateCheckoutURL(formType, checkoutContext));
            sessionStorage.setItem('formType', formType);
            sessionStorage.setItem('formData', JSON.stringify(formData));
        }

        // Redirect to appropriate thank you page
        const redirectUrls = {
            'lead': '/thank-you.html',
            'consultation': '/consultation-thank-you.html',
            'quote': '/quote-thank-you.html'
        };

        if (redirectUrls[formType]) {
            setTimeout(() => {
                window.location.href = redirectUrls[formType];
            }, 2000);
        }
    }

    /**
     * Handle form submission errors
     */
    handleSubmissionError(error) {
        console.error('Form submission failed:', error);
        this.showErrorMessage('Something went wrong. Please try again.');
    }

    /**
     * Show success message to user
     */
    showSuccessMessage(formType) {
        const messages = {
            'lead': 'Thank you for your interest! We\'ll be in touch soon.',
            'consultation': 'Consultation request received! We\'ll contact you to schedule.',
            'quote': 'Quote request submitted! We\'ll prepare a custom proposal for you.',
            'appointment': 'Appointment scheduled! You\'ll receive a confirmation email.',
            'payment': 'Payment processed successfully! Welcome aboard!'
        };

        this.showNotification(messages[formType] || 'Form submitted successfully!', 'success');
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `funnel-notification funnel-notification--${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after duration (longer for warnings)
        const duration = type === 'warning' ? 8000 : 5000;
        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    /**
     * Track form submissions for analytics
     */
    trackSubmission(formType, status) {
        if (this.analyticsTracker && typeof this.analyticsTracker.trackFormSubmit === 'function') {
            this.analyticsTracker.trackFormSubmit({
                type: formType,
                status: status,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('Analytics tracking not available or trackFormSubmit method missing');
        }
    }

    /**
     * Generate unique chain ID for message threading
     */
    generateChainId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
    }

    /**
     * Parse CSV data back into structured object
     */
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

    /**
     * Parse HTML data back into structured object
     */
    parseHTMLMessage(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        const data = {};
        
        // Extract structured data from <strong> tags
        doc.querySelectorAll('p').forEach(p => {
            const strong = p.querySelector('strong');
            if (strong) {
                const key = strong.textContent.replace(':', '');
                const value = p.textContent.replace(strong.textContent, '').trim();
                data[key] = value;
            }
        });
        
        // Extract user message content
        const userContent = doc.querySelector('.user-content');
        if (userContent) {
            data['User Message'] = userContent.innerHTML;
        }
        
        return data;
    }
}

// Export for use in other modules
export default SalesFunnelForm;