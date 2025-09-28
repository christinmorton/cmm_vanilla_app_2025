/**
 * InvoiceStatusPage.js
 * Tracks and displays the status of pending invoices
 * Polls message status and shows real-time updates
 */

import SalesFunnelForm from '../SalesFunnelForm.js';

class InvoiceStatusPage {
    constructor() {
        this.salesFunnel = null;
        this.messageId = null;
        this.invoiceId = null;
        this.invoiceType = 'standard';
        this.pollInterval = null;
        this.maxPolls = 60; // 5 minutes with 5-second intervals
        this.currentPoll = 0;

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

            this.extractURLParameters();
            this.initializeStatusDisplay();
            this.startStatusTracking();
            this.trackPageView();

            console.log('InvoiceStatusPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize InvoiceStatusPage:', error);
            this.displayErrorState();
        }
    }

    /**
     * Extract invoice information from URL parameters
     */
    extractURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        this.messageId = urlParams.get('message_id');
        this.invoiceId = urlParams.get('invoice_id');
        this.invoiceType = urlParams.get('type') || 'standard';

        if (!this.messageId) {
            throw new Error('Message ID is required to track invoice status');
        }

        console.log('Invoice tracking info:', {
            messageId: this.messageId,
            invoiceId: this.invoiceId,
            type: this.invoiceType
        });
    }

    /**
     * Initialize the status display
     */
    initializeStatusDisplay() {
        this.updateInvoiceInfo();
        this.showStatus('Checking invoice status...', 'pending');
    }

    /**
     * Update invoice information display
     */
    updateInvoiceInfo() {
        const invoiceIdElement = document.getElementById('displayInvoiceId');
        const invoiceTypeElement = document.getElementById('displayInvoiceType');

        if (invoiceIdElement && this.invoiceId) {
            invoiceIdElement.textContent = this.invoiceId.substring(0, 20) + '...';
        }

        if (invoiceTypeElement) {
            const typeDisplay = this.invoiceType === 'custom' ? 'Custom Service' : 'Standard Deposit';
            invoiceTypeElement.textContent = typeDisplay;
        }
    }

    /**
     * Start tracking invoice status
     */
    async startStatusTracking() {
        // Initial check
        await this.checkInvoiceStatus();

        // Start polling
        this.pollInterval = setInterval(async () => {
            await this.checkInvoiceStatus();
        }, 5000);
    }

    /**
     * Check current invoice status from message API
     */
    async checkInvoiceStatus() {
        try {
            const headers = await this.salesFunnel.authManager.getAuthHeaders();
            const endpointUrl = `${this.salesFunnel.authManager.apiBaseUrl}/jet-cct/message/${this.messageId}`;

            const response = await fetch(endpointUrl, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch message`);
            }

            const message = await response.json();
            this.handleStatusUpdate(message);

            this.currentPoll++;
            if (this.currentPoll >= this.maxPolls) {
                this.stopTracking();
                this.showTimeoutState();
            }

        } catch (error) {
            console.error('Error checking invoice status:', error);
            this.handleStatusError(error);
        }
    }

    /**
     * Handle status update from API response
     */
    handleStatusUpdate(message) {
        const status = message.invoice_status;
        const stripeInvoiceId = message.stripe_invoice_id;

        // Update invoice ID if we got it from the response
        if (stripeInvoiceId && !this.invoiceId) {
            this.invoiceId = stripeInvoiceId;
            this.updateInvoiceInfo();
        }

        switch (status) {
            case 'pending':
                this.showStatus('Creating your invoice...', 'pending');
                break;
            case 'sent':
                this.showStatus('Invoice sent to your email!', 'sent');
                this.showInvoiceDetails(message);
                this.stopTracking();
                break;
            case 'paid':
                this.showStatus('Payment received! Thank you.', 'paid');
                this.showInvoiceDetails(message);
                this.stopTracking();
                this.scheduleRedirectToSuccess();
                break;
            case 'failed':
                this.showStatus('Invoice creation failed. Please contact support.', 'failed');
                this.showRetryOptions();
                this.stopTracking();
                break;
            default:
                this.showStatus('Checking invoice status...', 'pending');
        }

        // Track status update
        this.trackStatusUpdate(status);
    }

    /**
     * Show current status to user
     */
    showStatus(message, statusClass) {
        const statusElement = document.getElementById('invoiceStatus');
        const statusIconElement = document.getElementById('statusIcon');

        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `invoice-status ${statusClass}`;
        }

        if (statusIconElement) {
            statusIconElement.className = `status-icon ${statusClass}`;

            // Update icon based on status
            switch (statusClass) {
                case 'pending':
                    statusIconElement.innerHTML = '⏳';
                    break;
                case 'sent':
                    statusIconElement.innerHTML = '📧';
                    break;
                case 'paid':
                    statusIconElement.innerHTML = '✅';
                    break;
                case 'failed':
                    statusIconElement.innerHTML = '❌';
                    break;
            }
        }
    }

    /**
     * Show invoice details when available
     */
    showInvoiceDetails(message) {
        const detailsContainer = document.getElementById('invoiceDetails');
        if (!detailsContainer) return;

        detailsContainer.style.display = 'block';

        // Update invoice amount
        const amountElement = document.getElementById('invoiceAmount');
        if (amountElement && message.invoice_amount) {
            amountElement.textContent = `$${message.invoice_amount} ${message.invoice_currency || 'USD'}`;
        }

        // Update invoice description
        const descriptionElement = document.getElementById('invoiceDescription');
        if (descriptionElement && message.invoice_description) {
            descriptionElement.textContent = message.invoice_description;
        }

        // Update customer information
        const customerNameElement = document.getElementById('customerName');
        const customerEmailElement = document.getElementById('customerEmail');

        if (customerNameElement && message.name) {
            customerNameElement.textContent = message.name;
        }

        if (customerEmailElement && message.email_address) {
            customerEmailElement.textContent = message.email_address;
        }

        // Show Stripe invoice link if available
        if (message.stripe_invoice_id) {
            this.showStripeInvoiceLink(message.stripe_invoice_id);
        }
    }

    /**
     * Show link to Stripe invoice
     */
    showStripeInvoiceLink(stripeInvoiceId) {
        const linkContainer = document.getElementById('stripeInvoiceLink');
        if (!linkContainer) return;

        // Determine dashboard URL based on environment
        const isDevelopment = window.location.hostname.includes('localhost') ||
                             window.location.hostname.includes('.local');

        const dashboardBase = isDevelopment
            ? 'https://dashboard.stripe.com/test'
            : 'https://dashboard.stripe.com';

        const invoiceUrl = `${dashboardBase}/invoices/${stripeInvoiceId}`;

        linkContainer.innerHTML = `
            <div class="stripe-invoice-link">
                <a href="${invoiceUrl}" target="_blank" class="btn btn-outline">
                    <span>View Invoice in Stripe</span>
                    <span class="external-link-icon">↗</span>
                </a>
                <p class="link-note">Opens in a new window</p>
            </div>
        `;

        linkContainer.style.display = 'block';
    }

    /**
     * Show retry options for failed invoices
     */
    showRetryOptions() {
        const retryContainer = document.getElementById('retryOptions');
        if (!retryContainer) return;

        retryContainer.innerHTML = `
            <div class="retry-options">
                <h4>What would you like to do?</h4>
                <div class="retry-buttons">
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                    <a href="/contact.html" class="btn btn-outline">
                        Contact Support
                    </a>
                    <a href="/" class="btn btn-text">
                        Return to Homepage
                    </a>
                </div>
            </div>
        `;

        retryContainer.style.display = 'block';
    }

    /**
     * Show timeout state when polling limit reached
     */
    showTimeoutState() {
        this.showStatus('Status check timeout. Please refresh the page or check your email.', 'timeout');

        const timeoutContainer = document.getElementById('timeoutOptions');
        if (timeoutContainer) {
            timeoutContainer.innerHTML = `
                <div class="timeout-options">
                    <p>Unable to get real-time status updates. Your invoice may still be processing.</p>
                    <div class="timeout-buttons">
                        <button class="btn btn-primary" onclick="location.reload()">
                            Refresh Status
                        </button>
                        <a href="/contact.html" class="btn btn-outline">
                            Contact Support
                        </a>
                    </div>
                </div>
            `;
            timeoutContainer.style.display = 'block';
        }
    }

    /**
     * Handle status check errors
     */
    handleStatusError(error) {
        console.error('Status check error:', error);

        // Don't show error immediately, might be temporary network issue
        if (this.currentPoll > 3) {
            this.showStatus('Having trouble checking status. Retrying...', 'error');
        }
    }

    /**
     * Stop status tracking
     */
    stopTracking() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Schedule redirect to success page for paid invoices
     */
    scheduleRedirectToSuccess() {
        const redirectMessage = document.getElementById('redirectMessage');
        if (redirectMessage) {
            redirectMessage.textContent = 'Redirecting to confirmation page in 5 seconds...';
            redirectMessage.style.display = 'block';
        }

        setTimeout(() => {
            window.location.href = `/invoice-success.html?message_id=${this.messageId}&invoice_id=${this.invoiceId}&type=${this.invoiceType}`;
        }, 5000);
    }

    /**
     * Display error state for initialization failures
     */
    displayErrorState() {
        const statusContainer = document.getElementById('statusContainer');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="error-state">
                    <div class="status-icon error">❌</div>
                    <h2>Unable to Load Invoice Status</h2>
                    <p>We're having trouble loading your invoice information. This could be due to:</p>
                    <ul>
                        <li>Invalid or missing invoice reference</li>
                        <li>Network connectivity issues</li>
                        <li>Temporary system maintenance</li>
                    </ul>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="location.reload()">
                            Try Again
                        </button>
                        <a href="/contact.html" class="btn btn-outline">
                            Contact Support
                        </a>
                        <a href="/" class="btn btn-text">
                            Return to Homepage
                        </a>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'invoice-status',
                funnel_stage: 'invoice_status_tracking',
                message_id: this.messageId,
                invoice_id: this.invoiceId,
                invoice_type: this.invoiceType
            });
        }
    }

    /**
     * Track status updates for analytics
     */
    trackStatusUpdate(status) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('invoice_status_update', {
                invoice_status: status,
                message_id: this.messageId,
                invoice_id: this.invoiceId,
                invoice_type: this.invoiceType,
                poll_count: this.currentPoll
            });
        }
    }

    /**
     * Cleanup when page is unloaded
     */
    cleanup() {
        this.stopTracking();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const invoiceStatusPage = new InvoiceStatusPage();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        invoiceStatusPage.cleanup();
    });
});

export default InvoiceStatusPage;