# Analytics Event System

This document describes the automated analytics event tracking system that captures client-side data and sends it to the WordPress headless CMS for comprehensive user behavior analysis.

## Overview

The `analytics_event` custom content type automatically collects browser and user interaction data during form submissions and other key user actions. This system operates transparently in the background, gathering valuable analytics data without requiring manual input from users.

## Analytics Event Schema

**Database Table:** `wp_jet_cct_analytics_event`  
**Endpoint:** `/wp-json/jet-cct/analytics_event`

```javascript
{
  event_type: "form_submit|page_load|click|scroll|exit",
  ts_loaded: "2024-01-15T10:30:00.000Z",
  ts_submitted: "2024-01-15T10:35:24.123Z", 
  user_agent_signature: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  page_path: "/contact",
  referrer: "https://google.com/search?q=web+development",
  session_id: "sess_abc123def456",
  user_id: "user_xyz789", 
  ip_address: "192.168.1.100", // Server-collected
  message_id: "msg_contact_001", // If related to message
  chain_id: "chain_user_session_001"
}
```

## Field Collection Strategy

### Client-Side Collected Fields

#### 1. **Event Type** (`event_type`)
**Collection Method:** Programmatically set based on trigger
**Values:**
- `"page_load"` - Page initial load
- `"form_submit"` - Form submission events  
- `"form_start"` - User begins filling form
- `"click"` - Button/link clicks
- `"scroll"` - Scroll depth milestones
- `"exit"` - Page exit/unload

```javascript
const getEventType = (action) => {
  const eventTypes = {
    submit: 'form_submit',
    load: 'page_load', 
    click: 'click',
    scroll: 'scroll',
    beforeunload: 'exit'
  };
  return eventTypes[action] || 'unknown';
};
```

#### 2. **Timestamps** (`ts_loaded`, `ts_submitted`)
**Collection Method:** JavaScript Date objects
```javascript
const timestamps = {
  ts_loaded: window.performance.timeOrigin 
    ? new Date(window.performance.timeOrigin).toISOString()
    : new Date(Date.now()).toISOString(),
  ts_submitted: new Date().toISOString()
};
```

#### 3. **User Agent Signature** (`user_agent_signature`)
**Collection Method:** Browser navigator object
```javascript
const user_agent_signature = navigator.userAgent;
// Example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

#### 4. **Page Path** (`page_path`)
**Collection Method:** Browser location object
```javascript
const page_path = window.location.pathname + window.location.search;
// Example: "/contact?utm_source=google"
```

#### 5. **Referrer** (`referrer`)
**Collection Method:** Document referrer
```javascript
const referrer = document.referrer || 'direct';
// Example: "https://google.com/search?q=web+development"
```

#### 6. **Session ID** (`session_id`)
**Collection Method:** Generated/stored in sessionStorage
```javascript
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};
```

#### 7. **User ID** (`user_id`)
**Collection Method:** Generated/stored in localStorage for returning visitors
```javascript
const getUserId = () => {
  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
};
```

#### 8. **Chain ID** (`chain_id`)
**Collection Method:** Generated for related events/sessions
```javascript
const getChainId = (relatedTo = 'session') => {
  return `chain_${relatedTo}_${getSessionId()}`;
};
```

### Server-Side Collected Fields

#### 9. **IP Address** (`ip_address`)
**Collection Method:** Server request headers
- Not collected on frontend for privacy/security
- Handled by WordPress server during API submission

#### 10. **Message ID** (`message_id`)
**Collection Method:** Related to form submissions
- Set when analytics event is related to a message submission
- Links analytics data to specific contact/lead messages

## Automatic Data Collection System

### Core Analytics Class

```javascript
class AnalyticsTracker {
  constructor() {
    this.pageLoadTime = Date.now();
    this.sessionId = this.getSessionId();
    this.userId = this.getUserId();
    this.setupEventListeners();
  }

  // Collect all client-side analytics data
  collectAnalyticsData(eventType, additionalData = {}) {
    return {
      event_type: eventType,
      ts_loaded: new Date(this.pageLoadTime).toISOString(),
      ts_submitted: new Date().toISOString(),
      user_agent_signature: navigator.userAgent,
      page_path: window.location.pathname + window.location.search,
      referrer: document.referrer || 'direct',
      session_id: this.sessionId,
      user_id: this.userId,
      chain_id: `chain_session_${this.sessionId}`,
      ...additionalData
    };
  }

