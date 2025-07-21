import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        blog: resolve(__dirname, 'blog.html'),
        faqs: resolve(__dirname, 'faqs.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        portfolio_details: resolve(__dirname, 'portfolio-details.html'),
        portfolio_masonry: resolve(__dirname, 'portfolio-masonry.html'),
        reviews: resolve(__dirname, 'reviews.html'),
        services: resolve(__dirname, 'services.html'),
        services_details: resolve(__dirname, 'service-details.html'),
        single_post: resolve(__dirname, 'single-post.html'),
        team: resolve(__dirname, 'team.html'),
      }
    }
  }
});
