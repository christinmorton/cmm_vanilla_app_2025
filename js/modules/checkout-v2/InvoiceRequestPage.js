/**
 * InvoiceRequestPage.js
 * Handles invoice request functionality for standard deposits
 * Creates pending_invoice messages and triggers Stripe Invoice API
 */

import SalesFunnelForm from '../SalesFunnelForm.js';

class InvoiceRequestPage {
    constructor() {
        this.salesFunnel = null;
        this.selectedDeposit = null;
        this.customerData = null;

        // Initialize deposit configuration - same as v1 but for invoices
        this.depositOptions = {};
        this.initializeDepositOptions();

        this.init();
    }

    /**
     * Initialize deposit options (reuse from v1)
     */
    initializeDepositOptions() {
        this.depositOptions = {
            99: {
                amount: 99,
                type: 'starter',
                name: 'Web Development Starter Deposit',
                description: 'Perfect for small projects and consultations'
            },
            250: {
                amount: 250,
                type: 'standard',
                name: 'Web Development Standard Deposit',
                description: 'Ideal for medium-sized web development projects'
            },
            500: {
                amount: 500,
                type: 'premium',
                name: 'Web Development Premium Deposit',
                description: 'Best for complex projects and full-scale development'
            },
            50: {
                amount: 50,
                type: 'consultation',
                name: 'Professional Consultation Deposit',
                description: 'Refundable consultation service deposit'
            }
        };
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
            this.initializeDepositSelection();
            this.initializeInvoiceRequestHandlers();
            this.trackPageView();

            console.log('InvoiceRequestPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize InvoiceRequestPage:', error);
            this.showErrorMessage('Failed to load invoice request page. Please refresh and try again.');
        }
    }

    /**
     * Load customer data (reuse from v1)
     */
    loadCustomerData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const messageId = urlParams.get('message_id');
            const chainId = urlParams.get('chain_id');

            if (messageId) {
                this.customerData = {
                    messageId: messageId,
                    chainId: chainId,
                    name: urlParams.get('name') || 'Valued Customer',
                    email: urlParams.get('email') || 'customer@example.com',
                    projectType: urlParams.get('project_type') || 'Web Development Project',
                    submissionDate: new Date().toLocaleDateString()
                };
            } else {
                this.customerData = {
                    messageId: null,
                    chainId: null,
                    name: 'Valued Customer',
                    email: 'Please provide your email',
                    projectType: 'Web Development Project',
                    submissionDate: new Date().toLocaleDateString()
                };
            }

            this.displayCustomerData();
        } catch (error) {
            console.error('Failed to load customer data:', error);
            this.customerData = {
                name: 'Valued Customer',
                email: 'customer@example.com',
                projectType: 'Web Development Project',
                submissionDate: new Date().toLocaleDateString()
            };
            this.displayCustomerData();
        }
    }

    /**
     * Display customer information or show form for data collection
     */
    displayCustomerData() {
        // Check if we have valid customer data from URL parameters
        const hasValidCustomerData = this.customerData.messageId &&
                                    this.customerData.email !== 'Please provide your email';

        if (hasValidCustomerData) {
            // Display existing customer data
            this.displayExistingCustomerData();
        } else {
            // Show form to collect customer data
            this.displayCustomerDataForm();
        }
    }

    /**
     * Display existing customer data (from URL parameters)
     */
    displayExistingCustomerData() {
        const nameElement = document.getElementById('customerName');
        const emailElement = document.getElementById('customerEmail');
        const projectElement = document.getElementById('customerProject');
        const descriptionElement = document.getElementById('projectDescription');
        const typeElement = document.getElementById('projectType');
        const dateElement = document.getElementById('submissionDate');

        if (nameElement) nameElement.textContent = this.customerData.name;
        if (emailElement) emailElement.textContent = this.customerData.email;
        if (projectElement) projectElement.textContent = `${this.customerData.projectType} Invoice`;
        if (descriptionElement) {
            descriptionElement.textContent = `Request an invoice for your ${this.customerData.projectType.toLowerCase()} to receive professional billing and payment terms.`;
        }
        if (typeElement) typeElement.textContent = `Project Type: ${this.customerData.projectType}`;
        if (dateElement) dateElement.textContent = `Submitted: ${this.customerData.submissionDate}`;

        // Hide customer data form if it exists
        const customerForm = document.getElementById('customerDataForm');
        if (customerForm) customerForm.style.display = 'none';
    }

    /**
     * Display form to collect required customer data
     */
    displayCustomerDataForm() {
        // Try to find existing customer data form container
        let customerFormContainer = document.getElementById('customerDataForm');

        if (!customerFormContainer) {
            // Create customer data form if it doesn't exist
            customerFormContainer = document.createElement('div');
            customerFormContainer.id = 'customerDataForm';
            customerFormContainer.className = 'customer-data-form';

            // Insert after customer info section or at beginning of main content
            const customerInfoSection = document.getElementById('customerInfo');
            const mainContent = document.querySelector('.checkout-main, main, .container');

            if (customerInfoSection && customerInfoSection.parentNode) {
                customerInfoSection.parentNode.insertBefore(customerFormContainer, customerInfoSection.nextSibling);
            } else if (mainContent) {
                mainContent.insertBefore(customerFormContainer, mainContent.firstChild);
            } else {
                document.body.appendChild(customerFormContainer);
            }
        }

        // Create the form HTML
        customerFormContainer.innerHTML = `
            <div class="customer-data-card">
                <h3>Contact Information</h3>
                <p class="form-description">Please provide your contact details to receive your invoice.</p>

                <div class="form-grid">
                    <div class="form-group">
                        <label for="customerNameInput">Full Name *</label>
                        <input type="text" id="customerNameInput" name="customerName" required
                               placeholder="Enter your full name" class="form-control">
                        <div class="form-error-message" id="nameError"></div>
                    </div>

                    <div class="form-group">
                        <label for="customerEmailInput">Email Address *</label>
                        <input type="email" id="customerEmailInput" name="customerEmail" required
                               placeholder="Enter your email address" class="form-control">
                        <div class="form-error-message" id="emailError"></div>
                        <small class="form-help">Your invoice will be sent to this email address</small>
                    </div>

                    <div class="form-group">
                        <label for="customerPhone">Phone Number</label>
                        <input type="tel" id="customerPhone" name="customerPhone"
                               placeholder="(Optional) Your phone number" class="form-control">
                    </div>

                    <div class="form-group">
                        <label for="customerCompany">Company/Organization</label>
                        <input type="text" id="customerCompany" name="customerCompany"
                               placeholder="(Optional) Company name" class="form-control">
                    </div>

                            <div class="col-12 mb-3">
                                <label for="projectDescriptionInput" class="form-label">Project Description</label>
                                <textarea id="projectDescriptionInput" name="projectDescription" rows="3"
                                          placeholder="(Optional) Brief description of your project needs" class="form-control"></textarea>
                                <small class="form-text text-muted">Help us prepare a more accurate invoice</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show the form
        customerFormContainer.style.display = 'block';

        // Add form validation
        this.initializeCustomerDataFormValidation();

        // Update customer display when form data changes
        this.attachFormChangeListeners();

        // Hide existing customer info display
        const customerInfoElements = ['customerName', 'customerEmail', 'customerProject', 'projectDescription', 'projectType', 'submissionDate'];
        customerInfoElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    /**
     * Initialize validation for customer data form
     */
    initializeCustomerDataFormValidation() {
        const nameInput = document.getElementById('customerNameInput');
        const emailInput = document.getElementById('customerEmailInput');

        // Real-time validation
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                this.validateCustomerName(nameInput);
                this.updateDepositButtonState();
            });
            nameInput.addEventListener('blur', () => this.validateCustomerName(nameInput));
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.validateCustomerEmail(emailInput);
                this.updateDepositButtonState();
            });
            emailInput.addEventListener('blur', () => this.validateCustomerEmail(emailInput));
        }

        // Initial button state update
        setTimeout(() => this.updateDepositButtonState(), 100);
    }

    /**
     * Attach form change listeners to update customer display
     */
    attachFormChangeListeners() {
        const nameInput = document.getElementById('customerNameInput');
        const emailInput = document.getElementById('customerEmailInput');
        const phoneInput = document.getElementById('customerPhone');
        const companyInput = document.getElementById('customerCompany');

        const updateCustomerDisplay = () => {
            // Update internal customer data
            if (nameInput && nameInput.value.trim()) {
                this.customerData.name = nameInput.value.trim();
            }
            if (emailInput && emailInput.value.trim()) {
                this.customerData.email = emailInput.value.trim();
            }

            // Update displayed customer information if elements exist
            const customerNameEl = document.getElementById('customerName');
            const customerEmailEl = document.getElementById('customerEmail');

            if (customerNameEl) customerNameEl.textContent = this.customerData.name;
            if (customerEmailEl) customerEmailEl.textContent = this.customerData.email;

            console.log('Customer data updated:', this.customerData);
        };

        // Add change listeners
        [nameInput, emailInput, phoneInput, companyInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updateCustomerDisplay);
                input.addEventListener('change', updateCustomerDisplay);
            }
        });
    }

    /**
     * Validate customer name
     */
    validateCustomerName(nameInput) {
        const name = nameInput.value.trim();
        const errorElement = document.getElementById('nameError');

        let errorMessage = '';
        if (name.length < 2) {
            errorMessage = 'Please enter your full name';
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        if (errorMessage) {
            nameInput.classList.add('is-invalid');
            nameInput.classList.remove('is-valid');
        } else {
            nameInput.classList.add('is-valid');
            nameInput.classList.remove('is-invalid');
        }

        return !errorMessage;
    }

    /**
     * Validate customer email
     */
    validateCustomerEmail(emailInput) {
        const email = emailInput.value.trim();
        const errorElement = document.getElementById('emailError');

        let errorMessage = '';
        if (!email) {
            errorMessage = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorMessage = 'Please enter a valid email address';
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }

        if (errorMessage) {
            emailInput.classList.add('is-invalid');
            emailInput.classList.remove('is-valid');
        } else {
            emailInput.classList.add('is-valid');
            emailInput.classList.remove('is-invalid');
        }

        return !errorMessage;
    }

    /**
     * Update deposit button state based on form validation
     */
    updateDepositButtonState() {
        const customerForm = document.getElementById('customerDataForm');
        if (!customerForm || customerForm.style.display === 'none') {
            return; // No form visible, no additional validation needed
        }

        const nameInput = document.getElementById('customerNameInput');
        const emailInput = document.getElementById('customerEmailInput');
        const requestBtn = document.getElementById('proceedToPayment');

        if (!nameInput || !emailInput || !requestBtn) return;

        // Check validation without calling validation methods (to avoid recursion)
        const isNameValid = nameInput.value.trim().length >= 2;
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
        const hasDepositSelected = this.selectedDeposit !== null;

        const isFormValid = isNameValid && isEmailValid && hasDepositSelected;

        // Only enable the button if form is valid AND deposit is selected
        if (hasDepositSelected) {
            requestBtn.disabled = !isFormValid;
            if (isFormValid) {
                requestBtn.querySelector('.btn-text').textContent = `Submit $${this.selectedDeposit.amount} Request`;
            } else {
                requestBtn.querySelector('.btn-text').textContent = 'Complete Required Fields';
            }
        }
    }

    /**
     * Initialize deposit selection (similar to v1)
     */
    initializeDepositSelection() {
        const depositCards = document.querySelectorAll('.deposit-card');
        const invoiceProcessing = document.getElementById('paymentProcessing');

        console.log('Found', depositCards.length, 'deposit cards');

        depositCards.forEach(card => {
            const selectBtn = card.querySelector('.deposit-select-btn');
            console.log('Deposit card:', card.dataset.amount, 'has button:', !!selectBtn);

            if (selectBtn) {
                selectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const amount = parseInt(card.dataset.amount);
                    console.log('Deposit selected:', amount);
                    this.selectDeposit(amount);

                    // Show invoice processing section
                    if (invoiceProcessing) {
                        invoiceProcessing.style.display = 'block';
                        invoiceProcessing.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        });

        // Change deposit button
        const changeDepositBtn = document.getElementById('changeDeposit');
        if (changeDepositBtn) {
            changeDepositBtn.addEventListener('click', () => {
                this.clearDepositSelection();
                const paymentProcessing = document.getElementById('paymentProcessing');
                if (paymentProcessing) {
                    paymentProcessing.style.display = 'none';
                }
                const depositOptions = document.getElementById('depositOptions');
                if (depositOptions) {
                    depositOptions.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /**
     * Select a deposit amount and update UI (enhanced for form validation)
     */
    selectDeposit(amount) {
        const deposit = this.depositOptions[amount];
        if (!deposit) return;

        this.selectedDeposit = deposit;

        // Update UI elements
        const selectedAmountElement = document.getElementById('selectedAmount');
        const selectedTypeElement = document.getElementById('selectedType');
        const requestBtn = document.getElementById('proceedToPayment');

        if (selectedAmountElement) {
            selectedAmountElement.textContent = `$${deposit.amount}`;
        }
        if (selectedTypeElement) {
            selectedTypeElement.textContent = `${deposit.type.charAt(0).toUpperCase() + deposit.type.slice(1)} Deposit`;
        }

        // Update deposit card selection state
        document.querySelectorAll('.deposit-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-amount="${amount}"]`).classList.add('selected');

        // Update button state based on form validation
        this.updateDepositButtonState();

        // If no customer form is visible, enable button immediately
        const customerForm = document.getElementById('customerDataForm');
        if (!customerForm || customerForm.style.display === 'none') {
            if (requestBtn) {
                requestBtn.disabled = false;
                requestBtn.querySelector('.btn-text').textContent = `Submit $${deposit.amount} Request`;
            }
        }

        // Track deposit selection
        this.trackDepositSelection(deposit);
    }

    /**
     * Clear deposit selection (similar to v1)
     */
    clearDepositSelection() {
        this.selectedDeposit = null;

        const requestBtn = document.getElementById('proceedToPayment');
        const selectedAmountElement = document.getElementById('selectedAmount');
        const selectedTypeElement = document.getElementById('selectedType');

        if (requestBtn) {
            requestBtn.disabled = true;
            requestBtn.querySelector('.btn-text').textContent = 'Select a Deposit Amount';
        }
        if (selectedAmountElement) {
            selectedAmountElement.textContent = '$0';
        }
        if (selectedTypeElement) {
            selectedTypeElement.textContent = 'No deposit selected';
        }

        // Remove selection state from cards
        document.querySelectorAll('.deposit-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    /**
     * Initialize invoice request handlers
     */
    initializeInvoiceRequestHandlers() {
        const requestBtn = document.getElementById('proceedToPayment');
        console.log('Request button found:', !!requestBtn);
        if (requestBtn) {
            requestBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Request button clicked, selected deposit:', this.selectedDeposit);
                if (this.selectedDeposit) {
                    await this.processInvoiceRequest();
                } else {
                    console.log('No deposit selected');
                }
            });
        }
    }

    /**
     * Process the invoice request by creating a pending_invoice message
     */
    async processInvoiceRequest() {
        if (!this.selectedDeposit) return;

        try {
            // Show loading state
            this.setInvoiceLoadingState(true);

            // Track invoice request attempt
            this.trackInvoiceRequest(this.selectedDeposit);

            // Get customer data from form or URL parameters
            const customerSubmissionData = this.getCustomerDataForSubmission();

            // Validate that we have required data
            if (!customerSubmissionData.name || !customerSubmissionData.email) {
                this.handleInvoiceRequestError('Please provide your name and email address.');
                return;
            }

            // Create invoice request message
            const invoiceRequestData = {
                type: 'pending_invoice',
                name: customerSubmissionData.name,
                email_address: customerSubmissionData.email,
                email: customerSubmissionData.email, // Also add 'email' field for WordPress compatibility
                phone: customerSubmissionData.phone || '',
                subject: `Invoice Request - ${this.selectedDeposit.name}`,
                simple_message: this.formatDepositMessageWithData(customerSubmissionData),
                chain_id: this.salesFunnel.generateChainId('invoice'),
                invoice_amount: this.selectedDeposit.amount.toString(),
                invoice_currency: 'USD',
                invoice_description: this.selectedDeposit.name,
                invoice_status: 'pending'
            };

            // Log the payload for debugging
            console.log('Submitting invoice request with data:', invoiceRequestData);
            console.log('Email fields being sent:', {
                email: invoiceRequestData.email,
                email_address: invoiceRequestData.email_address
            });

            // Submit through existing SalesFunnelForm system
            const messageResult = await this.salesFunnel.handleFormSubmission('pending_invoice', null, {
                messageData: invoiceRequestData
            });

            if (!messageResult.success) {
                this.handleInvoiceRequestError(messageResult.error);
                return;
            }

            // Success - customer data and invoice request saved
            console.log('Message result:', messageResult);
            const messageId = messageResult.data?.id || messageResult.id;
            console.log('Extracted message ID:', messageId, 'Type:', typeof messageId);

            if (!messageId) {
                throw new Error('Message ID not found in API response');
            }

            // Ensure message ID is a string
            const messageIdString = String(messageId);
            console.log('Message ID as string:', messageIdString);

            // Handle success without automatic Stripe invoice creation
            this.handleInvoiceRequestSuccess(null, messageIdString);

        } catch (error) {
            console.error('Invoice request failed:', error);
            this.handleInvoiceRequestError('An unexpected error occurred. Please try again.');
        } finally {
            this.setInvoiceLoadingState(false);
        }
    }

    // Stripe invoice creation removed - now using manual processing workflow

    /**
     * Format deposit message for simple_message field
     */
    formatDepositMessage() {
        const company = this.getCompanyFromForm();
        const projectDescription = this.getProjectDescriptionFromForm();

        return `Deposit Type: ${this.selectedDeposit.type}, Amount: $${this.selectedDeposit.amount}, ` +
               `Company: ${company || 'N/A'}, Project Description: ${projectDescription || 'Not specified'}`;
    }

    /**
     * Format deposit message with specific customer data
     */
    formatDepositMessageWithData(customerData) {
        return `Deposit Type: ${this.selectedDeposit.type}, Amount: $${this.selectedDeposit.amount}, ` +
               `Company: ${customerData.company || 'N/A'}, Project Description: ${customerData.projectDescription || 'Not specified'}`;
    }

    /**
     * Get form field values (enhanced to handle customer data form)
     */
    getNameFromForm() {
        const nameField = document.getElementById('customerNameInput');
        return nameField ? nameField.value.trim() : '';
    }

    getEmailFromForm() {
        const emailField = document.getElementById('customerEmailInput');
        return emailField ? emailField.value.trim() : '';
    }

    getPhoneFromForm() {
        const phoneField = document.getElementById('customerPhone');
        return phoneField ? phoneField.value.trim() : '';
    }

    getCompanyFromForm() {
        const companyField = document.getElementById('customerCompany');
        return companyField ? companyField.value.trim() : '';
    }

    getProjectDescriptionFromForm() {
        const descField = document.getElementById('projectDescriptionInput');
        return descField ? descField.value.trim() : '';
    }

    /**
     * Get customer data for invoice submission (from form or URL params)
     */
    getCustomerDataForSubmission() {
        const customerForm = document.getElementById('customerDataForm');
        const isFormVisible = customerForm && customerForm.style.display !== 'none';

        if (isFormVisible) {
            // Use data from the customer form
            return {
                name: this.getNameFromForm() || this.customerData.name,
                email: this.getEmailFromForm() || this.customerData.email,
                phone: this.getPhoneFromForm(),
                company: this.getCompanyFromForm(),
                projectDescription: this.getProjectDescriptionFromForm()
            };
        } else {
            // Use data from URL parameters
            return {
                name: this.customerData.name,
                email: this.customerData.email,
                phone: '',
                company: '',
                projectDescription: ''
            };
        }
    }

    /**
     * Set invoice request button loading state
     */
    setInvoiceLoadingState(isLoading) {
        const requestBtn = document.getElementById('proceedToPayment');
        const btnText = requestBtn?.querySelector('.btn-text');
        const spinner = requestBtn?.querySelector('.btn-loading-spinner');

        if (requestBtn) {
            if (isLoading) {
                requestBtn.disabled = true;
                requestBtn.classList.add('btn-loading');
                if (btnText) btnText.style.display = 'none';
                if (spinner) spinner.style.display = 'inline-block';
            } else {
                requestBtn.disabled = false;
                requestBtn.classList.remove('btn-loading');
                if (btnText) btnText.style.display = 'inline';
                if (spinner) spinner.style.display = 'none';
            }
        }
    }

    /**
     * Handle successful invoice request (Simplified - Manual Processing)
     */
    handleInvoiceRequestSuccess(stripeResult, messageId) {
        // Track successful request
        this.trackInvoiceRequestSuccess();

        // Show success message
        this.showSuccessMessage('Deposit request submitted successfully! We will send your invoice within 1 business day.');

        // Redirect to a simplified thank you page
        setTimeout(() => {
            const successUrl = new URL('/thank-you.html', window.location.origin);
            successUrl.searchParams.set('type', 'deposit_request');
            successUrl.searchParams.set('message_id', messageId);
            successUrl.searchParams.set('amount', this.selectedDeposit.amount);
            successUrl.searchParams.set('deposit_type', this.selectedDeposit.type);
            successUrl.searchParams.set('customer_email', this.getCustomerDataForSubmission().email);
            successUrl.searchParams.set('service_name', this.selectedDeposit.name);

            window.location.href = successUrl.toString();
        }, 2000);
    }

    /**
     * Handle invoice request error
     */
    handleInvoiceRequestError(error) {
        console.error('Invoice request error:', error);

        // Track failed request
        this.trackInvoiceRequestError();

        // Show error message
        this.showErrorMessage('Failed to submit invoice request. Please try again.');
    }

    /**
     * Show error message to user (reuse from v1)
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
     * Show success message to user (reuse from v1)
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
                page: 'invoice-request',
                funnel_stage: 'invoice_request',
                customer_message_id: this.customerData?.messageId || null
            });
        }
    }

    /**
     * Track deposit selection for analytics
     */
    trackDepositSelection(deposit) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('deposit_selected', {
                deposit_amount: deposit.amount,
                deposit_type: deposit.type,
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'invoice_deposit_selection'
            });
        }
    }

    /**
     * Track invoice request attempt
     */
    trackInvoiceRequest(deposit) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('invoice_requested', {
                deposit_amount: deposit.amount,
                deposit_type: deposit.type,
                payment_method: 'stripe_invoice',
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'invoice_processing'
            });
        }
    }

    /**
     * Track successful invoice request
     */
    trackInvoiceRequestSuccess() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('invoice_request_success', {
                deposit_amount: this.selectedDeposit?.amount || null,
                deposit_type: this.selectedDeposit?.type || null,
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'invoice_sent'
            });
        }
    }

    /**
     * Track failed invoice request
     */
    trackInvoiceRequestError() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('invoice_request_failed', {
                deposit_amount: this.selectedDeposit?.amount || null,
                deposit_type: this.selectedDeposit?.type || null,
                customer_message_id: this.customerData?.messageId || null,
                funnel_stage: 'invoice_processing'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceRequestPage();
});

export default InvoiceRequestPage;