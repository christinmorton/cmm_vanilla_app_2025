import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          checkout: resolve(__dirname, 'checkout.html'),
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
