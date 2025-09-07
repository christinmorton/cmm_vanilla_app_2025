/**
 * ConsultationBooking.js
 * Handles the consultation booking page functionality including
 * date/time selection, availability checking, and appointment scheduling
 */

import SalesFunnelForm from './SalesFunnelForm.js';

class ConsultationBooking {
    constructor() {
        this.salesFunnel = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.availableSlots = [];
        
        // Business hours configuration
        this.businessHours = {
            start: 9,  // 9 AM
            end: 18,   // 6 PM
            timezone: 'EST'
        };
        
        // Available time slots (in 24-hour format)
        this.timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ];
        
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
            
            this.initializeDatePicker();
            this.initializeTimeSlots();
            this.initializeConsultationType();
            this.initializeFormSubmission();
            this.trackPageView();
            
            console.log('ConsultationBooking initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ConsultationBooking:', error);
        }
    }

    /**
     * Initialize date picker with business day restrictions
     */
    initializeDatePicker() {
        const dateInput = document.getElementById('selectedDate');
        if (!dateInput) return;

        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];

        // Set maximum date to 60 days from now
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60);
        dateInput.max = maxDate.toISOString().split('T')[0];

        // Handle date selection
        dateInput.addEventListener('change', (e) => {
            this.handleDateSelection(e.target.value);
        });
    }

    /**
     * Handle date selection and update available time slots
     */
    handleDateSelection(dateValue) {
        this.selectedDate = dateValue;
        const selectedDate = new Date(dateValue);
        
        // Check if it's a weekend
        if (this.isWeekend(selectedDate)) {
            this.showDateError('Please select a weekday (Monday-Friday)');
            return;
        }
        
        // Update time slots for selected date
        this.updateTimeSlots(selectedDate);
        this.clearDateError();
    }

    /**
     * Check if date is a weekend
     */
    isWeekend(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
    }

    /**
     * Initialize time slots display
     */
    initializeTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;

        // Initially show placeholder message
        timeSlotsContainer.innerHTML = '<p class="time-slots-placeholder">Please select a date to see available times</p>';
    }

    /**
     * Update time slots based on selected date
     */
    updateTimeSlots(selectedDate) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;

        // Clear existing slots
        timeSlotsContainer.innerHTML = '';

        // Check if date is today
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        const currentHour = today.getHours();

        this.timeSlots.forEach(timeSlot => {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            
            // Skip past time slots for today
            if (isToday && hours <= currentHour) {
                return;
            }

            const timeButton = document.createElement('button');
            timeButton.type = 'button';
            timeButton.className = 'time-slot-btn';
            timeButton.dataset.time = timeSlot;
            
            // Format time for display (12-hour format)
            const displayTime = this.formatTimeForDisplay(timeSlot);
            timeButton.textContent = displayTime;
            
            // Add click handler
            timeButton.addEventListener('click', () => {
                this.selectTimeSlot(timeSlot, timeButton);
            });
            
            timeSlotsContainer.appendChild(timeButton);
        });

        // Show message if no slots available
        if (timeSlotsContainer.children.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="no-slots-message">No available time slots for this date. Please select another date.</p>';
        }
    }

    /**
     * Format time from 24-hour to 12-hour format
     */
    formatTimeForDisplay(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Handle time slot selection
     */
    selectTimeSlot(timeValue, buttonElement) {
        // Remove previous selection
        document.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Mark new selection
        buttonElement.classList.add('selected');
        this.selectedTime = timeValue;
        
        // Update hidden input
        const hiddenInput = document.getElementById('selectedTimeInput');
        if (hiddenInput) {
            hiddenInput.value = timeValue;
        }
    }

    /**
     * Initialize consultation type selection
     */
    initializeConsultationType() {
        const typeCards = document.querySelectorAll('.consultation-type-card');
        const platformField = document.getElementById('meetingPlatform');
        
        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.handleConsultationTypeChange(radio.value);
                }
            });
        });

        // Listen for radio button changes
        const radioButtons = document.querySelectorAll('input[name="consultationType"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleConsultationTypeChange(e.target.value);
            });
        });
    }

    /**
     * Handle consultation type selection
     */
    handleConsultationTypeChange(selectedType) {
        const platformField = document.getElementById('meetingPlatform');
        const platformGroup = platformField?.closest('.form-group');
        
        if (platformGroup) {
            if (selectedType === 'video') {
                platformGroup.style.display = 'block';
                platformField.required = true;
            } else {
                platformGroup.style.display = 'none';
                platformField.required = false;
                platformField.value = '';
            }
        }
    }

    /**
     * Show date selection error
     */
    showDateError(message) {
        const dateInput = document.getElementById('selectedDate');
        const errorContainer = this.getOrCreateErrorContainer(dateInput);
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        dateInput.classList.add('form-error');
    }

    /**
     * Clear date selection error
     */
    clearDateError() {
        const dateInput = document.getElementById('selectedDate');
        const errorContainer = dateInput?.parentNode.querySelector('.date-error');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        dateInput?.classList.remove('form-error');
    }

    /**
     * Get or create error container for date field
     */
    getOrCreateErrorContainer(inputElement) {
        let errorContainer = inputElement.parentNode.querySelector('.date-error');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'date-error form-error-message';
            errorContainer.style.display = 'none';
            inputElement.parentNode.appendChild(errorContainer);
        }
        
        return errorContainer;
    }

    /**
     * Initialize form submission handling
     */
    initializeFormSubmission() {
        const form = document.getElementById('consultationBookingForm');
        if (!form) return;

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
            if (!this.validateBookingForm(form)) {
                this.showValidationErrors();
                return;
            }

            // Show loading state
            this.setFormLoadingState(true);

            // Extract form data
            const formData = this.extractFormData(form);
            
            // Add selected date and time info
            formData.selectedDate = this.selectedDate;
            formData.selectedTime = this.selectedTime;
            formData.formattedDateTime = this.formatDateTimeForSubmission();

            // Step 1: Create the message record first
            const messageResult = await this.salesFunnel.handleFormSubmission('appointment', form, {
                userMessage: formData.agendaTopics || ''
            });

            if (!messageResult.success) {
                this.handleSubmissionError(messageResult.error);
                return;
            }

            // Step 2: Create the appointment record using the message_id from the API response
            const messageId = messageResult.data?.id || messageResult.id;
            if (!messageId) {
                throw new Error('Message ID not found in API response');
            }
            
            const appointmentResult = await this.createAppointmentRecord(messageId, formData);

            if (appointmentResult.success) {
                this.handleSubmissionSuccess({ ...messageResult, ...appointmentResult });
            } else {
                this.handleSubmissionError(appointmentResult.error);
            }

        } catch (error) {
            console.error('Booking submission failed:', error);
            this.handleSubmissionError('An unexpected error occurred. Please try again.');
        } finally {
            this.setFormLoadingState(false);
        }
    }

    /**
     * Create appointment record in the appointment CCT
     */
    async createAppointmentRecord(messageId, formData) {
        try {
            const appointmentData = {
                message_id: messageId.toString(),
                chain_id: this.salesFunnel.generateChainId('appointment'),
                appointment_status: 'scheduled',
                appointment_type: formData.consultationType || 'phone',
                scheduled_date: this.selectedDate,
                scheduled_time: this.selectedTime,
                meeting_duration: (formData.meetingDuration || '30').toString(),
                timezone: this.businessHours.timezone,
                meeting_platform: formData.meetingPlatform || '',
                meeting_link: '',
                meeting_passcode: '',
                location_address: '',
                location_details: '',
                agenda_topics: formData.agendaTopics || '',
                project_type: '',
                preparation_notes: '',
                follow_up_actions: '',
                internal_notes: '',
                reminder_sent: 'false',
                confirmation_sent: 'false',
                created_date: new Date().toISOString(),
                last_modified: new Date().toISOString(),
                rescheduled_count: '0',
                original_scheduled_date: this.selectedDate,
                original_scheduled_time: this.selectedTime
            };

            // Build headers with authentication
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authentication if available
            if (this.salesFunnel.authManager) {
                const authHeaders = await this.salesFunnel.authManager.getAuthHeaders();
                Object.assign(headers, authHeaders);
            }

            // Determine the full endpoint URL
            const endpointUrl = this.salesFunnel.authManager 
                ? `${this.salesFunnel.authManager.apiBaseUrl}/jet-cct/appointment`
                : '/wp-json/jet-cct/appointment';

            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(appointmentData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            
            console.log('Appointment created successfully:', result);
            
            return {
                success: true,
                appointmentId: result.id,
                appointmentData: result
            };

        } catch (error) {
            console.error('Failed to create appointment record:', error);
            return {
                success: false,
                error: `Failed to create appointment: ${error.message}`
            };
        }
    }

    /**
     * Validate the booking form
     */
    validateBookingForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        // Validate required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('form-error');
                isValid = false;
            } else {
                field.classList.remove('form-error');
            }
        });

        // Validate date and time selection
        if (!this.selectedDate) {
            this.showDateError('Please select a consultation date');
            isValid = false;
        }

        if (!this.selectedTime) {
            const timeSlotsContainer = document.getElementById('timeSlots');
            if (timeSlotsContainer) {
                timeSlotsContainer.classList.add('form-error');
            }
            isValid = false;
        }

        return isValid;
    }

    /**
     * Show validation error messages
     */
    showValidationErrors() {
        const firstError = document.querySelector('.form-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Please fill in all required fields and select a date/time.');
        }
    }

    /**
     * Extract form data for submission
     */
    extractFormData(form) {
        const formData = {};
        const formDataObj = new FormData(form);

        for (let [key, value] of formDataObj.entries()) {
            formData[key] = value;
        }

        return formData;
    }

    /**
     * Format date and time for submission
     */
    formatDateTimeForSubmission() {
        if (!this.selectedDate || !this.selectedTime) return '';
        
        const date = new Date(this.selectedDate);
        const [hours, minutes] = this.selectedTime.split(':');
        
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedTime = this.formatTimeForDisplay(this.selectedTime);
        
        return `${formattedDate} at ${formattedTime} EST`;
    }

    /**
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const form = document.getElementById('consultationBookingForm');
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
        this.trackConsultationBooking('success');
        
        // Show success message
        if (this.salesFunnel) {
            this.salesFunnel.showSuccessMessage('appointment');
        }
        
        // Redirect to consultation booking thank you page after delay
        setTimeout(() => {
            window.location.href = '/consultation-booking-thank-you.html';
        }, 2000);
    }

    /**
     * Handle form submission error
     */
    handleSubmissionError(error) {
        console.error('Consultation booking error:', error);
        
        // Track failed submission
        this.trackConsultationBooking('error');
        
        // Show error message
        if (this.salesFunnel) {
            this.salesFunnel.showErrorMessage('Failed to book consultation. Please try again.');
        }
    }

    /**
     * Track page view for analytics
     */
    trackPageView() {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('page_view', {
                page: 'consultation-booking',
                funnel_stage: 'consultation_booking'
            });
        }
    }

    /**
     * Track consultation booking attempts
     */
    trackConsultationBooking(status) {
        if (window.analyticsTracker) {
            window.analyticsTracker.trackEvent('consultation_booking', {
                status: status,
                selected_date: this.selectedDate,
                selected_time: this.selectedTime,
                form_type: 'consultation_booking'
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConsultationBooking();
});

export default ConsultationBooking;