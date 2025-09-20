# JavaScript Architecture Optimization

This document outlines the comprehensive modular JavaScript architecture optimization completed for the CMM frontend project.

## Overview

The project was migrated from a monolithic `main.js` approach to a modular architecture with page-specific JavaScript bundles, improving performance, maintainability, and scalability.

## Problem Statement

### Original Issues
- **Asset Injection Failure**: Vite wasn't properly injecting compiled CSS/JS assets into HTML files in production builds
- **Monolithic JavaScript**: Single `main.js` file loaded unnecessary code on every page
- **Performance Impact**: Large bundle sizes and poor code splitting
- **Maintenance Complexity**: All page logic mixed together in one file

### Root Cause
- Incorrect Vite base path configuration (`base: '/'` instead of `base: './'`)
- Lack of page-specific entry points in Vite configuration
- No modular architecture for JavaScript functionality

## Solution Architecture

### Core Components

#### 1. Core Module (`js/core.js`)
Global functionality shared across all pages:
- **PreloadManager**: Handles loading animations and transitions
- **HeaderNavigation**: Mobile menu and navigation interactions
- **AnalyticsTracker**: Event tracking and analytics
- **PageTransitionManager**: Smooth page transitions with 3D canvas

```javascript
// Core module structure
import PreloadManager from './modules/PreloadManager.js';
import HeaderNavigation from './modules/HeaderNavigation.js';
import analytics from './modules/AnalyticsTracker.js';
import PageTransitionManager from './modules/PageTransitionManager.js';

// Global components available to all pages
window.coreComponents = { preloader, navigation, analytics, pageTransitions };
```

#### 2. Page-Specific Modules (`js/pages/*.js`)
Individual modules for each page's unique functionality:
- Import only required modules
- Handle page-specific 3D canvas configurations
- Manage existing page modules (ContactForm, CheckoutPage, etc.)

### 3D Canvas Integration

Each page module configures the canvas based on template type:

```javascript
// Template configuration from HTML data attribute
const template = document.body.dataset.template;

if (template === 'background') {
  cm.setMode('background');
  cm.mountTo(bgHost);
}

if (template === 'hybrid') {
  cm.setMode('hybrid');
  cm.mountTo(bgHost);
  initHybridMode(cm, btnExpand, btnCollapse, hybridHost, bgHost);
}
```

### Canvas Template Types
- **Background**: Full-screen canvas behind content (`data-template="background"`)
- **Hybrid**: Starts fullscreen, collapses to inline on scroll (`data-template="hybrid"`)
- **Inline**: Fixed inline canvas section (`data-template="inline"`)

## Implementation Details

### Vite Configuration Updates

```javascript
// Added JavaScript entry points for optimal bundling
export default defineConfig(({ command, mode }) => {
  return {
    base: './', // Fixed asset resolution
    build: {
      rollupOptions: {
        input: {
          // JavaScript entry points
          'js-core': resolve(__dirname, 'js/core.js'),
          'js-home': resolve(__dirname, 'js/pages/home.js'),
          'js-about': resolve(__dirname, 'js/pages/about.js'),
          'js-service': resolve(__dirname, 'js/pages/service.js'),
          'js-contact': resolve(__dirname, 'js/pages/contact.js'),
          'js-checkout': resolve(__dirname, 'js/pages/checkout.js'),
          'js-consultation-booking': resolve(__dirname, 'js/pages/consultation-booking.js'),
          'js-project-quote': resolve(__dirname, 'js/pages/project-quote.js'),
          'js-free-consultation': resolve(__dirname, 'js/pages/free-consultation.js'),
          'js-project-discovery': resolve(__dirname, 'js/pages/project-discovery.js'),
          // Additional modules for future use
          'js-payment-success': resolve(__dirname, 'js/pages/payment-success.js'),
          'js-payment-cancel': resolve(__dirname, 'js/pages/payment-cancel.js'),
          'js-simple': resolve(__dirname, 'js/pages/simple.js'),
        }
      }
    }
  }
});
```

### HTML Template Updates

All HTML files updated to use modular script architecture:

```html
<!-- Old approach -->
<script type="module" src="js/main.js"></script>
<script type="module" src="js/modules/SomeModule.js"></script>

<!-- New modular approach -->
<!-- Core functionality (needed on all pages) -->
<script type="module" src="js/core.js"></script>
<!-- Page specific functionality -->
<script type="module" src="js/pages/[page-name].js"></script>
```

## Pages Optimized

### Business-Critical Pages (Production Ready)