  // Send analytics data to server
  async sendAnalyticsEvent(eventType, additionalData = {}) {
    const analyticsData = this.collectAnalyticsData(eventType, additionalData);
    
    try {
      const response = await fetch('/wp-json/jet-cct/analytics_event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsData)
      });
      
      return response.json();
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Setup automatic event listeners
  setupEventListeners() {
    // Page load tracking
    window.addEventListener('load', () => {
      this.sendAnalyticsEvent('page_load');
    });

    // Form submission tracking  
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formData = new FormData(form);
      
      this.sendAnalyticsEvent('form_submit', {
        message_id: formData.get('message_id') || null,
        chain_id: `chain_form_${this.sessionId}`
      });
    });

    // Page exit tracking
    window.addEventListener('beforeunload', () => {
      this.sendAnalyticsEvent('exit');
    });
  }

  // Utility methods
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  getUserId() {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }
}

// Initialize analytics tracking
const analytics = new AnalyticsTracker();
```

### Integration with Form Submissions

```javascript
// Enhanced form submission with analytics
const submitFormWithAnalytics = async (formData, messageType) => {
  // Submit message data
  const messageResponse = await fetch('/wp-json/jet-cct/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: messageType,
      name: formData.name,
      email_address: formData.email,
      // ... other message fields
    })
  });

  const messageResult = await messageResponse.json();

  // Send related analytics event
  await analytics.sendAnalyticsEvent('form_submit', {
    message_id: messageResult.id,
    chain_id: `chain_message_${messageResult.id}`
  });

  return messageResult;
};
```

## Event Types and Use Cases

### 1. **Page Load Events** (`page_load`)
- Track page performance and user navigation patterns
- Measure bounce rates and session duration
- Analyze popular content and user flow

### 2. **Form Interaction Events** (`form_submit`, `form_start`)  
- Monitor conversion rates across different forms
- Track form abandonment rates
- A/B test form designs and copy

### 3. **Click Events** (`click`)
- Track CTA button effectiveness
- Monitor navigation usage patterns
- Analyze user engagement with interactive elements

### 4. **Scroll Events** (`scroll`)
- Measure content engagement depth
- Optimize page layouts based on scroll behavior
- Track reading completion rates

### 5. **Exit Events** (`exit`)
- Identify common exit points
- Analyze session duration patterns
- Trigger exit-intent campaigns

## Privacy and Compliance

### Data Collection Principles
1. **Transparency:** Users should be informed about data collection
2. **Consent:** Implement cookie consent for EU/GDPR compliance
3. **Anonymization:** User IDs are generated, not personal identifiers
4. **Retention:** Implement data retention policies
5. **Security:** All data transmitted over HTTPS

### GDPR/Privacy Implementation
```javascript
class PrivacyCompliantAnalytics extends AnalyticsTracker {
  constructor() {
    super();
    this.consentGiven = this.checkConsent();
  }

  checkConsent() {
    return localStorage.getItem('analytics_consent') === 'granted';
  }

  sendAnalyticsEvent(eventType, additionalData = {}) {
    if (!this.consentGiven) {
      console.log('Analytics consent not granted, skipping event');
      return;
    }
    return super.sendAnalyticsEvent(eventType, additionalData);
  }
}
```

## Performance Considerations

### 1. **Batch Requests**
- Queue analytics events and send in batches
- Reduce server load and improve performance

### 2. **Error Handling**
- Fail silently to not impact user experience
- Implement retry logic for failed requests

### 3. **Storage Management**
- Clean up old session/user data periodically
- Implement storage quota management

## Analytics Dashboard Integration

The collected data can be used for:

1. **User Behavior Analysis**
   - Session flow visualization
   - Conversion funnel analysis
   - User engagement metrics

2. **Performance Monitoring**
   - Page load times
   - Form completion rates
   - Error tracking

3. **Marketing Intelligence**
   - Traffic source analysis
   - Campaign effectiveness
   - User journey mapping

## Implementation Checklist

- [ ] Implement AnalyticsTracker class
- [ ] Add automatic event listeners
- [ ] Integrate with existing forms
- [ ] Add privacy consent handling
- [ ] Test data collection accuracy
- [ ] Verify server endpoint functionality
- [ ] Implement analytics dashboard
- [ ] Add data retention policies
- [ ] Test GDPR compliance features

This analytics system provides comprehensive user behavior tracking while maintaining privacy standards and delivering actionable insights for improving the user experience and business outcomes.