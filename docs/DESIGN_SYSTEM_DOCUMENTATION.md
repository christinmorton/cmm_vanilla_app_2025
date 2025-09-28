# Design System Documentation

## Overview

The CM Portfolio 2025 design system is a comprehensive SCSS-based design language that provides consistent visual identity, component architecture, and responsive behavior across the portfolio website. The system supports multiple template modes and integrates seamlessly with the 3D theme system.

## Architecture

### File Structure
```
scss/
├── main.scss                    # Main entry point and imports
├── _preloader.scss             # Loading state components
├── _header-navigation.scss     # Navigation components
├── _contact-form.scss          # Form styling and validation
├── _sales-funnel.scss          # Sales funnel specific styles
├── _checkout.scss              # Checkout flow styling
├── _services-modern.scss       # Modern service page layout
├── _services-hero.scss         # Service hero components
├── _carousel-base.scss         # Carousel foundation
├── _carousel-hero.scss         # Hero carousel variants
├── _carousel-cta.scss          # CTA carousel components
├── _social-section.scss        # Social media components
├── _diagonal-stats.scss        # Statistics display
├── _stats-components.scss      # Stat component variants
└── buttons/                    # Button component library
    ├── _buttons.scss           # Base button styles
    ├── _action-button.scss     # Primary action buttons
    ├── _filter-button.scss     # Filter/toggle buttons
    ├── _form-buttons.scss      # Form-specific buttons
    ├── _card-button.scss       # Card action buttons
    ├── _error-button.scss      # Error state buttons
    ├── _plan-button.scss       # Pricing plan buttons
    └── _story-button.scss      # Storytelling buttons
```

## Design Tokens

### Color System
**CSS Custom Properties** defined in `:root`

#### Primary Brand Colors
```scss
:root {
  --primary-color: #029a2d;        // Primary green
  --secondary-color: ;             // Reserved for future use
  --dark-color: #2D2D2D;          // Dark text/backgrounds
  --white-color: #FFFFFF;         // Pure white
  --grey-color: #777777;          // Mid-tone grey
  --body-text-color: #333333;     // Body text
  --light-text-color: #929292;    // Light text/captions
  --link-color: #B7C177;          // Link color
  --background-color: #FAFAFA;    // Page background
}
```

#### Template-Specific Themes
**Background Template** (3D mode):
```scss
--bg-template-primary: #1a1a2e;     // Dark primary
--bg-template-secondary: #16213e;    // Dark secondary
--bg-template-accent: var(--primary-color);
```

**Inline Template** (Content mode):
```scss
--inline-template-primary: #f8f9fa;   // Light primary
--inline-template-secondary: #ffffff; // White
--inline-template-accent: var(--primary-color);
--inline-template-text: #333333;     // Dark text
```

**Hybrid Template** (Transitional mode):
```scss
--hybrid-template-primary: #1a1a2e;    // Dark (matches background)
--hybrid-template-secondary: #16213e;   // Dark secondary
--hybrid-template-accent: var(--primary-color);
```

#### Bootstrap Integration
```scss
--bs-dark-rgb: 80, 80, 80;
--bs-gray-100: #EAE5DD;
--bs-gray-300: #DCDCDC;
--bs-body-color-rgb: 53, 53, 53;
--bs-primary-rgb: 255, 63, 46;
--bs-secondary-rgb: 249, 246, 243;
```

### Typography System
```scss
:root {
  --heading-font: "Roboto Mono", serif;  // Monospace for headings
  --body-font: "Roboto", serif;          // Sans-serif for body text
}
```

#### Font Loading (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

#### Usage Patterns
- **Headings**: Use `Roboto Mono` for technical/modern aesthetic
- **Body Text**: Use `Roboto` for readability and clean appearance
- **UI Elements**: Inherit from context (usually `Roboto`)

## Component Library

### 1. Button System
Comprehensive button library with multiple variants and interactive states.

#### Action Button
**File**: `scss/buttons/_action-button.scss`
**Usage**: Primary call-to-action buttons with ripple effects

**Features**:
- Ripple effect on hover (`::before` pseudo-element)
- Rotating arrow icon animation
- Responsive width on mobile
- CSS custom properties for dynamic positioning

