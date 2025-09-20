import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          // HTML entry points
          main: resolve(__dirname, 'index.html'),
          about: resolve(__dirname, 'about.html'),
          services: resolve(__dirname, 'service.html'), // Note: renamed to 'services' for better URL
          contact: resolve(__dirname, 'contact.html'),

          // JavaScript entry points (for optimal bundling)
          'js-core': resolve(__dirname, 'js/core.js'),
          'js-home': resolve(__dirname, 'js/pages/home.js'),
          'js-about': resolve(__dirname, 'js/pages/about.js'),

          // Consultation and booking flows
          consultation: resolve(__dirname, 'free-consultation.html'),
          'consultation/book': resolve(__dirname, 'consultation-booking.html'),
          'consultation/book/success': resolve(__dirname, 'consultation-booking-thank-you.html'),
          'consultation/success': resolve(__dirname, 'consultation-thank-you.html'),

          // Project discovery and quotes
          'project/discovery': resolve(__dirname, 'project-discovery.html'),
          'project/discovery/success': resolve(__dirname, 'project-discovery-thank-you.html'),
          'project/quote': resolve(__dirname, 'project-quote.html'),
          'project/quote/success': resolve(__dirname, 'quote-thank-you.html'),

          // Payment and checkout flows
          checkout: resolve(__dirname, 'checkout.html'),
          'payment/success': resolve(__dirname, 'payment-success.html'),
          'payment/cancel': resolve(__dirname, 'payment-cancel.html'),

          // General thank you page
          'thank-you': resolve(__dirname, 'thank-you.html'),

          // Excluded from build (not production ready):
          // - 404.html
          // - portfolio.html
          // - portfolio-details.html
          // - portfolio-masonry.html
          // - blog.html
          // - single-post.html
        },
        output: {
          entryFileNames: (chunkInfo) => {
            // Custom entry file naming for clean URLs
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId && facadeModuleId.endsWith('.html')) {
              // Keep the key name as the path structure
              return `assets/[name]-[hash].js`;
            }
            return `assets/[name]-[hash].js`;
          }
        }
      }
    },
    define: {
      __WORDPRESS_APP_USER__: JSON.stringify(env.WORDPRESS_APP_USER),
      __WORDPRESS_APP_PASSWORD__: JSON.stringify(env.WORDPRESS_APP_PASSWORD),
      __WORDPRESS_API_BASE_DEV__: JSON.stringify(env.WORDPRESS_API_BASE_DEV),
      __WORDPRESS_API_BASE_PROD__: JSON.stringify(env.WORDPRESS_API_BASE_PROD),
      __STRIPE_PUBLISHABLE_KEY_DEV__: JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY_DEV),
      __STRIPE_PUBLISHABLE_KEY_PROD__: JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY_PROD)
    }
  }
});
