/**
 * CustomInvoiceRequest.js
 * Handles custom amount invoice requests with detailed project information
 * Creates pending_invoice messages for custom services
 */

import SalesFunnelForm from '../SalesFunnelForm.js';

class CustomInvoiceRequest {
    constructor() {
        this.salesFunnel = null;
        this.customerData = null;
        this.minAmount = 50;
        this.maxAmount = 5000;

        this.init();
    }

    async init() {
        try {
            // Initialize sales funnel with analytics tracking
            this.salesFunnel = new SalesFunnelForm({
                analyticsTracker: window.analyticsTracker
            });

            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.loadCustomerData();
            this.initializeFormValidation();
            this.initializeCustomInvoiceHandlers();
            this.trackPageView();

            console.log('CustomInvoiceRequest initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CustomInvoiceRequest:', error);
            this.showErrorMessage('Failed to load custom invoice page. Please refresh and try again.');
        }
    }

    /**
     * Load customer data from URL parameters
     */
    loadCustomerData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const messageId = urlParams.get('message_id');
            const chainId = urlParams.get('chain_id');

            this.customerData = {
                messageId: messageId,
                chainId: chainId,
                name: urlParams.get('name') || '',
                email: urlParams.get('email') || '',
                projectType: urlParams.get('project_type') || 'Custom Service',
                submissionDate: new Date().toLocaleDateString()
            };

