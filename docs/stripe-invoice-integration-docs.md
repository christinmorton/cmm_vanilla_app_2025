# Stripe Invoice Integration with Vanilla JS Frontend & Headless WordPress Backend

## Project Overview

This documentation outlines the implementation of a Stripe invoice system for a vanilla JavaScript frontend paired with a headless WordPress backend. The solution focuses on security by keeping all Stripe secret API operations on the server-side while providing a simple client-side form submission experience.

## Architecture Overview

- **Frontend**: Vanilla JavaScript with HTML, SCSS
- **Backend**: Headless WordPress serving as API application
- **Payment Processing**: Stripe Invoice API (email-based payment collection)

## Why This Approach?

### Security Benefits
- Secret Stripe API keys remain server-side only
- No sensitive card data handling on the client
- Minimal PCI compliance burden
- Stripe handles all payment processing on secure, hosted pages

### Simplified Workflow
1. Customer fills out form on your site
2. Form data sent to WordPress backend API
3. WordPress creates and sends Stripe invoice
4. Customer receives email with secure payment link
5. Customer pays on Stripe-hosted page

## Implementation Guide

### 1. Stripe PHP Library Integration

#### Manual Installation (No Composer)

Since we're using a custom `include` directory pattern in the WordPress theme:

1. **Download Stripe PHP Library**
   - Visit [Stripe PHP Library GitHub](https://github.com/stripe/stripe-php)
   - Download ZIP and extract

2. **Place in Theme Structure**
   ```
   theme-name/
   ├── includes/
   │   ├── vendor/
   │   │   └── stripe-php/
   │   │       ├── lib/
   │   │       └── init.php
   │   └── your-custom-autoloader.php
   ```

3. **Update Autoloader**
   ```php
   // In functions.php or main theme file
   
   // Load custom autoloader first
   require_once get_template_directory() . '/includes/your-custom-autoloader.php';
   
   // Include Stripe library
   $stripe_path = get_template_directory() . '/includes/vendor/stripe-php/init.php';
   if (file_exists($stripe_path)) {
       require_once $stripe_path;
   } else {
       error_log('Stripe PHP library not found at: ' . $stripe_path);
   }
   ```

### 2. WordPress REST API Endpoint

Create a custom endpoint to handle invoice creation requests:

```php
// Register the endpoint
add_action('rest_api_init', 'register_stripe_invoice_endpoint');

function register_stripe_invoice_endpoint() {
    register_rest_route('my-app/v1', '/create-invoice', array(
        'methods' => 'POST',
        'callback' => 'handle_create_invoice_request',
        'permission_callback' => '__return_true', // Adjust security as needed
    ));
}
```

### 3. Invoice Creation Handler

```php
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\InvoiceItem;
use Stripe\Invoice;

function handle_create_invoice_request($request) {
    // Get and validate form data
    $params = $request->get_json_params();
    $customer_email = sanitize_email($params['email']);
    $amount_in_cents = intval($params['amount']);
    $description = sanitize_text_field($params['item_description']);

    if (empty($customer_email) || $amount_in_cents <= 0) {
        return new WP_REST_Response([
            'success' => false, 
            'message' => 'Invalid data provided.'
        ], 400);
    }

    // Initialize Stripe (store key securely in wp-config.php)
    $stripe_secret_key = 'YOUR_SECRET_KEY';
    
    try {
        Stripe::setApiKey($stripe_secret_key);

        // Find or create customer
        $existing_customers = Customer::all(['email' => $customer_email, 'limit' => 1])->data;
        if (empty($existing_customers)) {
            $customer = Customer::create(['email' => $customer_email]);
        } else {
            $customer = $existing_customers[0];
        }

        // Create invoice item
        InvoiceItem::create([
            'customer' => $customer->id,
            'amount' => $amount_in_cents,
            'currency' => 'usd',
            'description' => $description,
        ]);
        
        // Create and send invoice
        $invoice = Invoice::create([
            'customer' => $customer->id,
            'collection_method' => 'send_invoice',
            'days_until_due' => 7,
        ]);

        $invoice->sendInvoice();

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Invoice sent successfully to ' . $customer_email,
            'invoice_id' => $invoice->id
        ], 200);

    } catch (\Stripe\Exception\ApiErrorException $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    } catch (\Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An unexpected error occurred.'
        ], 500);
    }
}
```

### 4. Frontend JavaScript Integration

```javascript
document.getElementById('checkout-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const amount = 1000; // $10.00 in cents
    const item_description = "One-time service purchase";
    
    const data = {
        email: email,
        amount: amount,
        item_description: item_description
    };

    try {
        const response = await fetch('YOUR_WORDPRESS_URL/wp-json/my-app/v1/create-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            // Handle success (redirect, show confirmation, etc.)
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('A network error occurred. Please try again.');
    }
});
```

## Security Considerations

### API Key Management
- Store Stripe secret keys in `wp-config.php`, not in theme files
- Use environment variables when possible
- Never expose secret keys in client-side code

### Example wp-config.php Setup
```php
// In wp-config.php
define('STRIPE_SECRET_KEY', 'sk_test_...' ); // Test key
// define('STRIPE_SECRET_KEY', 'sk_live_...' ); // Live key for production
```

Then in your handler:
```php
$stripe_secret_key = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '';
```

## Webhook Integration (Recommended)

Set up Stripe webhooks to handle payment confirmations:

1. **Create Webhook Endpoint**
   ```php
   add_action('rest_api_init', 'register_stripe_webhook_endpoint');
   
   function register_stripe_webhook_endpoint() {
       register_rest_route('my-app/v1', '/stripe-webhook', array(
           'methods' => 'POST',
           'callback' => 'handle_stripe_webhook',
           'permission_callback' => '__return_true',
       ));
   }
   ```

2. **Handle Webhook Events**
   ```php
   function handle_stripe_webhook($request) {
       $payload = $request->get_body();
       $sig_header = $request->get_header('stripe-signature');
       
       try {
           $event = \Stripe\Webhook::constructEvent(
               $payload, 
               $sig_header, 
               'YOUR_WEBHOOK_SECRET'
           );
           
           switch ($event->type) {
               case 'invoice.payment_succeeded':
                   // Handle successful payment
                   break;
               case 'invoice.payment_failed':
                   // Handle failed payment
                   break;
           }
           
           return new WP_REST_Response(['status' => 'success'], 200);
       } catch (\Exception $e) {
           return new WP_REST_Response(['error' => $e->getMessage()], 400);
       }
   }
   ```

## Theme vs Plugin Considerations

### Current Setup (Theme-based)
**Pros:**
- Simple organization
- All application logic in one place
- Suitable for headless architecture

**Cons:**
- Code tied to theme (lost if theme changes)
- Not following WordPress best practices

### Recommendation
For a headless WordPress setup where theme changes are unlikely, the current include directory approach is acceptable. However, consider migrating to a custom plugin for better maintainability.

## Testing

1. **Test with Stripe Test Keys**
   - Use `sk_test_...` keys for development
   - Test various scenarios (success, failure, invalid data)

2. **Email Testing**
   - Verify invoice emails are delivered
   - Test payment flow from customer perspective

3. **Error Handling**
   - Test network failures
   - Test invalid form data
   - Test Stripe API errors

## Deployment Checklist

- [ ] Replace test keys with live keys
- [ ] Configure webhook endpoints in Stripe dashboard
- [ ] Test in production environment
- [ ] Monitor error logs
- [ ] Set up payment confirmation workflows

## Troubleshooting

### Common Issues
1. **Library Not Found**: Check file paths and autoloader inclusion
2. **API Key Errors**: Verify key format and permissions
3. **CORS Issues**: Ensure proper headers for cross-origin requests
4. **Webhook Failures**: Verify endpoint URL and signature validation

### Debugging Tips
- Enable WordPress debug logging
- Check Stripe dashboard for API call logs
- Test API endpoints with tools like Postman
- Monitor browser network tab for frontend issues