**HTML Structure**:
```html
<button class="action-button">
  <span>Button Text</span>
  <div class="button-icon">
    <svg class="arrow-right" width="28" height="28">
      <use xlink:href="#arrow-right"></use>
    </svg>
  </div>
</button>
```

**Key Styles**:
```scss
.action-button {
  background: var(--primary-color);
  padding: 1rem 2rem 1rem 3rem;
  position: relative;
  overflow: hidden;  // Enables ripple effect

  &:hover .arrow-right {
    transform: translateY(-50%) rotate(360deg);
  }

  &::before {  // Ripple effect
    --size: 0;
    content: '';
    position: absolute;
    background: radial-gradient(circle closest-side, #007bff, transparent);
    transition: width .2s ease, height .2s ease;
  }
}
```

#### Button Variants
- **Filter Buttons**: Toggle states for filtering content
- **Form Buttons**: Styled submit buttons for forms
- **Card Buttons**: Actions within card components
- **Error Buttons**: Error state and retry actions
- **Plan Buttons**: Pricing plan selection
- **Story Buttons**: Narrative/content buttons

### 2. Navigation System
**File**: `scss/_header-navigation.scss`

#### Header Navigation
**Fixed Header**: Always visible with transparent background
**Responsive Layout**: Desktop horizontal, mobile hamburger menu

**Structure**:
```scss
.header-nav {
  position: fixed;
  top: 0;
  z-index: 1000;
  background: transparent;
  transition: all 0.3s ease;

  .site-container {
    display: flex;
    justify-content: space-between;
  }
}
```

**Components**:
- **Logo**: Scalable hover effect, image-based
- **Navigation Menu**: Horizontal desktop layout
- **Mobile Menu**: Off-canvas slide-in menu
- **Social Links**: Integrated social media links

#### Mobile Navigation
**Toggle Button**: Hamburger menu with animation
**Slide-in Menu**: Full-screen overlay with smooth transitions
**Social Integration**: Mobile-specific social link styling

### 3. Form System
**File**: `scss/_contact-form.scss`

#### Form Components
**Input Fields**: Consistent styling across all form types
**Validation States**: Error and success visual feedback
**Status Messages**: User feedback for form submissions