            this.prefillFormData();
        } catch (error) {
            console.error('Failed to load customer data:', error);
            this.customerData = {
                messageId: null,
                chainId: null,
                name: '',
                email: '',
                projectType: 'Custom Service',
                submissionDate: new Date().toLocaleDateString()
            };
        }
    }

    /**
     * Prefill form with customer data if available
     */
    prefillFormData() {
        const nameField = document.getElementById('customerName');
        const emailField = document.getElementById('customerEmailInput');

        if (nameField && this.customerData.name) {
            nameField.value = this.customerData.name;
        }
        if (emailField && this.customerData.email) {
            emailField.value = this.customerData.email;
        }
    }

    /**
     * Initialize form validation
     */
    initializeFormValidation() {
        const amountField = document.getElementById('invoiceAmount');
        const serviceField = document.getElementById('serviceDescription');
        const form = document.getElementById('customInvoiceForm');

        // Amount validation
        if (amountField) {
            amountField.addEventListener('input', () => {
                this.validateAmount(amountField);
                this.updateSubmitButton();
            });

            amountField.addEventListener('blur', () => {
                this.validateAmount(amountField);
            });
        }

        // Service description validation
        if (serviceField) {
            serviceField.addEventListener('input', () => {
                this.validateServiceDescription(serviceField);
                this.updateSubmitButton();
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Real-time validation
        const requiredFields = form?.querySelectorAll('[required]');
        requiredFields?.forEach(field => {
            field.addEventListener('input', () => {
                this.updateSubmitButton();
            });
        });
    }

    /**
     * Validate invoice amount
     */
    validateAmount(amountField) {
        const amount = parseFloat(amountField.value);
        const errorElement = document.getElementById('amountError');

        let errorMessage = '';

        if (isNaN(amount) || amount <= 0) {
            errorMessage = 'Please enter a valid amount';
        } else if (amount < this.minAmount) {
            errorMessage = `Minimum amount is $${this.minAmount}`;
        } else if (amount > this.maxAmount) {
            errorMessage = `Maximum amount is $${this.maxAmount}`;
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        if (errorMessage) {
            amountField.classList.add('form-error');
        } else {
            amountField.classList.remove('form-error');
        }

        return !errorMessage;
    }

    /**
     * Validate service description
     */
    validateServiceDescription(serviceField) {
        const description = serviceField.value.trim();
        const errorElement = document.getElementById('serviceError');

        let errorMessage = '';

        if (description.length < 10) {
            errorMessage = 'Please provide at least 10 characters describing the service';
        } else if (description.length > 100) {
            errorMessage = 'Service description must be 100 characters or less';
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        if (errorMessage) {
            serviceField.classList.add('form-error');
        } else {
            serviceField.classList.remove('form-error');
        }

        return !errorMessage;
    }

    /**
     * Update submit button state based on form validation
     */
    updateSubmitButton() {
        const submitBtn = document.getElementById('submitCustomInvoice');
        const form = document.getElementById('customInvoiceForm');

        if (!submitBtn || !form) return;

        const requiredFields = form.querySelectorAll('[required]');
        const amountField = document.getElementById('invoiceAmount');
        const serviceField = document.getElementById('serviceDescription');

        let isValid = true;

        // Check required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
        });

        // Check amount validation
        if (amountField && !this.validateAmount(amountField)) {
            isValid = false;
        }

        // Check service description validation
        if (serviceField && !this.validateServiceDescription(serviceField)) {
            isValid = false;
        }

        submitBtn.disabled = !isValid;

        if (isValid) {
            const amount = parseFloat(amountField?.value || 0);
            submitBtn.querySelector('.btn-text').textContent = `Submit $${amount} Request`;
        } else {
            submitBtn.querySelector('.btn-text').textContent = 'Complete Required Fields';
        }
    }

    /**
     * Initialize custom invoice request handlers
     */
    initializeCustomInvoiceHandlers() {
        const submitBtn = document.getElementById('submitCustomInvoice');
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                await this.handleFormSubmission();
            });
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmission() {
        try {
            // Final validation
            if (!this.validateForm()) {
                this.showErrorMessage('Please correct the errors in the form before submitting.');
                return;
            }

            // Show loading state
            this.setSubmitLoadingState(true);

            // Extract form data
            const formData = this.extractFormData();

            // Track custom invoice request attempt
            this.trackCustomInvoiceRequest(formData);

            // Create custom invoice request message
            const customInvoiceData = {
                type: 'pending_invoice',
                name: formData.customerName,
                email_address: formData.customerEmail,
                email: formData.customerEmail, // Also add 'email' field for WordPress compatibility
                phone: formData.customerPhone || '',
                subject: `Custom Invoice Request - ${formData.serviceDescription}`,
                detailed_message: this.formatCustomInvoiceHTML(formData),
                chain_id: this.salesFunnel.generateChainId('custom_invoice'),
                invoice_amount: formData.amount.toString(),
                invoice_currency: 'USD',
                invoice_description: formData.serviceDescription,
                invoice_status: 'pending'
            };

            // Log the payload for debugging
            console.log('Submitting custom invoice request with data:', customInvoiceData);
            console.log('Email fields being sent:', {
                email: customInvoiceData.email,
                email_address: customInvoiceData.email_address
            });

            // Submit through existing SalesFunnelForm system
            const messageResult = await this.salesFunnel.handleFormSubmission('pending_invoice', null, {
                messageData: customInvoiceData
            });

            if (!messageResult.success) {
                this.handleCustomInvoiceError(messageResult.error);
                return;
            }

            // Success - customer data and invoice request saved
            const messageId = messageResult.data?.id || messageResult.id;
            if (!messageId) {
                throw new Error('Message ID not found in API response');
            }

            // Handle success without automatic Stripe invoice creation
            this.handleCustomInvoiceSuccess(null, messageId, formData);

        } catch (error) {
            console.error('Custom invoice request failed:', error);
            this.handleCustomInvoiceError('An unexpected error occurred. Please try again.');
        } finally {
            this.setSubmitLoadingState(false);
        }
    }

    /**
     * Validate entire form
     */
    validateForm() {
        const amountField = document.getElementById('invoiceAmount');
        const serviceField = document.getElementById('serviceDescription');
        const form = document.getElementById('customInvoiceForm');

        let isValid = true;

        // Validate amount
        if (amountField && !this.validateAmount(amountField)) {
            isValid = false;
        }

        // Validate service description
        if (serviceField && !this.validateServiceDescription(serviceField)) {
            isValid = false;
        }

        // Validate required fields
        const requiredFields = form?.querySelectorAll('[required]');
        requiredFields?.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('form-error');
                isValid = false;
            } else {
                field.classList.remove('form-error');
            }
        });

        return isValid;
    }

    /**
     * Extract form data
     */
    extractFormData() {
        return {
            customerName: document.getElementById('customerName')?.value.trim() || '',
            customerEmail: document.getElementById('customerEmailInput')?.value.trim() || '',
            customerPhone: document.getElementById('customerPhone')?.value.trim() || '',
            company: document.getElementById('customerCompany')?.value.trim() || '',
            amount: parseFloat(document.getElementById('invoiceAmount')?.value || 0),
            serviceDescription: document.getElementById('serviceDescription')?.value.trim() || '',
            projectDetails: document.getElementById('projectDetails')?.value.trim() || '',
            expectedStart: document.getElementById('expectedStart')?.value || '',
            expectedCompletion: document.getElementById('expectedCompletion')?.value || ''
        };
    }

    /**
     * Format custom invoice data as HTML for detailed_message
     */
    formatCustomInvoiceHTML(formData) {
        return `
            <div class="custom-invoice-request">
                <h4>Custom Service Invoice Request</h4>
                <p><strong>Service:</strong> ${formData.serviceDescription}</p>
                <p><strong>Amount:</strong> $${formData.amount} USD</p>
                <p><strong>Company:</strong> ${formData.company || 'Not specified'}</p>

                <h4>Project Details</h4>
                <div class="project-details">
                    ${formData.projectDetails || 'No additional details provided'}
                </div>

                <h4>Timeline</h4>
                <p><strong>Expected Start:</strong> ${formData.expectedStart || 'Flexible'}</p>
                <p><strong>Expected Completion:</strong> ${formData.expectedCompletion || 'To be discussed'}</p>

                <h4>Contact Information</h4>
                <p><strong>Name:</strong> ${formData.customerName}</p>
                <p><strong>Email:</strong> ${formData.customerEmail}</p>
                <p><strong>Phone:</strong> ${formData.customerPhone || 'Not provided'}</p>
            </div>
        `;
    }

    // Stripe invoice creation removed - now using manual processing workflow

    /**
     * Set submit button loading state
     */
    setSubmitLoadingState(isLoading) {
        const submitBtn = document.getElementById('submitCustomInvoice');
        const btnText = submitBtn?.querySelector('.btn-text');
        const spinner = submitBtn?.querySelector('.btn-loading-spinner');

        if (submitBtn) {
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                if (btnText) btnText.style.display = 'none';
                if (spinner) spinner.style.display = 'inline-block';
            } else {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                if (btnText) btnText.style.display = 'inline';
                if (spinner) spinner.style.display = 'none';
            }
        }
    }

    /**
     * Handle successful custom invoice request (Simplified - Manual Processing)
     */
    handleCustomInvoiceSuccess(stripeResult, messageId, formData) {
        // Track successful request
        this.trackCustomInvoiceSuccess(formData);

        // Show success message
        this.showSuccessMessage('Custom invoice request submitted successfully! We will send your invoice within 1 business day.');

        // Redirect to a simplified thank you page
        setTimeout(() => {
            const successUrl = new URL('/thank-you.html', window.location.origin);
            successUrl.searchParams.set('type', 'custom_invoice_request');
            successUrl.searchParams.set('message_id', messageId);
            successUrl.searchParams.set('amount', formData.amount);
            successUrl.searchParams.set('service_description', formData.serviceDescription);
            successUrl.searchParams.set('customer_email', formData.customerEmail);

            window.location.href = successUrl.toString();
        }, 2000);
    }

    /**
     * Handle custom invoice request error
     */
    handleCustomInvoiceError(error) {
        console.error('Custom invoice request error:', error);

        // Track failed request
        this.trackCustomInvoiceError();

        // Show error message
        this.showErrorMessage('Failed to submit custom invoice request. Please try again.');
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'notification error';
            errorDiv.textContent = message;
            notificationContainer.appendChild(errorDiv);

            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    /**
     * Show success message to user
     */
    showSuccessMessage(message) {
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            const successDiv = document.createElement('div');
            successDiv.className = 'notification success';
            successDiv.textContent = message;
            notificationContainer.appendChild(successDiv);

            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 5000);
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'custom-invoice-request',
                funnel_stage: 'custom_invoice_request',
                customer_message_id: this.customerData?.messageId || null
            });
        }
    }

    /**
     * Track custom invoice request attempt
     */
    trackCustomInvoiceRequest(formData) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('custom_invoice_requested', {
                invoice_amount: formData.amount,
                service_description: formData.serviceDescription,
                payment_method: 'stripe_invoice',
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'custom_invoice_processing'
            });
        }
    }

    /**
     * Track successful custom invoice request
     */
    trackCustomInvoiceSuccess(formData) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('custom_invoice_request_success', {
                invoice_amount: formData.amount,
                service_description: formData.serviceDescription,
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'custom_invoice_sent'
            });
        }
    }

    /**
     * Track failed custom invoice request
     */
    trackCustomInvoiceError() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('custom_invoice_request_failed', {
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'custom_invoice_processing'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CustomInvoiceRequest();
});

export default CustomInvoiceRequest;