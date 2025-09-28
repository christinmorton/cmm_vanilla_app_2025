# Backend API Requirements for V2 Invoice Enhancement
## Stripe Invoice API Integration Specifications

### 🎯 **Overview**
This document specifies the exact backend API changes needed to transform the existing checkout system into a true Stripe Invoice API-based system. All changes will be made to the existing `docs/fn-stripe-payment.php` file.

---

## 📋 **Required API Endpoints**

### **Endpoint 1: Invoice Creation**
```
POST /wp-json/cmm/v1/create-stripe-invoice
```

#### **Purpose**
Replace checkout session creation with proper Stripe Invoice API calls for email-based payment collection.

#### **Request Payload**
```json
{
    "customer_name": "John Smith",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "customer_company": "Example Corp",
    "amount": 99.00,
    "depositType": "starter",
    "description": "Web Development Starter Deposit",
    "project_description": "E-commerce website development",
    "message_id": "msg_12345",
    "chain_id": "chain_67890"
}
```

#### **Response Format**
```json
{
    "success": true,
    "invoice_id": "in_1234567890",
    "hosted_invoice_url": "https://invoice.stripe.com/i/acct_xxx/test_xxx",
    "invoice_pdf": "https://pay.stripe.com/invoice/xxx/pdf",
    "customer_id": "cus_1234567890",
    "due_date": "2025-02-04",
    "amount": 99.00,
    "currency": "usd",
    "status": "draft"
}
```

#### **Error Response**
```json
{
    "success": false,
    "error_code": "invalid_email",
    "message": "Please provide a valid email address",
    "details": {
        "field": "customer_email",
        "timestamp": "2025-01-28T10:30:00Z"
    }
}
```

---

### **Endpoint 2: Invoice Webhook Handler**
```
POST /wp-json/cmm/v1/stripe-invoice-webhook
```

#### **Purpose**
Handle Stripe invoice webhook events to update message status and trigger business logic.

#### **Webhook Events to Process**
```json
{
    "invoice.created": "Invoice generated successfully",
    "invoice.sent": "Invoice emailed to customer",
    "invoice.payment_succeeded": "Customer completed payment",
    "invoice.payment_failed": "Payment attempt failed",
    "invoice.payment_action_required": "Additional customer action needed"
}
```

#### **Webhook Response**
```json
{
    "received": true,
    "processed": true,
    "event_type": "invoice.payment_succeeded",
    "invoice_id": "in_1234567890",
    "message_updated": true,
    "timestamp": "2025-01-28T10:30:00Z"
}
```

---

## 🔧 **Implementation Specifications**

### **Step 1: Add Invoice Creation Function**

#### **A. Register Endpoint**
**Add to fn-stripe-payment.php**:

```php
// Add this registration function
add_action('rest_api_init', 'register_stripe_invoice_creation_endpoint');

function register_stripe_invoice_creation_endpoint() {
    register_rest_route('cmm/v1', '/create-stripe-invoice', array(
        'methods' => 'POST',
        'callback' => 'handle_create_stripe_invoice_request',
        'permission_callback' => 'cmm_stripe_checkout_permission_check',
        'args' => array(
            'customer_name' => array(
                'required' => true,
                'type' => 'string',
                'validate_callback' => 'cmm_validate_customer_name'
            ),
            'customer_email' => array(
                'required' => true,
                'type' => 'string',
                'validate_callback' => 'cmm_validate_email'
            ),
            'amount' => array(
                'required' => true,
                'type' => 'number',
                'minimum' => 1.00,
                'maximum' => 5000.00
            ),
            'message_id' => array(
                'required' => true,
                'type' => 'string'
            )
        )
    ));
}
```

#### **B. Invoice Creation Handler**
**Core function implementation**:

```php
function handle_create_stripe_invoice_request($request) {
    // 1. Validate and sanitize input
    $params = cmm_sanitize_invoice_params($request->get_json_params());
    if (is_wp_error($params)) {
        return $params;
    }

    // 2. Check Stripe configuration
    $config_check = cmm_check_stripe_configuration();
    if (is_wp_error($config_check)) {
        return $config_check;
    }

    // 3. Get Stripe secret key
    $stripe_secret_key = cmm_get_stripe_secret_key();
    if (!$stripe_secret_key) {
        return new WP_Error('stripe_config_error',
            'Stripe secret key not configured',
            array('status' => 500)
        );
    }

    try {
        // 4. Create or retrieve Stripe customer
        $customer = cmm_create_or_get_stripe_customer(
            $params['customer_email'],
            $params['customer_name'],
            $stripe_secret_key
        );

        // 5. Create invoice items
        $invoice_item = cmm_create_stripe_invoice_item(
            $customer['id'],
            $params['amount'],
            $params['description'],
            $stripe_secret_key
        );

        // 6. Create and send invoice
        $invoice = cmm_create_and_send_stripe_invoice(
            $customer['id'],
            $params,
            $stripe_secret_key
        );

        // 7. Update polymorphic message
        cmm_update_message_with_invoice_data($params['message_id'], $invoice);

        // 8. Return success response
        return array(
            'success' => true,
            'invoice_id' => $invoice['id'],
            'hosted_invoice_url' => $invoice['hosted_invoice_url'],
            'invoice_pdf' => $invoice['invoice_pdf'],
            'customer_id' => $customer['id'],
            'due_date' => date('Y-m-d', $invoice['due_date']),
            'amount' => $params['amount'],
            'currency' => 'usd',
            'status' => $invoice['status']
        );

    } catch (Exception $e) {
        error_log('Stripe Invoice Creation Error: ' . $e->getMessage());
        return new WP_Error('invoice_creation_failed',
            'Failed to create invoice: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}
```

#### **C. Helper Functions**
**Add these supporting functions**:

```php
function cmm_sanitize_invoice_params($params) {
    $sanitized = array();

    // Validate required fields
    if (empty($params['customer_name']) || strlen(trim($params['customer_name'])) < 2) {
        return new WP_Error('invalid_name', 'Customer name is required (minimum 2 characters)', array('status' => 400));
    }

    if (empty($params['customer_email']) || !is_email($params['customer_email'])) {
        return new WP_Error('invalid_email', 'Valid email address is required', array('status' => 400));
    }

    if (empty($params['amount']) || $params['amount'] < 1 || $params['amount'] > 5000) {
        return new WP_Error('invalid_amount', 'Amount must be between $1 and $5000', array('status' => 400));
    }

    // Sanitize and store
    $sanitized['customer_name'] = sanitize_text_field(trim($params['customer_name']));
    $sanitized['customer_email'] = sanitize_email($params['customer_email']);
    $sanitized['customer_phone'] = sanitize_text_field($params['customer_phone'] ?? '');
    $sanitized['customer_company'] = sanitize_text_field($params['customer_company'] ?? '');
    $sanitized['amount'] = floatval($params['amount']);
    $sanitized['depositType'] = sanitize_text_field($params['depositType'] ?? 'custom');
    $sanitized['description'] = sanitize_text_field($params['description'] ?? 'Service Deposit');
    $sanitized['project_description'] = sanitize_textarea_field($params['project_description'] ?? '');
    $sanitized['message_id'] = sanitize_text_field($params['message_id']);
    $sanitized['chain_id'] = sanitize_text_field($params['chain_id'] ?? '');

    return $sanitized;
}

function cmm_create_or_get_stripe_customer($email, $name, $stripe_secret_key) {
    // Search for existing customer
    $existing_response = wp_remote_get('https://api.stripe.com/v1/customers?email=' . urlencode($email), array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $stripe_secret_key
        )
    ));

    if (!is_wp_error($existing_response)) {
        $existing_data = json_decode(wp_remote_retrieve_body($existing_response), true);
        if (!empty($existing_data['data'])) {
            return $existing_data['data'][0]; // Return existing customer
        }
    }

    // Create new customer
    $customer_response = wp_remote_post('https://api.stripe.com/v1/customers', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $stripe_secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded'
        ),
        'body' => http_build_query(array(
            'email' => $email,
            'name' => $name
        ))
    ));

    if (is_wp_error($customer_response)) {
        throw new Exception('Failed to create Stripe customer');
    }

    $customer_data = json_decode(wp_remote_retrieve_body($customer_response), true);
    if (empty($customer_data['id'])) {
        throw new Exception('Invalid customer response from Stripe');
    }

    return $customer_data;
}

function cmm_create_stripe_invoice_item($customer_id, $amount, $description, $stripe_secret_key) {
    $item_response = wp_remote_post('https://api.stripe.com/v1/invoiceitems', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $stripe_secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded'
        ),
        'body' => http_build_query(array(
            'customer' => $customer_id,
            'amount' => intval($amount * 100), // Convert to cents
            'currency' => 'usd',
            'description' => $description
        ))
    ));

    if (is_wp_error($item_response)) {
        throw new Exception('Failed to create invoice item');
    }

    $item_data = json_decode(wp_remote_retrieve_body($item_response), true);
    if (empty($item_data['id'])) {
        throw new Exception('Invalid invoice item response from Stripe');
    }

    return $item_data;
}

function cmm_create_and_send_stripe_invoice($customer_id, $params, $stripe_secret_key) {
    // Get due days from configuration
    $due_days = defined('STRIPE_INVOICE_DEFAULT_DUE_DAYS') ? STRIPE_INVOICE_DEFAULT_DUE_DAYS : 7;

    // Create invoice
    $invoice_response = wp_remote_post('https://api.stripe.com/v1/invoices', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $stripe_secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded'
        ),
        'body' => http_build_query(array(
            'customer' => $customer_id,
            'collection_method' => 'send_invoice',
            'days_until_due' => $due_days,
            'auto_advance' => defined('STRIPE_INVOICE_AUTO_ADVANCE') ? STRIPE_INVOICE_AUTO_ADVANCE : true,
            'metadata' => array(
                'message_id' => $params['message_id'],
                'chain_id' => $params['chain_id'],
                'deposit_type' => $params['depositType'],
                'source' => 'wordpress_v2_invoice'
            )
        ))
    ));

    if (is_wp_error($invoice_response)) {
        throw new Exception('Failed to create invoice');
    }

    $invoice_data = json_decode(wp_remote_retrieve_body($invoice_response), true);
    if (empty($invoice_data['id'])) {
        throw new Exception('Invalid invoice response from Stripe');
    }

    // Send invoice
    $send_response = wp_remote_post("https://api.stripe.com/v1/invoices/{$invoice_data['id']}/send", array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $stripe_secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded'
        )
    ));

    if (is_wp_error($send_response)) {
        throw new Exception('Failed to send invoice');
    }

    $sent_invoice_data = json_decode(wp_remote_retrieve_body($send_response), true);
    return $sent_invoice_data;
}
```

---

### **Step 2: Add Webhook Handler Function**

#### **A. Register Webhook Endpoint**
```php
add_action('rest_api_init', 'register_stripe_invoice_webhook_endpoint');

function register_stripe_invoice_webhook_endpoint() {
    register_rest_route('cmm/v1', '/stripe-invoice-webhook', array(
        'methods' => 'POST',
        'callback' => 'handle_stripe_invoice_webhook_request',
        'permission_callback' => '__return_true' // Stripe servers need unrestricted access
    ));
}
```

