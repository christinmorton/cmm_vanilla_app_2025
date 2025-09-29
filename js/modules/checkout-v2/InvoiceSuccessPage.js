/**
 * InvoiceSuccessPage.js
 * Displays confirmation for paid invoices and creates final invoice records
 * Handles both standard deposit and custom invoice completions
 */

import SalesFunnelForm from '../SalesFunnelForm.js';

class InvoiceSuccessPage {
    constructor() {
        this.salesFunnel = null;
        this.messageId = null;
        this.invoiceId = null;
        this.invoiceType = 'standard';
        this.invoiceData = null;

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
            await this.loadInvoiceData();
            this.displaySuccessContent();
            this.trackInvoiceCompletion();

            console.log('InvoiceSuccessPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize InvoiceSuccessPage:', error);
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
            throw new Error('Message ID is required to display invoice success');
        }

        console.log('Invoice success info:', {
            messageId: this.messageId,
            invoiceId: this.invoiceId,
            type: this.invoiceType
        });
    }

    /**
     * Load invoice data from the message API
     */
    async loadInvoiceData() {
        try {
            const headers = await this.salesFunnel.authManager.getAuthHeaders();
            const endpointUrl = `${this.salesFunnel.authManager.apiBaseUrl}/jet-cct/message/${this.messageId}`;

            const response = await fetch(endpointUrl, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch invoice data`);
            }

            this.invoiceData = await response.json();

            // Also try to get the final invoice record if it exists
            await this.loadFinalInvoiceRecord();

        } catch (error) {
            console.error('Failed to load invoice data:', error);
            // Continue with limited data display
        }
    }

    /**
     * Load the final invoice record from the invoice CCT
     */
    async loadFinalInvoiceRecord() {
        try {
            const headers = await this.salesFunnel.authManager.getAuthHeaders();
            const endpointUrl = `${this.salesFunnel.authManager.apiBaseUrl}/jet-cct/invoice?message_id=${this.messageId}`;

            const response = await fetch(endpointUrl, { headers });

            if (response.ok) {
                const invoices = await response.json();
                if (invoices && invoices.length > 0) {
                    this.finalInvoiceRecord = invoices[0]; // Get the most recent invoice
                }
            }

        } catch (error) {
            console.error('Failed to load final invoice record:', error);
            // Not critical, continue without it
        }
    }

    /**
     * Display success content based on invoice type and data
     */
    displaySuccessContent() {
        this.displaySuccessHeader();
        this.displayInvoiceDetails();
        this.displayNextSteps();
        this.displayReceiptInformation();
    }

    /**
     * Display success header with customer name
     */
    displaySuccessHeader() {
        const successTitle = document.getElementById('successTitle');
        const successSubtitle = document.getElementById('successSubtitle');
        const customerName = this.invoiceData?.name || 'Valued Customer';

        if (successTitle) {
            successTitle.textContent = `Thank you, ${customerName}!`;
        }

        if (successSubtitle) {
            const typeText = this.invoiceType === 'custom' ? 'custom service' : 'project deposit';
            successSubtitle.textContent = `Your ${typeText} payment has been successfully processed.`;
        }
    }

    /**
     * Display detailed invoice information
     */
    displayInvoiceDetails() {
        const detailsContainer = document.getElementById('invoiceDetails');
        if (!detailsContainer || !this.invoiceData) return;

        const amount = this.invoiceData.invoice_amount || '0.00';
        const currency = this.invoiceData.invoice_currency || 'USD';
        const description = this.invoiceData.invoice_description || 'Service Payment';
        const paymentDate = this.formatPaymentDate();

        detailsContainer.innerHTML = `
            <div class="invoice-details-card">
                <h3>Payment Details</h3>

                <div class="detail-grid">
                    <div class="detail-row">
                        <span class="detail-label">Amount Paid:</span>
                        <span class="detail-value">$${amount} ${currency}</span>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">${description}</span>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">${paymentDate}</span>
                    </div>

                    ${this.invoiceId ? `
                    <div class="detail-row">
                        <span class="detail-label">Invoice ID:</span>
                        <span class="detail-value">${this.invoiceId.substring(0, 20)}...</span>
                    </div>
                    ` : ''}

                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span class="detail-value">${this.invoiceData.name}</span>
                    </div>

                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${this.invoiceData.email_address}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Display next steps based on invoice type
     */
    displayNextSteps() {
        const nextStepsContainer = document.getElementById('nextSteps');
        if (!nextStepsContainer) return;

        let nextStepsContent = '';

        if (this.invoiceType === 'custom') {
            nextStepsContent = `
                <div class="next-steps-card">
                    <h3>What Happens Next?</h3>
                    <ol class="next-steps-list">
                        <li>
                            <strong>Project Planning</strong>
                            <p>We'll review your custom service requirements and create a detailed project plan.</p>
                        </li>
                        <li>
                            <strong>Initial Contact</strong>
                            <p>Our team will reach out within 1-2 business days to discuss your project timeline and next steps.</p>
                        </li>
                        <li>
                            <strong>Project Kickoff</strong>
                            <p>Once we've finalized the details, we'll schedule your project kickoff meeting.</p>
                        </li>
                    </ol>
                </div>
            `;
        } else {
            // Standard deposit flow
            const depositTypeMap = {
                'starter': 'Starter Development',
                'standard': 'Standard Development',
                'premium': 'Premium Development',
                'consultation': 'Professional Consultation'
            };

            const depositType = this.getDepositType();
            const serviceName = depositTypeMap[depositType] || 'Development';

            nextStepsContent = `
                <div class="next-steps-card">
                    <h3>Your ${serviceName} Journey</h3>
                    <ol class="next-steps-list">
                        <li>
                            <strong>Deposit Secured</strong>
                            <p>Your ${serviceName.toLowerCase()} slot is now reserved with this deposit payment.</p>
                        </li>
                        <li>
                            <strong>Project Discovery</strong>
                            <p>We'll schedule a discovery call to understand your specific requirements and goals.</p>
                        </li>
                        <li>
                            <strong>Development Begins</strong>
                            <p>Your project will enter our development queue and we'll begin building your solution.</p>
                        </li>
                        <li>
                            <strong>Regular Updates</strong>
                            <p>You'll receive regular progress updates and preview access throughout development.</p>
                        </li>
                    </ol>
                </div>
            `;
        }

        nextStepsContainer.innerHTML = nextStepsContent;
    }

    /**
     * Display receipt and billing information
     */
    displayReceiptInformation() {
        const receiptContainer = document.getElementById('receiptInformation');
        if (!receiptContainer) return;

        receiptContainer.innerHTML = `
            <div class="receipt-card">
                <h3>Receipt & Billing</h3>

                <div class="receipt-info">
                    <p><strong>Email Confirmation:</strong> A detailed receipt has been sent to your email address.</p>
                    <p><strong>Tax Documentation:</strong> This payment receipt can be used for business expense reporting.</p>
                    ${this.finalInvoiceRecord?.receipt_url ? `
                        <p><strong>Online Receipt:</strong>
                            <a href="${this.finalInvoiceRecord.receipt_url}" target="_blank" class="receipt-link">
                                View Online Receipt ↗
                            </a>
                        </p>
                    ` : ''}
                </div>

                <div class="receipt-actions">
                    <button onclick="window.print()" class="btn btn-outline">
                        Print Receipt
                    </button>
                    ${this.invoiceId ? `
                        <a href="${this.getStripeInvoiceUrl()}" target="_blank" class="btn btn-outline">
                            View in Stripe ↗
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Format payment date for display
     */
    formatPaymentDate() {
        if (this.finalInvoiceRecord?.payment_date) {
            return new Date(this.finalInvoiceRecord.payment_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Fallback to current date
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get deposit type from message data
     */
    getDepositType() {
        if (!this.invoiceData?.simple_message) return 'standard';

        const message = this.invoiceData.simple_message;
        const match = message.match(/Deposit Type:\s*(\w+)/i);
        return match ? match[1] : 'standard';
    }

    /**
     * Get Stripe invoice URL
     */
    getStripeInvoiceUrl() {
        if (!this.invoiceId) return '#';

        const isDevelopment = window.location.hostname.includes('localhost') ||
                             window.location.hostname.includes('.local');

        const dashboardBase = isDevelopment
            ? 'https://dashboard.stripe.com/test'
            : 'https://dashboard.stripe.com';

        return `${dashboardBase}/invoices/${this.invoiceId}`;
    }

    /**
     * Display error state for initialization failures
     */
    displayErrorState() {
        const successContainer = document.getElementById('successContainer');
        if (successContainer) {
            successContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h2>Unable to Load Payment Confirmation</h2>
                    <p>We're having trouble loading your payment confirmation details.</p>

                    <div class="error-recovery">
                        <h4>Don't worry - your payment was likely successful!</h4>
                        <ul>
                            <li>Check your email for a payment confirmation</li>
                            <li>Your invoice and receipt should arrive shortly</li>
                            <li>Contact support if you have any concerns</li>
                        </ul>
                    </div>

                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="location.reload()">
                            Try Loading Again
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
     * Track invoice completion for analytics
     */
    trackInvoiceCompletion() {
        if (window.analyticsTracker && this.invoiceData) {
            const amount = parseFloat(this.invoiceData.invoice_amount || 0);

            window.analyticsTracker.trackEvent('invoice_payment_completed', {
                message_id: this.messageId,
                invoice_id: this.invoiceId,
                invoice_type: this.invoiceType,
                amount: amount,
                currency: this.invoiceData.invoice_currency || 'USD',
                service_description: this.invoiceData.invoice_description,
                customer_email: this.invoiceData.email_address,
                payment_method: 'stripe_invoice',
                page: 'invoice-success',
                funnel_stage: 'invoice_completed'
            });

            // Track conversion completion
            window.analyticsTracker.trackEvent('conversion_completed', {
                conversion_type: 'invoice_payment',
                conversion_value: amount,
                customer_message_id: this.messageId,
                funnel_completion_time: this.calculateFunnelTime()
            });
        }
    }

    /**
     * Calculate funnel completion time (approximate)
     */
    calculateFunnelTime() {
        if (this.invoiceData?.created_date) {
            const createdTime = new Date(this.invoiceData.created_date);
            const now = new Date();
            return Math.round((now - createdTime) / 1000 / 60); // Minutes
        }
        return null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceSuccessPage();
});

export default InvoiceSuccessPage;