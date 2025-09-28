# 3D Theme System Documentation

## Overview

The 3D theme system is a sophisticated Three.js-based visual enhancement that provides animated backgrounds and interactive elements across the portfolio website. The system offers multiple rendering modes, responsive design integration, and seamless page transitions with preloader coordination.

## Architecture Components

### 1. Core System (`js/main.js`)
The main entry point that orchestrates all 3D functionality and page-level integrations.

**Key Features:**
- **Preloader Integration**: Coordinates 3D canvas initialization with page loading states
- **Multi-Mode Support**: Background, inline, and hybrid rendering modes
- **Page Transitions**: Smooth transitions between pages while maintaining 3D context
- **Component Coordination**: Manages interaction between 3D canvas and UI components

**Template Detection:**
```javascript
const template = document.body.dataset.template; // "background" | "inline" | "hybrid"
```

### 2. Design Grid Window (`js/modules/DesignGridTypes/Default.js`)
The primary 3D canvas management class that handles rendering and viewport control.

**Core Functionality:**
- **Three.js Scene Management**: Scene, camera, renderer, and controls
- **Multi-Host Mounting**: Dynamically moves canvas between different DOM containers
- **Responsive Sizing**: Automatic canvas resizing based on host container
- **Viewport Grid System**: Maps HTML elements to 3D world coordinates

**Rendering Configuration:**
```javascript
this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default'
});
```

### 3. Sizing System (`js/modules/sizing.js`)
Handles responsive canvas sizing and device pixel ratio optimization.

**Features:**
- **Mode-Aware Sizing**: Different sizing logic for background vs. inline modes
- **Performance Throttling**: Prevents excessive resize calculations
- **Device Pixel Ratio**: Optimized for high-DPI displays
- **Host Element Integration**: Respects container boundaries

**Mode Behaviors:**
- **Background Mode**: Always uses full viewport dimensions
- **Inline/Hybrid Mode**: Uses host element boundaries

### 4. Viewport Grid System (`js/modules/ViewportGrid.js`)
Provides coordinate transformation between HTML layout and 3D world space.

**Capabilities:**
- **Screen-to-World Mapping**: Converts pixel coordinates to 3D positions
- **HTML Element Positioning**: Maps DOM elements to 3D space
- **Camera-Relative Coordinates**: Maintains consistent positioning across viewport changes

## Rendering Modes

### Background Mode
**Usage**: Full-screen background canvas behind all content
**DOM Structure**:
```html
<body data-template="background">
    <div id="bgHost" class="bg-canvas-host"></div>
    <!-- Page content layered on top -->
</body>
```

**Characteristics:**
- Fixed positioning covering entire viewport
- Transparent background allowing content overlay
- Continuous animation loop
- No user interaction with 3D elements

### Inline Mode
**Usage**: Canvas embedded within page content flow
**DOM Structure**:
```html
<div id="inlineHost"></div>
```

**Characteristics:**
- Flows with page content
- Respects container dimensions
- Can be positioned anywhere in layout
- Optional intersection observer for performance

### Hybrid Mode
**Usage**: Dynamic transition between background and inline modes
**DOM Structure**:
```html
<body data-template="hybrid">
    <div id="bgHost" class="bg-canvas-host"></div>
    <header id="hybridHost" class="hybrid-banner" hidden></header>
    <!-- Collapse/expand controls -->
</body>
```

**Characteristics:**
- Starts in background mode
- Automatically collapses to inline on scroll
- Smooth GSAP-powered transitions
- User controls for manual expand/collapse

**Transition Logic:**
1. **Scroll Detection**: Triggers at configurable threshold (150px)
2. **Animation Sequence**: GSAP timeline with height transitions
3. **Canvas Migration**: Seamlessly moves between hosts
4. **State Management**: Prevents overlapping animations

## Integration Systems

### Page Transitions
**Coordinated by**: `PageTransitionManager`
**Features:**
- Maintains 3D context during page changes
- Preloader coordination
- Component reinitialization
- Smooth visual continuity

**Event Flow:**
```javascript
document.addEventListener('page-transition-complete', () => {
    // Reinitialize all components
    carouselManager.reinitializeAfterTransition();
    tabSwitcher.reinitialize();
    initAnimatedCounters();
});
```

### Preloader Integration
**Sequence:**
1. Preloader shows immediately on page load
2. 3D canvas initializes in background
3. Canvas reports ready state via callback
4. Preloader hides with smooth transition
5. Page content becomes interactive

### Component Coordination
**Global Accessibility:**
```javascript
window.pageTransitions = pageTransitions;
window.carouselManager = carouselManager;
window.animatedCounters = animatedCounters;
```

**Purpose**: Allows other modules to interact with 3D system and coordinate animations.

## Styling Integration