**Validation States**:
```scss
.form-input.error,
.form-textarea.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.field-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

**Status Messages**:
```scss
.form-status {
  .form-success {
    background: linear-gradient(135deg, #d1f2eb 0%, #c8f2e4 100%);
    border-left: 4px solid #28a745;
  }

  .form-error {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    border-left: 4px solid #dc3545;
  }
}
```

### 4. Preloader System
**File**: `scss/_preloader.scss`

#### Loading States
**Full-Screen Overlay**: Covers entire viewport during loading
**Gradient Background**: Matches brand aesthetic
**Smooth Transitions**: Coordinated with 3D canvas loading

**Implementation**:
```scss
.preloader {
  position: fixed;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(#120D44, #0C0930);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

body.preloader-active #app {
  opacity: 0;
  transition: opacity 0.3s ease-out;
}
```

#### Loading Coordination
**3D Canvas Integration**: Preloader hides when canvas is ready
**Progressive Enhancement**: Works without JavaScript
**Accessibility**: Respects `prefers-reduced-motion`

### 5. Carousel System
**Files**: `_carousel-base.scss`, `_carousel-hero.scss`, `_carousel-cta.scss`

#### Carousel Variants
**Base Carousel**: Foundation styles for all carousel types
**Hero Carousel**: Large, prominent carousel for main content
**CTA Carousel**: Call-to-action focused carousel

**Features**:
- **Swiper.js Integration**: Professional carousel functionality
- **Responsive Design**: Adaptive breakpoints
- **Touch Support**: Mobile-optimized gestures
- **Accessibility**: Keyboard navigation and screen reader support

### 6. Statistics Components
**Files**: `_stats-components.scss`, `_diagonal-stats.scss`

#### Animated Counters
**Number Animation**: Smooth counting animations
**Intersection Observer**: Triggers when in viewport
**Custom Easing**: Professional animation curves

#### Layout Variants
**Diagonal Stats**: Angular, modern layout
**Standard Stats**: Grid-based traditional layout
**Card Stats**: Contained statistic cards

## Responsive Design

### Breakpoint System
Following Bootstrap 5 conventions:
```scss
// Extra small devices (portrait phones)
@media (max-width: 575.98px) { }

// Small devices (landscape phones)
@media (min-width: 576px) and (max-width: 767.98px) { }

// Medium devices (tablets)
@media (min-width: 768px) and (max-width: 991.98px) { }

// Large devices (desktops)
@media (min-width: 992px) and (max-width: 1199.98px) { }

// Extra large devices (large desktops)
@media (min-width: 1200px) { }
```

### Mobile-First Approach
**Base Styles**: Mobile-optimized by default
**Progressive Enhancement**: Desktop features added via media queries
**Touch Optimization**: Larger touch targets, simplified interactions

### Responsive Patterns
**Navigation**: Hamburger menu on mobile, horizontal on desktop
**Forms**: Full-width inputs on mobile, constrained on desktop
**Buttons**: Full-width CTAs on mobile, inline on desktop
**Carousels**: Single item on mobile, multiple on desktop

## Template Integration

### Background Template
**3D Canvas Integration**: Transparent header over 3D background
**Dark Theme**: Dark color palette optimized for 3D visuals
**Minimal UI**: Reduced visual weight to emphasize 3D content

### Inline Template
**Content Focus**: Traditional web layout with embedded 3D elements
**Light Theme**: Light color palette for readability
**Standard Navigation**: Full navigation with traditional styling

### Hybrid Template
**Dynamic Transitions**: Smooth mode switching between background and inline
**Adaptive Styling**: Changes appearance based on current mode
**Animation Coordination**: Synchronized with GSAP transitions

## Performance Optimizations

### CSS Optimizations
**Custom Properties**: Efficient color management and theming
**Modular SCSS**: Component-based architecture for maintainability
**Minimal Specificity**: Avoids deep nesting and specificity conflicts

### Animation Performance
**CSS Transforms**: Hardware-accelerated animations
**Will-Change Property**: Optimized layer creation
**Transition Debouncing**: Prevents animation conflicts

### Loading Strategy
**Critical CSS**: Above-the-fold styles prioritized
**Component Loading**: Lazy loading of non-essential components
**Font Display**: Optimized font loading strategy

## Accessibility

### WCAG Compliance
**Color Contrast**: All color combinations meet WCAG AA standards
**Focus Management**: Visible focus indicators for keyboard navigation
**Screen Reader Support**: Semantic HTML and ARIA labels

### Interactive Elements
**Touch Targets**: Minimum 44px touch target size
**Keyboard Navigation**: Full keyboard accessibility for all interactions
**Reduced Motion**: Respects `prefers-reduced-motion` settings

### Form Accessibility
**Label Association**: Proper label-input relationships
**Error Identification**: Clear error messaging and identification
**Validation Feedback**: Immediate and clear validation feedback

## Development Guidelines

### SCSS Best Practices
**BEM Methodology**: Block-Element-Modifier naming convention
**Custom Properties**: Use CSS variables for theming and consistency
**Component Isolation**: Avoid global styles affecting components

### Component Development
```scss
// Component structure example
.component-name {
  // Base styles

  &__element {
    // Element styles
  }

  &--modifier {
    // Modifier styles
  }

  &:hover,
  &:focus {
    // Interactive states
  }

  @media (max-width: 767px) {
    // Mobile overrides
  }
}
```

### Integration Points
**JavaScript Coordination**: CSS classes for JavaScript state management
**3D Canvas Integration**: Z-index management and overlay coordination
**Animation Timing**: Synchronized with JavaScript animation libraries

## Maintenance and Updates

### Version Control
**Component Versioning**: Track changes to individual components
**Breaking Changes**: Document any breaking changes to existing components
**Migration Guides**: Provide guidance for updating existing implementations

### Testing Strategy
**Cross-Browser Testing**: Ensure compatibility across target browsers
**Device Testing**: Real device testing for mobile responsiveness
**Accessibility Testing**: Regular accessibility audits and testing

### Documentation Updates
**Component Documentation**: Keep component usage examples current
**Design Token Changes**: Document any updates to design tokens
**Integration Examples**: Provide real-world usage examples

This design system provides the foundation for consistent, accessible, and performant user interface development across the portfolio website, ensuring brand consistency while supporting the advanced 3D theme system and responsive user experience.