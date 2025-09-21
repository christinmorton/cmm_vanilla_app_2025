/**
 * ConsultationPage.js
 * Handles the free consultation page functionality
 */

import SalesFunnelForm from './SalesFunnelForm.js';
import { API_ENDPOINTS } from '../config/api-config.js';

class ConsultationPage {
    constructor(options = {}) {
        this.analyticsTracker = options.analyticsTracker;
        this.funnelForm = null;

        // Immediately prevent form submission until initialization completes
        this.setupTemporaryFormHandler();

        this.init();
    }

    /**
     * Setup temporary form handler to prevent default submission during initialization
     */
    setupTemporaryFormHandler() {
        const consultationForm = document.getElementById('consultationForm');
        if (consultationForm) {
            const tempHandler = (e) => {
                e.preventDefault();
                console.log('Form submission prevented - initialization still in progress');

                // Show loading message
                const submitBtn = document.getElementById('consultationSubmitBtn');
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

            consultationForm.addEventListener('submit', tempHandler);

            // Store reference to remove later
            this.tempHandler = tempHandler;
        }
    }

    /**
     * Initialize the consultation page functionality
     */
    async init() {
        try {
            // Initialize sales funnel with analytics tracking
            this.funnelForm = new SalesFunnelForm({
                apiEndpoint: API_ENDPOINTS.SUBMIT_MESSAGE,
                analyticsTracker: this.analyticsTracker
            });

            // Wait for authentication to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.setupRichTextEditor();
            this.setupFormHandler();

            this.setupEventListeners();

            console.log('ConsultationPage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ConsultationPage:', error);
        }
    }

    /**
     * Setup rich text editor functionality
     */
    setupRichTextEditor() {
        const editorDiv = document.getElementById('project-details');
        const fallbackTextarea = document.getElementById('project-details-fallback');
        
        if (!editorDiv || !fallbackTextarea) return;
        
        // Configure contentEditable div as rich text editor
        editorDiv.contentEditable = true;
        editorDiv.style.minHeight = '120px';
        editorDiv.style.border = '2px solid #e1e5e9';
        editorDiv.style.borderRadius = '4px';
        editorDiv.style.padding = '0.75rem';
        editorDiv.style.backgroundColor = 'white';
        
        editorDiv.setAttribute('data-placeholder', 
            'Describe your project goals, target audience, key features, and any specific requirements...');
        
        // Sync content to hidden textarea for form submission
        editorDiv.addEventListener('input', () => {
            fallbackTextarea.value = editorDiv.innerHTML;
        });
        
        // Handle placeholder display
        editorDiv.addEventListener('blur', () => {
            if (editorDiv.textContent.trim() === '') {
                editorDiv.classList.add('empty');
            } else {
                editorDiv.classList.remove('empty');
            }
        });

        // Initialize with empty state if needed
        if (editorDiv.textContent.trim() === '') {
            editorDiv.classList.add('empty');
        }
    }

    /**
     * Setup form submission handler
     */
    setupFormHandler() {
        const consultationForm = document.getElementById('consultationForm');
        if (!consultationForm) return;

        // Remove temporary handler if it exists
        if (this.tempHandler) {
            consultationForm.removeEventListener('submit', this.tempHandler);
            this.tempHandler = null;
            console.log('Temporary form handler removed, permanent handler attached');
        }

        consultationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleConsultationSubmission(e);
        });
    }

    /**
     * Handle consultation form submission
     */
    async handleConsultationSubmission(event) {
        const submitBtn = document.getElementById('consultationSubmitBtn');
        if (!submitBtn) return;

        // Check if form handler is ready
        if (!this.funnelForm) {
            console.error('Form handler not ready - please wait a moment and try again');
            alert('Form is still initializing. Please wait a moment and try again.');
            return;
        }

        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Submitting Request...';

        try {
            // Get rich text content
            const richTextContent = document.getElementById('project-details')?.innerHTML || '';

            const result = await this.funnelForm.handleFormSubmission('consultation', event.target, {
                userMessage: richTextContent
            });
            
            if (result.success) {
                // Track conversion
                this.trackConsultationConversion(event.target);
                
                // Show success and redirect
                this.funnelForm.showSuccessMessage('consultation');
                setTimeout(() => {
                    window.location.href = '/consultation-thank-you.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Consultation submission error:', error);
            this.funnelForm.showErrorMessage('Sorry, something went wrong. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Track consultation conversion for analytics
     */
    trackConsultationConversion(form) {
        if (window.analyticsTracker) {
            const formData = new FormData(form);
            
            window.analyticsTracker.trackEvent('consultation_request', {
                source: 'consultation_page',
                project_type: formData.get('projectType'),
                budget_range: formData.get('budgetRange'),
                preferred_contact: formData.get('preferredContact'),
                has_current_website: formData.get('currentWebsite') ? 'yes' : 'no',
                company_provided: formData.get('company') ? 'yes' : 'no'
            });
        }
    }

    /**
     * Setup additional event listeners
     */
    setupEventListeners() {
        // Add any additional event listeners here
        // This method runs after DOM is ready
    }

    /**
     * Get rich text content from editor
     */
    getRichTextContent() {
        const editorDiv = document.getElementById('project-details');
        return editorDiv ? editorDiv.innerHTML : '';
    }

    /**
     * Set rich text content in editor
     */
    setRichTextContent(content) {
        const editorDiv = document.getElementById('project-details');
        const fallbackTextarea = document.getElementById('project-details-fallback');
        
        if (editorDiv) {
            editorDiv.innerHTML = content;
            if (fallbackTextarea) {
                fallbackTextarea.value = content;
            }
            
            // Update empty state
            if (content.trim() === '') {
                editorDiv.classList.add('empty');
            } else {
                editorDiv.classList.remove('empty');
            }
        }
    }

    /**
     * Validate form before submission
     */
    validateForm(form) {
        const requiredFields = ['name', 'email', 'projectType'];
        const formData = new FormData(form);
        
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                this.funnelForm.showErrorMessage(`Please fill in the ${field} field.`);
                return false;
            }
        }

        // Validate email format
        const email = formData.get('email');
        if (email && !email.includes('@')) {
            this.funnelForm.showErrorMessage('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    /**
     * Pre-fill form with data (useful for returning users)
     */
    prefillForm(data) {
        const form = document.getElementById('consultationForm');
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value;
                }
            }
        });

        // Handle rich text content separately
        if (data.projectDetails) {
            this.setRichTextContent(data.projectDetails);
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        const form = document.getElementById('consultationForm');
        if (form) {
            form.reset();
            this.setRichTextContent('');
        }
    }
}

export default ConsultationPage;