#### **B. Webhook Handler Implementation**
```php
function handle_stripe_invoice_webhook_request($request) {
    // Get webhook payload and signature
    $payload = $request->get_body();
    $sig_header = $request->get_header('stripe-signature');

    // Get webhook secret
    $webhook_secret = cmm_get_webhook_secret();

    // Verify webhook signature (required for security)
    if (!cmm_verify_stripe_webhook_signature($payload, $sig_header, $webhook_secret)) {
        error_log('Invalid Stripe webhook signature');
        return new WP_Error('invalid_signature', 'Invalid webhook signature', array('status' => 400));
    }

    // Parse event
    $event = json_decode($payload, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return new WP_Error('invalid_json', 'Invalid JSON payload', array('status' => 400));
    }

    error_log('Processing Stripe invoice webhook: ' . $event['type']);

    // Handle specific invoice events
    switch ($event['type']) {
        case 'invoice.created':
            return cmm_handle_invoice_created($event);

        case 'invoice.sent':
            return cmm_handle_invoice_sent($event);

        case 'invoice.payment_succeeded':
            return cmm_handle_invoice_payment_succeeded($event);

        case 'invoice.payment_failed':
            return cmm_handle_invoice_payment_failed($event);

        default:
            error_log('Unhandled invoice webhook event: ' . $event['type']);
            return array('received' => true, 'processed' => false);
    }
}

function cmm_handle_invoice_created($event) {
    $invoice = $event['data']['object'];
    $message_id = $invoice['metadata']['message_id'] ?? null;

    if ($message_id) {
        cmm_update_message_status($message_id, array(
            'invoice_status' => 'invoice_created',
            'stripe_invoice_id' => $invoice['id']
        ));
    }

    return array('received' => true, 'processed' => true, 'event_type' => 'invoice.created');
}

function cmm_handle_invoice_sent($event) {
    $invoice = $event['data']['object'];
    $message_id = $invoice['metadata']['message_id'] ?? null;

    if ($message_id) {
        cmm_update_message_status($message_id, array(
            'invoice_status' => 'invoice_sent',
            'invoice_pdf_url' => $invoice['invoice_pdf'] ?? null,
            'invoice_hosted_url' => $invoice['hosted_invoice_url'] ?? null
        ));
    }

    return array('received' => true, 'processed' => true, 'event_type' => 'invoice.sent');
}

function cmm_handle_invoice_payment_succeeded($event) {
    $invoice = $event['data']['object'];
    $message_id = $invoice['metadata']['message_id'] ?? null;

    if ($message_id) {
        cmm_update_message_status($message_id, array(
            'invoice_status' => 'payment_received',
            'payment_date' => current_time('mysql'),
            'paid_amount' => $invoice['amount_paid'] / 100, // Convert from cents
            'stripe_charge_id' => $invoice['charge'] ?? null
        ));

        // Trigger any post-payment business logic
        do_action('cmm_invoice_payment_succeeded', $message_id, $invoice);
    }

    return array('received' => true, 'processed' => true, 'event_type' => 'invoice.payment_succeeded');
}

function cmm_handle_invoice_payment_failed($event) {
    $invoice = $event['data']['object'];
    $message_id = $invoice['metadata']['message_id'] ?? null;

    if ($message_id) {
        cmm_update_message_status($message_id, array(
            'invoice_status' => 'payment_failed',
            'failure_reason' => $invoice['last_finalization_error']['message'] ?? 'Payment failed'
        ));
    }

    return array('received' => true, 'processed' => true, 'event_type' => 'invoice.payment_failed');
}
```