### CSS Classes and Selectors
```scss
.bg-canvas-host {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
}

.hybrid-banner {
    position: relative;
    overflow: hidden;
    height: 0;

    &.expanded {
        height: 40vh;
    }
}
```

### Responsive Considerations
- **Mobile Optimization**: Reduced canvas complexity on smaller screens
- **Performance Scaling**: Automatic quality adjustment based on device capabilities
- **Touch Interaction**: Disabled controls on mobile for better UX

## Performance Optimizations

### Rendering Optimizations
- **Animation Loop Management**: Uses `setAnimationLoop` for optimal frame timing
- **Resize Throttling**: Prevents excessive recalculation during window resize
- **Device Pixel Ratio Capping**: Limits maximum DPI for performance

### Memory Management
- **Canvas Reuse**: Single canvas instance migrates between hosts
- **Resource Cleanup**: Proper disposal of Three.js resources
- **Event Listener Management**: Careful addition/removal of listeners

### Transition Optimizations
- **Animation Debouncing**: Prevents overlapping transition animations
- **GSAP Timeline Management**: Efficient animation sequencing
- **Resize Manager Integration**: Coordinated resize handling (currently disabled)

## Configuration Options

### Canvas Settings
```javascript
const cm = new DesignGridWindow({
    bgHost,           // Background mode host element
    inlineHost,       // Inline mode host element
    hybridHost,       // Hybrid mode collapsed host
    onReady: () => {  // Callback when canvas is ready
        // Preloader coordination
        // Component initialization
    }
});
```

### Hybrid Mode Settings
```javascript
const threshold = 150; // Scroll threshold in pixels
let collapsed = false; // Current state
let animating = false; // Animation guard
```

### Sizing Configuration
```javascript
createSizer({
    renderer,         // Three.js renderer instance
    camera,          // Three.js camera
    getHostEl,       // Function returning current host element
    maxDpr: 2,       // Maximum device pixel ratio
    canvasId,        // Identifier for debugging
    mode            // Current rendering mode
});
```

## Development Guidelines

### Adding New 3D Elements
1. **Scene Integration**: Add objects to `this.scene` in `_config()` method
2. **Animation Updates**: Modify `_tick()` method for continuous animations
3. **Interaction Handling**: Use ViewportGrid for HTML-to-3D coordinate mapping

### Mode-Specific Development
```javascript
// Check current mode
if (this.mode === 'background') {
    // Background-specific logic
} else if (this.mode === 'hybrid') {
    // Hybrid-specific logic
}
```

### Performance Considerations
- **Geometry Complexity**: Keep polygon counts reasonable for web performance
- **Texture Management**: Optimize texture sizes and formats
- **Animation Efficiency**: Use requestAnimationFrame-based loops

### Debugging Tools
```javascript
// Available in browser console
window.pageTransitions.setDebug(true);  // Enable transition debugging
window.cm                               // Access canvas manager
```

## Integration Points

### SCSS Integration
The 3D system integrates with several SCSS modules:
- `_preloader.scss`: Coordinates loading states
- `_header-navigation.scss`: Manages z-index layering
- `main.scss`: Base canvas positioning and responsive behavior

### JavaScript Module Dependencies
- **PreloadManager**: Coordinates loading sequence
- **PageTransitionManager**: Handles page changes
- **GSAP**: Powers smooth animations
- **Three.js**: Core 3D rendering engine

### HTML Template Requirements
Each page requires specific data attributes and DOM structure:
```html
<body data-template="background" class="preloader-active">
    <div id="bgHost" class="bg-canvas-host"></div>
    <!-- Additional hosts for other modes -->
</body>
```

## Troubleshooting

### Common Issues
1. **Canvas Not Appearing**: Check host element existence and mode configuration
2. **Performance Issues**: Verify device pixel ratio capping and geometry complexity
3. **Transition Problems**: Ensure GSAP is loaded and animation guards are working
4. **Resize Issues**: Check sizing system integration and throttling settings

### Debug Methods
```javascript
// Check canvas state
console.log('Canvas ready:', cm.isReady);
console.log('Current host:', cm.currentHost);
console.log('Renderer size:', cm.renderer.getSize(new THREE.Vector2()));

// Monitor transitions
cm.onReady = () => console.log('Canvas ready callback fired');
```

## Future Enhancements

### Planned Features
- **Advanced 3D Models**: Integration of GLTF model loading
- **Interactive Elements**: Click/hover interactions with 3D objects
- **Particle Systems**: Enhanced visual effects
- **VR/AR Support**: WebXR integration for immersive experiences

### Performance Improvements
- **WebGL 2.0**: Upgrade to latest WebGL capabilities
- **Web Workers**: Offload calculations to background threads
- **Level of Detail**: Dynamic quality scaling based on performance

This documentation provides the foundation for understanding and extending the 3D theme system. The modular architecture allows for easy customization while maintaining performance and visual quality across all supported devices and screen sizes.