| Page | Module | Canvas Template | Key Features |
|------|--------|----------------|--------------|
| `index.html` | `home.js` | hybrid | CarouselManager, 3D transitions |
| `about.html` | `about.js` | hybrid | TabSwitcher, AnimatedCounter |
| `service.html` | `service.js` | hybrid | 3D canvas only |
| `contact.html` | `contact.js` | hybrid | ContactForm integration |
| `checkout.html` | `checkout.js` | background | CheckoutPage, payment flow |
| `consultation-booking.html` | `consultation-booking.js` | hybrid | ConsultationBooking form |
| `project-quote.html` | `project-quote.js` | background | ProjectQuotePage functionality |
| `free-consultation.html` | `free-consultation.js` | hybrid | ConsultationPage integration |
| `project-discovery.html` | `project-discovery.js` | hybrid | ProjectDiscovery, file uploads |

### Lower Priority Pages (Future-Proofed)

| Page | Module | Purpose |
|------|--------|---------|
| `payment-success.html` | `payment-success.js` | Payment completion handling |
| `payment-cancel.html` | `payment-cancel.js` | Payment cancellation handling |
| All thank you pages | `simple.js` | Shared simple page functionality |

### Thank You Pages Using Shared Module

- `consultation-thank-you.html`
- `consultation-booking-thank-you.html`
- `project-discovery-thank-you.html` (with preserved analytics)
- `quote-thank-you.html`
- `thank-you.html`

## Performance Benefits

### Before Optimization
- Single large JavaScript bundle loaded on every page
- Unnecessary code execution
- Poor caching due to monolithic structure
- Asset injection failures in production

### After Optimization
- **Code Splitting**: Each page loads only required JavaScript
- **Improved Caching**: Core functionality cached separately from page-specific code
- **Faster Load Times**: Reduced initial bundle sizes
- **Better Performance**: No unnecessary module initialization
- **Production Ready**: Proper asset injection and optimization

## Development Workflow

### Adding New Pages

1. Create page-specific module: `js/pages/new-page.js`
2. Import required functionality:
   ```javascript
   import DesignGridWindow from '../modules/DesignGridTypes/index.js';
   import YourPageModule from '../modules/YourPageModule.js';
   ```
3. Configure canvas based on template type
4. Update HTML with script tags:
   ```html
   <script type="module" src="js/core.js"></script>
   <script type="module" src="js/pages/new-page.js"></script>
   ```
5. If production-ready, add to Vite config entry points

### Canvas Template Selection

Choose template based on page design:
- **Background**: Payment pages, checkout flows
- **Hybrid**: Marketing pages, forms (starts fullscreen, collapses on scroll)
- **Inline**: Content pages where canvas is always visible inline

### Module Integration

When integrating existing modules:

```javascript
// Wait for core components
const { preloader, analytics } = await waitForCore();

// Initialize existing module with analytics
const yourModule = new YourModule({
  analyticsTracker: analytics
});
```

## File Structure

```
js/
├── core.js                    # Global functionality
├── pages/                     # Page-specific modules
│   ├── home.js               # Index page
│   ├── about.js              # About page
│   ├── service.js            # Services page
│   ├── contact.js            # Contact page
│   ├── checkout.js           # Checkout page
│   ├── consultation-booking.js
│   ├── project-quote.js
│   ├── free-consultation.js
│   ├── project-discovery.js
│   ├── payment-success.js
│   ├── payment-cancel.js
│   └── simple.js             # Shared simple page functionality
└── modules/                   # Existing feature modules
    ├── PreloadManager.js
    ├── HeaderNavigation.js
    ├── AnalyticsTracker.js
    ├── ContactForm.js
    ├── CheckoutPage.js
    └── ... (other existing modules)
```

## Testing and Validation

### Production Build Testing
```bash
npm run build
npm run preview
```

### Validation Checklist
- [ ] All pages load without JavaScript errors
- [ ] 3D canvas renders correctly on each template type
- [ ] Page-specific functionality works as expected
- [ ] Analytics tracking functions properly
- [ ] Mobile navigation operates correctly
- [ ] Form submissions work (contact, checkout, etc.)

## Future Considerations

### Excluded Pages
These pages are not in the Vite build configuration but follow the same pattern:
- `portfolio.html`
- `blog.html`
- `single-post.html`
- `404.html`

When ready for production, simply add their entry points to Vite config.

### Scalability
The modular architecture supports:
- Easy addition of new pages
- Independent module updates
- Selective feature loading
- A/B testing capabilities
- Progressive enhancement

## Troubleshooting

### Common Issues

**Canvas not loading:**
- Check `data-template` attribute on `<body>`
- Verify canvas host elements exist (`#bgHost`, `#hybridHost`, etc.)
- Ensure DesignGridWindow module is imported

**Core components not available:**
- Verify `js/core.js` loads before page modules
- Check `waitForCore()` promise resolution
- Confirm `window.coreComponents` is set

**Asset injection failures:**
- Ensure Vite `base: './'` configuration
- Check build output for proper asset paths
- Verify HTML files use relative script paths

## Migration Notes

This optimization maintains backward compatibility with existing modules while providing a foundation for future development. All existing functionality is preserved, with improved performance and maintainability.

The architecture is designed to scale with the project's growth and can easily accommodate new features, pages, and optimization requirements.