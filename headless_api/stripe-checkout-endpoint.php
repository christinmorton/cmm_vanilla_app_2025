<?php
/**
 * WordPress Stripe Checkout Session API Endpoint
 * 
 * Add this to your WordPress theme's functions.php file or create as a plugin
 * 
 * This creates an API endpoint at: /wp-json/cmm/v1/create-checkout-session
 */

// Add this to your WordPress theme's functions.php file
add_action('rest_api_init', 'register_stripe_checkout_endpoint');

function register_stripe_checkout_endpoint() {
    register_rest_route('cmm/v1', '/create-checkout-session', array(
        'methods' => 'POST',
        'callback' => 'create_stripe_checkout_session',
        'permission_callback' => '__return_true', // You may want to add authentication here
    ));
}

function create_stripe_checkout_session($request) {
    // Get request parameters
    $params = $request->get_json_params();
    
    // Validate required parameters
    if (empty($params['price_id'])) {
        return new WP_Error('missing_price_id', 'Price ID is required', array('status' => 400));
    }
    
    // Set your Stripe secret key (use environment variables in production)
    $stripe_secret_key = defined('STRIPE_SECRET_KEY_DEV') 
        ? STRIPE_SECRET_KEY_DEV 
        : 'sk_test_NuBGPhgcMV4axta3HdUH1rcL00ZCOgrrxI'; // Your test key
    
    // Include Stripe PHP library (install via Composer or download)
    // For now, we'll use curl to make the API call
    
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
            'success_url' => home_url('/payment-success.html?session_id={CHECKOUT_SESSION_ID}') . 
                            '&message_id=' . urlencode($params['message_id'] ?? '') . 
                            '&deposit_type=' . urlencode($params['deposit_type'] ?? ''),
            'cancel_url' => home_url('/checkout.html') . '?message_id=' . urlencode($params['message_id'] ?? ''),
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
            return new WP_Error('stripe_request_failed', 'Failed to connect to Stripe', array('status' => 500));
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code !== 200) {
            error_log('Stripe API Error: ' . $body);
            return new WP_Error('stripe_api_error', 
                isset($data['error']['message']) ? $data['error']['message'] : 'Stripe API error', 
                array('status' => $status_code)
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

/**
 * Helper function to flatten nested arrays for Stripe API
 */
function flatten_array($array, $prefix = '') {
    $result = array();
    
    foreach ($array as $key => $value) {
        $new_key = $prefix === '' ? $key : $prefix . '[' . $key . ']';
        
        if (is_array($value)) {
            if (array_keys($value) === range(0, count($value) - 1)) {
                // Numeric array
                foreach ($value as $index => $item) {
                    if (is_array($item)) {
                        $result = array_merge($result, flatten_array($item, $new_key . '[' . $index . ']'));
                    } else {
                        $result[$new_key . '[' . $index . ']'] = $item;
                    }
                }
            } else {
                // Associative array
                $result = array_merge($result, flatten_array($value, $new_key));
            }
        } else {
            $result[$new_key] = $value;
        }
    }
    
    return $result;
}

/**
 * Add Stripe configuration to wp-config.php or use environment variables
 * 
 * define('STRIPE_PUBLISHABLE_KEY_DEV', 'pk_test_YOUR_KEY_HERE');
 * define('STRIPE_SECRET_KEY_DEV', 'sk_test_YOUR_KEY_HERE');
 * define('STRIPE_PUBLISHABLE_KEY_PROD', 'pk_live_YOUR_KEY_HERE');
 * define('STRIPE_SECRET_KEY_PROD', 'sk_live_YOUR_KEY_HERE');
 */
?>