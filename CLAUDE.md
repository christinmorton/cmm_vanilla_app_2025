# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production using Vite
- `npm run preview` - Preview production build locally

### Styling
- Main styles are compiled from `scss/main.scss` which imports Bootstrap and custom styles
- CSS output goes to `styles.css` (legacy, but still used)
- Uses Bootstrap 5.3 with custom CSS variables and overrides

## Architecture

### Project Structure
This is a **multi-page portfolio website** built with Vite as the build tool. It's a static site with multiple HTML entry points defined in `vite.config.js`.

### Key Technologies
- **Build Tool**: Vite with multi-page configuration
- **Styling**: Bootstrap 5.3 + custom Sass + CSS custom properties
- **3D Graphics**: Three.js for background animations and visual effects
- **Animations**: GSAP for smooth animations
- **Dependencies**: jQuery (legacy), Swiper for carousels, various icon libraries

### HTML Pages Structure
All pages follow the same structure with:
- Fixed navigation header with logo and offcanvas menu
- Side navigation (floating on desktop, bottom bar on mobile)
- Main content area
- Shared SVG sprite for icons
- Consistent footer with social links

### JavaScript Architecture
- **Main Entry**: `js/main.js` - Creates animated Three.js background with particles and geometric shapes
- **Modular Code**: `js/modules/WindowBackground.js` - Class-based Three.js background component (currently unused but available)
- **Legacy Scripts**: `js/script.js` and `js/plugins.js` for jQuery-based interactions

### Styling System
- **CSS Variables**: Extensive use of custom properties in `:root` for theming
- **Primary Color**: `#029a2d` (green) with gradient backgrounds from dark blue (`#120D44`) to navy (`#0C0930`)
- **Typography**: Roboto Mono for headings, Roboto for body text
- **Responsive**: Mobile-first approach with Bootstrap grid and custom breakpoints
- **Component Overrides**: Custom styles for Bootstrap components (buttons, navigation, forms, etc.)

### Asset Management
- **Images**: Static assets in `images/` folder including profile photos, logos, project screenshots
- **3D Models**: GLTF/GLB files in `media/3d_models/` with geometric shapes (hexagon, square, triangle)
- **Documents**: Resume files in `media/documents/`
- **Fonts**: Icon fonts in `css/fonts/` (icofont, themify)

### Build Configuration
The Vite config defines multiple entry points for each HTML page, enabling proper asset optimization and code splitting for the multi-page setup.

## Development Notes

### Styling Workflow
- Edit styles in `scss/main.scss` 
- Bootstrap is imported from node_modules with custom variable overrides
- CSS custom properties provide theme consistency across components

### 3D Background System
- `js/main.js` creates an animated background with Three.js
- Includes rotating cube, particle sphere, and scattered particle field
- Uses WebGL renderer with automatic device pixel ratio optimization
- Animations run on requestAnimationFrame loop

### Page Navigation
- Side navigation shows active state and uses SVG icons
- Responsive design: floating sidebar on desktop, bottom bar on mobile
- Offcanvas menu for mobile with social links and profile image

### Color Scheme
The site uses a dark theme with:
- Gradient background: radial-gradient from `#120D44` to `#0C0930`
- Primary accent: `#029a2d` (green)
- Text: White (`#FFFFFF`) 
- Interactive elements use primary color for hover/active states