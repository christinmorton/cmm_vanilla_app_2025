<?php
/**
 * UPDATED WordPress Stripe Checkout Session API Endpoint
 * 
 * Replace the existing function in your functions.php with this updated version
 * This version uses URLs passed from the frontend instead of home_url()
 */

function create_stripe_checkout_session($request) {
    // Get request parameters
    $params = $request->get_json_params();
    
    // Validate required parameters with enhanced error details
    if (empty($params['price_id'])) {
        return new WP_Error('missing_price_id', 'Price ID is required', array(
            'status' => 400,
            'error_type' => 'validation_error',
            'field' => 'price_id',
            'timestamp' => current_time('mysql')
        ));
    }
    
    // Validate price_id format (Stripe price IDs start with 'price_')
    if (!preg_match('/^price_[a-zA-Z0-9_]+$/', $params['price_id'])) {
        return new WP_Error('invalid_price_id', 'Invalid Price ID format', array(
            'status' => 400,
            'error_type' => 'validation_error',
            'field' => 'price_id',
            'provided_value' => $params['price_id'],
            'timestamp' => current_time('mysql')
        ));
    }
    
    // Set your Stripe secret key - use your actual test key
    $stripe_secret_key = 'sk_test_NuBGPhgcMV4axta3HdUH1rcL00ZCOgrrxI'; // Your test key from .env
    
    // Use WordPress HTTP API - no external libraries needed
    
    try {
        // Prepare checkout session data
        $checkout_data = array(
            'mode' => 'payment',
            'line_items' => array(
                array(
                    'price' => $params['price_id'],
                    'quantity' => 1,
                )
            ),
            // Use URLs passed from frontend instead of home_url()
            'success_url' => !empty($params['success_url']) 
                ? $params['success_url'] 
                : home_url('/payment-success.html?session_id={CHECKOUT_SESSION_ID}') . 
                  '&message_id=' . urlencode($params['message_id'] ?? '') . 
                  '&deposit_type=' . urlencode($params['deposit_type'] ?? ''),
            'cancel_url' => !empty($params['cancel_url']) 
                ? $params['cancel_url']
                : home_url('/checkout.html') . '?message_id=' . urlencode($params['message_id'] ?? ''),
        );
        
        // Add customer email if provided
        if (!empty($params['customer_email']) && $params['customer_email'] !== 'Please provide your email during checkout') {
            $checkout_data['customer_email'] = $params['customer_email'];
        }
        
        // Add metadata (this works with server-side sessions)
        $checkout_data['metadata'] = array(
            'message_id' => $params['message_id'] ?? '',
            'chain_id' => $params['chain_id'] ?? '',
            'project_type' => $params['project_type'] ?? '',
            'deposit_type' => $params['deposit_type'] ?? '',
            'source' => 'wordpress_checkout'
        );
        
        // Make API call to Stripe
        $response = wp_remote_post('https://api.stripe.com/v1/checkout/sessions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $stripe_secret_key,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ),
            'body' => http_build_query(flatten_array($checkout_data)),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            error_log('WordPress HTTP Error: ' . $error_message);
            
            return new WP_Error('stripe_request_failed', 
                'Failed to connect to Stripe: ' . $error_message, 
                array(
                    'status' => 500,
                    'error_type' => 'connection_error',
                    'wp_error_code' => $response->get_error_code(),
                    'wp_error_message' => $error_message,
                    'timestamp' => current_time('mysql')
                )
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code !== 200) {
            error_log('Stripe API Error: ' . $body);
            
            // Enhanced error details for better frontend analytics
            $error_details = array(
                'status' => $status_code,
                'stripe_error_code' => isset($data['error']['code']) ? $data['error']['code'] : null,
                'stripe_error_type' => isset($data['error']['type']) ? $data['error']['type'] : null,
                'stripe_error_message' => isset($data['error']['message']) ? $data['error']['message'] : 'Unknown Stripe error',
                'request_id' => isset($data['error']['request_id']) ? $data['error']['request_id'] : null,
                'timestamp' => current_time('mysql'),
            );
            
            return new WP_Error('stripe_api_error', 
                $error_details['stripe_error_message'], 
                $error_details
            );
        }
        
        // Return the checkout session URL
        return array(
            'success' => true,
            'checkout_url' => $data['url'],
            'session_id' => $data['id'],
        );
        
    } catch (Exception $e) {
        error_log('Stripe Checkout Error: ' . $e->getMessage());
        return new WP_Error('checkout_error', 'Failed to create checkout session', array('status' => 500));
    }
}

// Keep the rest of your existing functions (flatten_array, etc.) unchanged
?>