#### **C. Message Update Helper**
```php
function cmm_update_message_status($message_id, $update_data) {
    try {
        // Update via JetEngine Custom Content Type API
        $response = wp_remote_request(home_url("/wp-json/jet-cct/messages/{$message_id}"), array(
            'method' => 'PATCH',
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode($update_data),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            error_log('Failed to update message: ' . $response->get_error_message());
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200 && $response_code !== 204) {
            error_log('Message update failed with code: ' . $response_code);
            return false;
        }

        error_log("Message {$message_id} updated successfully");
        return true;

    } catch (Exception $e) {
        error_log('Exception updating message: ' . $e->getMessage());
        return false;
    }
}

function cmm_verify_stripe_webhook_signature($payload, $sig_header, $webhook_secret) {
    if (empty($sig_header) || empty($webhook_secret)) {
        return false;
    }

    // Parse signature header
    $elements = explode(',', $sig_header);
    $signature = null;
    $timestamp = null;

    foreach ($elements as $element) {
        list($key, $value) = explode('=', $element, 2);
        if ($key === 't') {
            $timestamp = $value;
        } elseif ($key === 'v1') {
            $signature = $value;
        }
    }

    if (!$timestamp || !$signature) {
        return false;
    }

    // Check timestamp (5 minute tolerance)
    if (abs(time() - $timestamp) > 300) {
        return false;
    }

    // Verify signature
    $signed_payload = $timestamp . '.' . $payload;
    $expected_signature = hash_hmac('sha256', $signed_payload, $webhook_secret);

    return hash_equals($expected_signature, $signature);
}
```

---

### **Step 3: Update Message System Integration**

#### **A. Enhanced Message Fields**
**Add to polymorphic message creation**:

```php
function cmm_update_message_with_invoice_data($message_id, $invoice_data) {
    $invoice_fields = array(
        'stripe_invoice_id' => $invoice_data['id'],
        'invoice_pdf_url' => $invoice_data['invoice_pdf'] ?? null,
        'invoice_hosted_url' => $invoice_data['hosted_invoice_url'] ?? null,
        'payment_deadline' => $invoice_data['due_date'] ? date('Y-m-d', $invoice_data['due_date']) : null,
        'invoice_status' => 'invoice_sent',
        'invoice_amount' => $invoice_data['amount_due'] / 100, // Convert from cents
        'invoice_currency' => strtoupper($invoice_data['currency']),
        'stripe_customer_id' => $invoice_data['customer'],
        'last_updated' => current_time('mysql')
    );

    return cmm_update_message_status($message_id, $invoice_fields);
}
```

---

### **Step 4: Configuration & Security**

#### **A. Required wp-config.php Constants**
```php
// Add these to wp-config.php
define('STRIPE_INVOICE_DEFAULT_DUE_DAYS', 7);
define('STRIPE_INVOICE_AUTO_ADVANCE', true);
define('STRIPE_INVOICE_COLLECTION_METHOD', 'send_invoice');
```

#### **B. Security Enhancements**
- Webhook signature verification (mandatory)
- Input validation and sanitization
- Rate limiting on invoice creation
- Error logging and monitoring

---

## 🧪 **Testing Requirements**

### **Unit Tests**
1. **Invoice Creation**:
   - Valid customer data
   - Invalid email addresses
   - Amount validation
   - Stripe API failures

2. **Webhook Processing**:
   - Valid webhook signatures
   - Invalid signatures
   - All invoice event types
   - Message update verification

### **Integration Tests**
1. **End-to-End Flow**:
   - Create invoice via API
   - Receive webhook events
   - Verify message updates
   - Confirm email delivery

2. **Error Scenarios**:
   - Network failures
   - Stripe API errors
   - Invalid webhook data
   - Database update failures

### **Performance Tests**
- Invoice creation response time < 3 seconds
- Webhook processing time < 1 second
- Concurrent invoice creation handling
- Memory usage monitoring

---

## 📊 **Monitoring & Logging**

### **Required Logging**
```php
// Add these logging points
error_log('Invoice creation started for: ' . $customer_email);
error_log('Invoice created successfully: ' . $invoice_id);
error_log('Webhook received: ' . $event_type . ' for invoice: ' . $invoice_id);
error_log('Message updated: ' . $message_id . ' with status: ' . $new_status);
```

### **Error Tracking**
- Failed invoice creations
- Webhook signature failures
- Message update failures
- Stripe API errors

### **Success Metrics**
- Invoice creation success rate
- Email delivery confirmation
- Payment completion rate
- Average payment time

This comprehensive backend API specification provides everything needed to implement the true Stripe Invoice API integration for the V2 enhancement.