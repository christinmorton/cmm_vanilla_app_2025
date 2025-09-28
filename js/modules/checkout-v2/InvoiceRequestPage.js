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
     * Display customer information (reuse from v1)
     */
    displayCustomerData() {
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
    }

    /**
     * Initialize deposit selection (similar to v1)
     */
    initializeDepositSelection() {
        const depositCards = document.querySelectorAll('.deposit-card');
        const invoiceProcessing = document.getElementById('invoiceProcessing');

        depositCards.forEach(card => {
            const selectBtn = card.querySelector('.deposit-select-btn');
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    const amount = parseInt(card.dataset.amount);
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
                if (invoiceProcessing) {
                    invoiceProcessing.style.display = 'none';
                }
                const depositOptions = document.getElementById('depositOptions');
                if (depositOptions) {
                    depositOptions.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /**
     * Select a deposit amount and update UI (similar to v1)
     */
    selectDeposit(amount) {
        const deposit = this.depositOptions[amount];
        if (!deposit) return;

        this.selectedDeposit = deposit;

        // Update UI elements
        const selectedAmountElement = document.getElementById('selectedAmount');
        const selectedTypeElement = document.getElementById('selectedType');
        const requestBtn = document.getElementById('requestInvoice');

        if (selectedAmountElement) {
            selectedAmountElement.textContent = `$${deposit.amount}`;
        }
        if (selectedTypeElement) {
            selectedTypeElement.textContent = `${deposit.type.charAt(0).toUpperCase() + deposit.type.slice(1)} Deposit`;
        }
        if (requestBtn) {
            requestBtn.disabled = false;
            requestBtn.querySelector('.btn-text').textContent = `Request $${deposit.amount} Invoice`;
        }

        // Update deposit card selection state
        document.querySelectorAll('.deposit-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-amount="${amount}"]`).classList.add('selected');

        // Track deposit selection
        this.trackDepositSelection(deposit);
    }

    /**
     * Clear deposit selection (similar to v1)
     */
    clearDepositSelection() {
        this.selectedDeposit = null;

        const requestBtn = document.getElementById('requestInvoice');
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
        const requestBtn = document.getElementById('requestInvoice');
        if (requestBtn) {
            requestBtn.addEventListener('click', async () => {
                if (this.selectedDeposit) {
                    await this.processInvoiceRequest();
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

            // Create invoice request message
            const invoiceRequestData = {
                type: 'pending_invoice',
                name: this.customerData.name,
                email_address: this.customerData.email !== 'Please provide your email'
                    ? this.customerData.email
                    : this.getEmailFromForm(),
                phone: this.getPhoneFromForm() || '',
                subject: `Invoice Request - ${this.selectedDeposit.name}`,
                simple_message: this.formatDepositMessage(),
                chain_id: this.salesFunnel.generateChainId('invoice'),
                invoice_amount: this.selectedDeposit.amount.toString(),
                invoice_currency: 'USD',
                invoice_description: this.selectedDeposit.name,
                invoice_status: 'pending'
            };

            // Submit through existing SalesFunnelForm system
            const messageResult = await this.salesFunnel.handleFormSubmission('pending_invoice', null, {
                messageData: invoiceRequestData
            });

            if (!messageResult.success) {
                this.handleInvoiceRequestError(messageResult.error);
                return;
            }

            // Create Stripe invoice via API
            const messageId = messageResult.data?.id || messageResult.id;
            if (!messageId) {
                throw new Error('Message ID not found in API response');
            }

            const stripeResult = await this.createStripeInvoice(messageId);

            if (stripeResult.success) {
                this.handleInvoiceRequestSuccess(stripeResult, messageId);
            } else {
                this.handleInvoiceRequestError(stripeResult.error);
            }

        } catch (error) {
            console.error('Invoice request failed:', error);
            this.handleInvoiceRequestError('An unexpected error occurred. Please try again.');
        } finally {
            this.setInvoiceLoadingState(false);
        }
    }

    /**
     * Create Stripe invoice via backend API
     */
    async createStripeInvoice(messageId) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add authentication if available
            if (this.salesFunnel.authManager) {
                const authHeaders = await this.salesFunnel.authManager.getAuthHeaders();
                Object.assign(headers, authHeaders);
            }

            const endpointUrl = this.salesFunnel.authManager
                ? `${this.salesFunnel.authManager.apiBaseUrl}/cmm/v1/create-stripe-invoice`
                : '/wp-json/cmm/v1/create-stripe-invoice';

            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message_id: messageId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to create Stripe invoice');
            }

            return result;

        } catch (error) {
            console.error('Failed to create Stripe invoice:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

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
     * Get form field values
     */
    getEmailFromForm() {
        const emailField = document.getElementById('customerEmailInput');
        return emailField ? emailField.value : '';
    }

    getPhoneFromForm() {
        const phoneField = document.getElementById('customerPhone');
        return phoneField ? phoneField.value : '';
    }

    getCompanyFromForm() {
        const companyField = document.getElementById('customerCompany');
        return companyField ? companyField.value : '';
    }

    getProjectDescriptionFromForm() {
        const descField = document.getElementById('projectDescriptionInput');
        return descField ? descField.value : '';
    }

    /**
     * Set invoice request button loading state
     */
    setInvoiceLoadingState(isLoading) {
        const requestBtn = document.getElementById('requestInvoice');
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
     * Handle successful invoice request
     */
    handleInvoiceRequestSuccess(stripeResult, messageId) {
        // Track successful request
        this.trackInvoiceRequestSuccess();

        // Show success message
        this.showSuccessMessage('Invoice request submitted successfully! Check your email for the invoice.');

        // Redirect to invoice status page
        setTimeout(() => {
            window.location.href = `/invoice-status.html?message_id=${messageId}&invoice_id=${stripeResult.invoice_id}`;
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