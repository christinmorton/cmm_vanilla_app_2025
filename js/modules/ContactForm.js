/**
 * ContactForm Module
 * 
 * Handles contact form submission to WordPress backend API
 * Integrates with AnalyticsTracker for automatic event tracking
 */

import analytics from './AnalyticsTracker.js';

class ContactForm {
    constructor(formSelector = '#contactForm') {
        this.form = document.querySelector(formSelector);
        this.apiBaseUrl = this.getApiBaseUrl();
        this.isSubmitting = false;
        
        if (this.form) {
            this.init();
            console.log('ContactForm initialized');
        } else {
            console.warn('Contact form not found:', formSelector);
        }
    }

    /**
     * Environment-aware API base URL detection
     */
    getApiBaseUrl() {
        const hostname = window.location.hostname;
        
        if (hostname === 'christinmorton.local' || hostname.includes('localhost')) {
            // Development environment - use HTTP to avoid SSL certificate issues
            return 'http://christinmorton.local/wp-json';
        } else {
            // Production environment
            return 'https://cms.christinmorton.com/wp-json';
        }
    }

    /**
     * Initialize form handlers
     */
    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupFormElements();
    }

    /**
     * Setup form element references and validation
     */
    setupFormElements() {
        this.elements = {
            name: this.form.querySelector('[name="name"]'),
            email: this.form.querySelector('[name="email"]'),
            phone: this.form.querySelector('[name="phone"]'),
            subject: this.form.querySelector('[name="subject"]'),
            message: this.form.querySelector('[name="message"]'),
            submitButton: this.form.querySelector('[type="submit"]'),
            statusDiv: this.form.querySelector('#formStatus'),
            successDiv: this.form.querySelector('#formSuccess'),
            errorDiv: this.form.querySelector('#formError')
        };

        // Add real-time validation
        this.setupValidation();
    }

    /**
     * Setup real-time form validation
     */
    setupValidation() {
        // Email validation
        this.elements.email?.addEventListener('blur', (e) => {
            this.validateEmail(e.target);
        });

        // Phone validation (optional)
        this.elements.phone?.addEventListener('blur', (e) => {
            this.validatePhone(e.target);
        });

        // Name validation
        this.elements.name?.addEventListener('blur', (e) => {
            this.validateRequired(e.target, 'Name is required');
        });

        // Message validation
        this.elements.message?.addEventListener('blur', (e) => {
            this.validateRequired(e.target, 'Message is required');
        });
    }

    /**
     * Validate required fields
     */
    validateRequired(input, message) {
        const value = input.value.trim();
        
        if (!value) {
            this.showFieldError(input, message);
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    /**
     * Validate email field
     */
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError(input, 'Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            this.showFieldError(input, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    /**
     * Validate phone field (optional but format check if provided)
     */
    validatePhone(input) {
        const phone = input.value.trim();
        
        if (!phone) {
            // Phone is optional, clear any errors
            this.clearFieldError(input);
            return true;
        }
        
        // Basic phone format validation
        const phoneRegex = /^[\+]?[0-9\-\(\) ]{7,20}$/;
        
        if (!phoneRegex.test(phone)) {
            this.showFieldError(input, 'Please enter a valid phone number');
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    /**
     * Show field-specific error
     */
    showFieldError(input, message) {
        input.classList.add('error');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    /**
     * Clear field error
     */
    clearFieldError(input) {
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;
        
        // Validate required fields
        if (!this.validateRequired(this.elements.name, 'Name is required')) {
            isValid = false;
        }
        
        if (!this.validateEmail(this.elements.email)) {
            isValid = false;
        }
        
        if (!this.validateRequired(this.elements.message, 'Message is required')) {
            isValid = false;
        }
        
        // Validate optional phone if provided
        if (!this.validatePhone(this.elements.phone)) {
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Collect form data
     */
    getFormData() {
        return {
            type: 'contact',
            name: this.elements.name.value.trim(),
            email: this.elements.email.value.trim(),
            phone: this.elements.phone.value.trim() || '',
            subject: this.elements.subject.value.trim() || '',
            simple_message: this.elements.message.value.trim(),
            // detailed_message is not used in this simple contact form
        };
    }

    /**
     * Submit form data to WordPress API
     */
    async submitToApi(formData) {
        const response = await fetch(`${this.apiBaseUrl}/cmm/v1/submit-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors?.join(', ') || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();

        // Prevent double submission
        if (this.isSubmitting) {
            return;
        }

        // Validate form
        if (!this.validateForm()) {
            this.showError('Please correct the errors above and try again.');
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButtonState(true);
        this.hideStatus();

        try {
            // Collect form data
            const formData = this.getFormData();
            
            // Submit to WordPress API
            const result = await this.submitToApi(formData);
            
            console.log('Message submitted successfully:', result);

            // Track analytics event with message ID
            analytics.trackFormSubmit({
                messageId: result.id,
                type: 'contact'
            });

            // Show detailed success message
            this.showSuccess(
                `Thank you, ${formData.name}! Your message has been sent successfully. ` +
                `I'll review your request and get back to you within 24 hours.`,
                'success'
            );
            
            // Reset form only on successful submission
            this.resetFormToDefault();

        } catch (error) {
            console.error('Form submission failed:', error);
            
            // Show detailed user-friendly error messages
            if (error.message.includes('HTTP 422') || error.message.includes('validation')) {
                this.showError(
                    'There was an issue with the information provided. Please check that your email address is valid and all required fields are filled out correctly.',
                    'validation'
                );
            } else if (error.message.includes('HTTP 500')) {
                this.showError(
                    'I\'m experiencing technical difficulties on my end. Please try again in a few minutes, or reach out to me directly via email or social media.',
                    'server'
                );
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showError(
                    'Unable to connect to the server. Please check your internet connection and try again. If the problem persists, feel free to contact me directly.',
                    'network'
                );
            } else if (error.message.includes('timeout')) {
                this.showError(
                    'The request took too long to process. Please try submitting your message again.',
                    'timeout'
                );
            } else {
                this.showError(
                    'Something unexpected happened while sending your message. Please try again, or contact me directly if the issue continues.',
                    'generic'
                );
            }
            
            // Preserve form data on error - don't reset form
            console.log('Form submission failed - preserving user data for retry');

        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
        }
    }

    /**
     * Set submit button loading state
     */
    setSubmitButtonState(loading) {
        const button = this.elements.submitButton;
        const buttonText = button.querySelector('span');
        
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            buttonText.textContent = 'Sending...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            buttonText.textContent = 'Let\'s Talk';
        }
    }

    /**
     * Show success message with enhanced UX
     */
    showSuccess(message, type = 'success') {
        this.elements.statusDiv.style.display = 'block';
        this.elements.successDiv.style.display = 'block';
        this.elements.errorDiv.style.display = 'none';
        
        const messageElement = this.elements.successDiv.querySelector('.success-message');
        messageElement.textContent = message;
        
        // Add visual enhancement with icon
        messageElement.innerHTML = `
            <div class="status-icon">✅</div>
            <div class="status-text">${message}</div>
        `;
        
        // Add success animation class
        this.elements.successDiv.classList.add('fade-in');
        
        // Scroll to success message smoothly
        setTimeout(() => {
            this.elements.statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Auto-hide success message after 8 seconds
        setTimeout(() => {
            this.hideStatus();
        }, 8000);
    }

    /**
     * Show error message with enhanced UX and helpful guidance
     */
    showError(message, type = 'generic') {
        this.elements.statusDiv.style.display = 'block';
        this.elements.successDiv.style.display = 'none';
        this.elements.errorDiv.style.display = 'block';
        
        const messageElement = this.elements.errorDiv.querySelector('.error-message');
        
        // Choose appropriate icon based on error type
        const errorIcons = {
            validation: '⚠️',
            server: '🔧', 
            network: '📡',
            timeout: '⏱️',
            generic: '❌'
        };
        
        const icon = errorIcons[type] || errorIcons.generic;
        
        // Add visual enhancement with icon and structure
        messageElement.innerHTML = `
            <div class="status-icon">${icon}</div>
            <div class="status-text">
                <div class="error-title">${this.getErrorTitle(type)}</div>
                <div class="error-description">${message}</div>
            </div>
        `;
        
        // Add error animation class
        this.elements.errorDiv.classList.add('fade-in');
        
        // Scroll to error message smoothly
        setTimeout(() => {
            this.elements.statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Don't auto-hide error messages - user needs to read them
    }
    
    /**
     * Get appropriate error title based on type
     */
    getErrorTitle(type) {
        const titles = {
            validation: 'Please Check Your Information',
            server: 'Technical Issue',
            network: 'Connection Problem', 
            timeout: 'Request Timeout',
            generic: 'Submission Error'
        };
        
        return titles[type] || titles.generic;
    }

    /**
     * Hide status messages
     */
    hideStatus() {
        this.elements.statusDiv.style.display = 'none';
    }

    /**
     * Clear all field errors
     */
    clearAllFieldErrors() {
        const errorFields = this.form.querySelectorAll('.error');
        errorFields.forEach(field => this.clearFieldError(field));
    }

    /**
     * Reset form to default state (success only)
     */
    resetFormToDefault() {
        // Clear form data
        this.form.reset();
        
        // Clear all field errors
        this.clearAllFieldErrors();
        
        // Reset any custom states
        this.form.classList.remove('was-validated', 'has-errors');
        
        // Clear any previous status animations
        this.elements.successDiv?.classList.remove('fade-in');
        this.elements.errorDiv?.classList.remove('fade-in');
        
        console.log('Form reset to default state after successful submission');
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            formFound: !!this.form,
            apiBaseUrl: this.apiBaseUrl,
            isSubmitting: this.isSubmitting,
            elements: Object.keys(this.elements).reduce((acc, key) => {
                acc[key] = !!this.elements[key];
                return acc;
            }, {})
        };
    }
}

export default ContactForm;