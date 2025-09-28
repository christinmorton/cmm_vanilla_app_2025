import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'
import { createSizer } from './sizing';

const idealBgColor = 0x155DFC // '#155DFC'

class BackgroundGridWithViewport {
    constructor({ bgHost, inlineHost, hybridHost, onReady }) {
            this.bgHost = bgHost;
            this.inlineHost = inlineHost;
            this.hybridHost = hybridHost;
            this.onReady = onReady;
            this.isReady = false;
            
            // Start with bgHost as default
            this.currentHost = this.bgHost;
    
            // Three.js setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(100, 1, 0.1, 100);
            
            // Create renderer without canvas (we'll append it to host)
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.domElement.id = 'webgl';
            this.renderer.setClearColor(0x000000, 0); // transparent background
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // Initialize controls (will be updated when mounted)
            this.controls = null;
    
            // Initialize sizer system
            this.sizer = createSizer({
                renderer: this.renderer,
                camera: this.camera,
                getHostEl: () => this.currentHost
            });
            
            // Initialize viewport grid system
            this.viewportGrid = null;
            this.debugMarkers = [];
            
            this._config();
            
            // Start animation loop
            this._tick = this._tick.bind(this);
            this.renderer.setAnimationLoop(this._tick);
            
            // Mark as ready after initial setup
            this._markReady();
    }

    _config() {
        this.scene.background = new THREE.Color(idealBgColor);

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the red cube out of the way so it doesn't interfere with text
        this.mesh.position.set(0, 0, -5);

        this.scene.add(this.mesh);

        // Position camera to look directly at the text position (Z = -3)
        this.camera.position.set(0, 0, 0);
        this.scene.add(this.camera);
        this.camera.lookAt(0, 0, -3); // Look directly at where text will spawn
        
        // Initialize viewport grid after camera setup
        this.initializeViewportGrid();
    }

    mountTo(hostEl) {
        if (!hostEl) return;
        if (this.renderer.domElement.parentElement === hostEl) return;

        // Move canvas into the target host
        hostEl.appendChild(this.renderer.domElement);
        this.currentHost = hostEl;
        
        // Set initial canvas size to match host
        const width = hostEl.clientWidth;
        const height = hostEl.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.sizer.observe(hostEl);
        this.sizer.applySize();
        
        // Update controls to use new canvas parent
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
        this.controls.enableDamping = true;
        
        // Add responsive resize handler
        this.setupResponsiveHandling();
        
        // Trigger initial resize to ensure proper canvas sizing
        setTimeout(() => {
            this.handleCanvasResize();
        }, 100);
    }

    /**
     * Setup responsive handling for screen size changes
     */
    setupResponsiveHandling() {
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('DEBUG: Screen size changed, updating responsive layout');
                this.handleCanvasResize();
                this.updateResponsiveLayout();
            }, 250); // Debounce resize events
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Store reference for cleanup
        this.resizeHandler = handleResize;
    }

    /**
     * Handle canvas and camera resize
     */
    handleCanvasResize() {
        if (!this.currentHost) return;
        
        const hostEl = this.currentHost;
        const width = hostEl.clientWidth;
        const height = hostEl.clientHeight;
        
        console.log('DEBUG: Resizing canvas to:', { width, height });
        
        // Update renderer size
        this.renderer.setSize(width, height);
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update viewport grid for new dimensions
        if (this.viewportGrid) {
            this.viewportGrid.handleResize();
        }
        
        // Force sizer to update
        if (this.sizer) {
            this.sizer.applySize();
        }
        
        console.log('DEBUG: Canvas resized successfully');
    }

    /**
     * Update layout when screen size changes
     */
    async updateResponsiveLayout() {
        // Check if content is currently migrated
        let hasMigratedContent = false;
        this.scene.traverse((child) => {
            if (child.userData && child.userData.isTextMesh && child.userData.migrated) {
                hasMigratedContent = true;
            }
        });
        
        // If content is migrated, re-migrate with new responsive settings
        if (hasMigratedContent) {
            console.log('DEBUG: Re-migrating content for new screen size');
            await this.migrateContentToDom(); // Remove current content
            
            // Small delay to ensure cleanup completes
            setTimeout(async () => {
                const textMeshes = await this.migrateContentTo3D('.hero-column');
                if (textMeshes && textMeshes.length > 0) {
                    await this.animateTextMeshesIn(textMeshes);
                }
            }, 100);
        }
    }

    setMode(mode) {
        this.mode = mode;
    }

    _tick() {
        // Add any animation here
        if (this.mesh) {
            this.mesh.rotation.y += 0.005;
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    display() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Initialize the viewport grid system
     */
    initializeViewportGrid() {
        this.viewportGrid = new ViewportGrid(this.camera, 1); // Changed to 1 to put text closer to camera
        
        // Add visual grid for debugging (optional)
        if (this.showDebugGrid) {
            const visualGrid = this.viewportGrid.createVisualGrid(20);
            this.scene.add(visualGrid);
        }
    }

    /**
     * Enable/disable debug grid visualization
     */
    toggleDebugGrid(show = true) {
        this.showDebugGrid = show;
        if (this.viewportGrid && show) {
            const visualGrid = this.viewportGrid.createVisualGrid(20);
            this.scene.add(visualGrid);
        }
    }

    /**
     * Add debug marker at HTML element position
     */
    addDebugMarkerForElement(element, color = 0x00ff00) {
        if (!this.viewportGrid) return null;
        
        const gridPosition = this.viewportGrid.htmlElementToGridPosition(element);
        const marker = this.viewportGrid.addDebugMarker(gridPosition, color);
        this.scene.add(marker);
        this.debugMarkers.push(marker);
        
        return marker;
    }

    /**
     * Clear all debug markers
     */
    clearDebugMarkers() {
        this.debugMarkers.forEach(marker => {
            this.scene.remove(marker);
        });
        this.debugMarkers = [];
    }

    /**
     * Get viewport grid instance
     */
    getViewportGrid() {
        return this.viewportGrid;
    }

    /**
     * Migrate HTML content to 3D text meshes
     */
    async migrateContentTo3D(selector = '.hero-column') {
        if (!this.viewportGrid) {
            console.error('Viewport grid not initialized');
            return false;
        }

        try {
            // Find all elements to migrate
            const elements = document.querySelectorAll(selector);
            console.log('DEBUG: Found elements to migrate:', elements.length, elements);
            
            if (elements.length === 0) {
                console.warn('No elements found to migrate with selector:', selector);
                return false;
            }

            const textMeshes = [];

            const config = this.getColumnConfig();
            console.log('DEBUG: Using responsive config:', {
                layout: config.layout,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                deviceType: config.isMobile ? 'mobile' : config.isTablet ? 'tablet' : 'desktop'
            });
            
            for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                const element = elements[elementIndex];
                
                // Get all text content from the element
                const textNodes = this.extractTextContent(element);
                console.log(`DEBUG: Processing responsive column ${elementIndex + 1}, extracted ${textNodes.length} content nodes:`, textNodes);
                
                // Get responsive column position
                let columnX, yPosition;
                if (config.layout === 'stacked') {
                    // Mobile: Stack columns vertically at center
                    columnX = 0;
                    yPosition = elementIndex === 0 ? config.positions.top : config.positions.bottom;
                } else {
                    // Tablet/Desktop: Side by side
                    columnX = elementIndex === 0 ? config.positions.left : config.positions.right;
                    yPosition = config.topY;
                }
                
                console.log(`DEBUG: Responsive column ${elementIndex + 1} positioned at X=${columnX}, Y=${yPosition}, layout=${config.layout}`);
                
                for (const contentNode of textNodes) {
                    // Check if this content will fit within column bounds
                    const contentHeight = contentNode.renderConfig.lines * config.spacing;
                    const bottomY = yPosition - contentHeight;
                    
                    // Skip content that would extend below column boundary
                    if (bottomY < config.bottomY) {
                        console.log('DEBUG: Skipping content - would exceed column bottom boundary:', {
                            type: contentNode.contentType.type,
                            wouldEndAt: bottomY,
                            boundary: config.bottomY
                        });
                        continue;
                    }
                    
                    const textPosition = new THREE.Vector3(columnX, yPosition, -3);
                    console.log('DEBUG: Creating contained fitted mesh:', {
                        type: contentNode.contentType.type,
                        position: textPosition,
                        lines: contentNode.renderConfig.lines,
                        maxWidth: contentNode.renderConfig.maxWidth,
                        willEndAt: bottomY,
                        text: contentNode.text.substring(0, 30) + '...'
                    });
                    
                    // Create text mesh fitted to uniform column dimensions
                    const textMesh = await this.createTextMesh(contentNode, textPosition);
                    
                    if (textMesh) {
                        this.scene.add(textMesh);
                        textMeshes.push(textMesh);
                        console.log('DEBUG: Contained fitted mesh added to scene. Total meshes:', textMeshes.length);
                        
                        // Store reference to original element and column info
                        textMesh.userData.originalElement = contentNode.element;
                        textMesh.userData.columnIndex = elementIndex;
                        textMesh.userData.isUniformColumn = true;
                        textMesh.userData.isContained = true;
                        
                        // Move Y position down based on content lines and spacing
                        yPosition -= (contentHeight + 0.2); // Small gap between content blocks
                    } else {
                        console.error('DEBUG: Failed to create contained fitted mesh for:', contentNode.contentType.type);
                    }
                }

                // Column backgrounds disabled for clean appearance

                // Hide original element
                element.style.opacity = '0';
                element.style.visibility = 'hidden';
                console.log(`DEBUG: Hidden column ${elementIndex + 1} element:`, element);
            }

            console.log(`Migrated ${textMeshes.length} text elements to 3D`);
            return textMeshes;

        } catch (error) {
            console.error('Content migration failed:', error);
            return false;
        }
    }

    /**
     * Analyze and extract content with intelligent type detection
     */
    extractTextContent(element) {
        const contentNodes = [];
        
        // Get all meaningful content elements
        const contentElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, ul, ol, li, img, video, iframe, blockquote, code, pre');
        
        contentElements.forEach(el => {
            // Skip if this element is nested inside another content element we're processing
            const parentContent = el.parentElement?.closest('h1, h2, h3, h4, h5, h6, p, blockquote, li');
            if (parentContent && parentContent !== el) return;
            
            const contentType = this.detectContentType(el);
            const contentData = this.analyzeContent(el, contentType);
            
            if (contentData) {
                contentNodes.push(contentData);
            }
        });

        return contentNodes;
    }

    /**
     * Detect the type of content element
     */
    detectContentType(element) {
        const tagName = element.tagName.toLowerCase();
        
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            return {
                type: 'heading',
                level: parseInt(tagName.charAt(1)),
                priority: 'high'
            };
        }
        
        if (tagName === 'p') {
            const text = element.textContent.trim();
            return {
                type: 'paragraph',
                length: text.length > 150 ? 'long' : text.length > 50 ? 'medium' : 'short',
                priority: 'medium'
            };
        }
        
        if (['ul', 'ol'].includes(tagName)) {
            return {
                type: 'list',
                style: tagName === 'ul' ? 'unordered' : 'ordered',
                priority: 'medium'
            };
        }
        
        if (tagName === 'li') {
            return {
                type: 'list-item',
                priority: 'low'
            };
        }
        
        if (tagName === 'img') {
            return {
                type: 'image',
                priority: 'high'
            };
        }
        
        if (['video', 'iframe'].includes(tagName)) {
            return {
                type: 'media',
                mediaType: tagName,
                priority: 'high'
            };
        }
        
        if (tagName === 'blockquote') {
            return {
                type: 'quote',
                priority: 'medium'
            };
        }
        
        if (['code', 'pre'].includes(tagName)) {
            return {
                type: 'code',
                priority: 'medium'
            };
        }
        
        return {
            type: 'text',
            priority: 'low'
        };
    }

    /**
     * Analyze content and create rendering data fitted to uniform columns
     */
    analyzeContent(element, contentType) {
        const position = this.viewportGrid.htmlElementToGridPosition(element);
        const style = window.getComputedStyle(element);
        const text = element.textContent.trim();
        const config = this.getColumnConfig();
        
        // Skip empty content
        if (!text && contentType.type !== 'image' && contentType.type !== 'media') {
            return null;
        }
        
        const baseData = {
            element: element,
            position: position,
            contentType: contentType,
            style: {
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                color: style.color,
                fontWeight: style.fontWeight
            }
        };
        
        // All content must fit within uniform column dimensions
        switch (contentType.type) {
            case 'heading':
                return {
                    ...baseData,
                    text: text,
                    lines: this.wrapTextToFitColumn(text, this.getHeadingFontSize(contentType.level), config),
                    renderConfig: {
                        fontSize: this.getHeadingFontSize(contentType.level),
                        fontWeight: 'bold',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: this.wrapTextToFitColumn(text, this.getHeadingFontSize(contentType.level), config).length
                    }
                };
                
            case 'paragraph':
                const wrappedParagraph = this.wrapTextToFitColumn(text, 20, config);
                return {
                    ...baseData,
                    text: text,
                    lines: wrappedParagraph,
                    renderConfig: {
                        fontSize: 20,
                        fontWeight: 'normal',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: Math.min(wrappedParagraph.length, 15) // Limit to fit column height
                    }
                };
                
            case 'list':
                const items = Array.from(element.querySelectorAll('li')).map(li => li.textContent.trim());
                const fittedItems = items.slice(0, Math.floor(config.contentHeight / config.spacing - 1)); // Fit within height
                return {
                    ...baseData,
                    text: items.join(' • '),
                    lines: fittedItems,
                    renderConfig: {
                        fontSize: 18,
                        fontWeight: 'normal',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: fittedItems.length
                    }
                };
                
            case 'image':
                const alt = element.alt || 'Image';
                return {
                    ...baseData,
                    text: `[IMAGE: ${alt}]`,
                    lines: [`[IMAGE: ${alt}]`],
                    imageData: { src: element.src, alt },
                    renderConfig: {
                        fontSize: 18,
                        fontWeight: 'italic',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: 1,
                        isPlaceholder: true
                    }
                };
                
            case 'media':
                return {
                    ...baseData,
                    text: `[${contentType.mediaType.toUpperCase()}]`,
                    lines: [`[${contentType.mediaType.toUpperCase()}]`],
                    renderConfig: {
                        fontSize: 18,
                        fontWeight: 'italic',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: 1,
                        isPlaceholder: true
                    }
                };
                
            default:
                const wrappedDefault = this.wrapTextToFitColumn(text, 18, config);
                return {
                    ...baseData,
                    text: text,
                    lines: wrappedDefault,
                    renderConfig: {
                        fontSize: 18,
                        fontWeight: 'normal',
                        spacing: config.spacing,
                        maxWidth: config.contentWidth,
                        lines: Math.min(wrappedDefault.length, 10)
                    }
                };
        }
    }

    /**
     * Wrap text to fit within column dimensions
     */
    wrapTextToFitColumn(text, fontSize, config) {
        // Calculate approximate characters per line based on column width and font size
        const charWidth = fontSize * 0.6; // Approximate character width
        const maxCharsPerLine = Math.floor((config.contentWidth * 100) / charWidth);
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        
        // Limit total lines to fit within column height
        const maxLines = Math.floor(config.contentHeight / config.spacing);
        return lines.slice(0, maxLines);
    }

    /**
     * Get appropriate font size for heading levels
     */
    getHeadingFontSize(level) {
        const sizes = {
            1: 36, // H1
            2: 32, // H2
            3: 28, // H3
            4: 26, // H4
            5: 24, // H5
            6: 22  // H6
        };
        return sizes[level] || 24;
    }

    /**
     * Intelligently wrap text for paragraphs
     */
    wrapTextForParagraph(text, length) {
        const maxLineLength = length === 'long' ? 60 : length === 'medium' ? 45 : 35;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxLineLength) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    /**
     * Create 3D text mesh using intelligent adaptive rendering
     */
    async createTextMesh(contentData, position) {
        try {
            const { text, lines, renderConfig, contentType } = contentData;
            const displayText = lines ? lines.join('\n') : text;
            
            // Create canvas with adaptive sizing
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const pixelRatio = window.devicePixelRatio || 1;
            
            // Calculate canvas size based on content type and render config
            const lineHeight = renderConfig.fontSize * 1.4;
            const canvasWidth = Math.min(renderConfig.maxWidth * 100, 800) * pixelRatio;
            const canvasHeight = (lineHeight * Math.max(renderConfig.lines, 1) + 40) * pixelRatio;
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            context.scale(pixelRatio, pixelRatio);
            
            // Set font style based on content type
            const fontWeight = renderConfig.fontWeight || 'normal';
            const fontSize = renderConfig.fontSize;
            context.font = `${fontWeight} ${fontSize}px ${contentData.style.fontFamily || 'Arial, sans-serif'}`;
            context.textAlign = 'left';
            context.textBaseline = 'top';
            
            // Clear canvas to transparent
            context.clearRect(0, 0, canvasWidth / pixelRatio, canvasHeight / pixelRatio);
            
            // Add text shadow for readability
            context.shadowColor = 'rgba(0, 0, 0, 0.8)';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowBlur = 4;
            
            // Set text color based on content type
            const textColor = this.getTextColor(contentType);
            context.fillStyle = textColor;
            
            // Render text based on content type
            this.renderContentToCanvas(context, contentData, lineHeight);
            
            // Create texture and material
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                alphaTest: 0.1
            });
            
            // Create plane geometry with adaptive dimensions
            const textWidth = renderConfig.maxWidth;
            const textHeight = renderConfig.lines * renderConfig.spacing + 0.3;
            const geometry = new THREE.PlaneGeometry(textWidth, textHeight);
            
            // Create mesh
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            
            // Start invisible for animation
            mesh.material.opacity = 0;
            
            console.log('DEBUG: Adaptive text mesh created:', {
                type: contentType.type,
                text: text.substring(0, 50) + '...',
                dimensions: `${textWidth} x ${textHeight}`,
                lines: renderConfig.lines
            });
            
            // Store metadata
            mesh.userData = {
                originalText: text,
                isTextMesh: true,
                migrated: true,
                canvas: canvas,
                texture: texture,
                contentType: contentType.type,
                renderConfig: renderConfig
            };
            
            return mesh;
            
        } catch (error) {
            console.error('Adaptive text mesh creation failed:', error);
            return null;
        }
    }

    /**
     * Get text color based on content type
     */
    getTextColor(contentType) {
        const colors = {
            'heading': '#ffffff',      // Bright white for headings
            'paragraph': '#f0f0f0',    // Slightly softer white for paragraphs  
            'list': '#e0e0e0',         // Light gray for lists
            'image': '#87ceeb',        // Sky blue for image placeholders
            'media': '#dda0dd',        // Plum for media placeholders
            'quote': '#98fb98',        // Pale green for quotes
            'code': '#ffd700',         // Gold for code
            'text': '#f5f5f5'          // Off-white for general text
        };
        
        return colors[contentType.type] || '#ffffff';
    }

    /**
     * Render content to canvas based on type
     */
    renderContentToCanvas(context, contentData, lineHeight) {
        const { text, lines, contentType, renderConfig } = contentData;
        
        if (lines && lines.length > 1) {
            // Multi-line content (paragraphs, lists)
            lines.forEach((line, index) => {
                let displayLine = line;
                
                // Add bullet points for lists
                if (contentType.type === 'list' && index > 0) {
                    displayLine = `• ${line}`;
                }
                
                context.fillText(displayLine, 12, 20 + (index * lineHeight));
            });
        } else {
            // Single line content (headings, short text)
            let displayText = text;
            
            // Add special formatting for certain types
            if (contentType.type === 'quote') {
                displayText = `"${text}"`;
            } else if (contentType.type === 'code') {
                displayText = `<${text}>`;
            }
            
            context.fillText(displayText, 12, 20);
        }
    }

    /**
     * Get responsive column configuration based on screen size
     */
    getColumnConfig() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = screenWidth / screenHeight;
        
        // Mobile (portrait)
        if (screenWidth < 768 || aspectRatio < 1.0) {
            return {
                layout: 'stacked',
                width: 3.0,
                height: 4.0,
                padding: 0.2,
                contentWidth: 2.6,
                contentHeight: 3.6,
                spacing: 0.25,
                gap: 0.8,
                positions: {
                    left: 0,    // Centered for stacked layout
                    right: 0,   // Second column below first
                    top: 1.8,   // First column higher
                    bottom: -2.5 // Second column lower
                },
                topY: 1.8,
                bottomY: -2.2,
                centerY: 0,
                isMobile: true
            };
        }
        // Tablet
        else if (screenWidth < 1024) {
            const scale = Math.min(screenWidth / 1024, screenHeight / 768);
            return {
                layout: 'side-by-side',
                width: 3.2 * scale,
                height: 5.0 * scale,
                padding: 0.25 * scale,
                contentWidth: 2.7 * scale,
                contentHeight: 4.5 * scale,
                spacing: 0.28 * scale,
                gap: 1.2 * scale,
                positions: {
                    left: -2.2 * scale,
                    right: 2.2 * scale
                },
                topY: 1.8 * scale,
                bottomY: -2.7 * scale,
                centerY: -0.4 * scale,
                isTablet: true
            };
        }
        // Desktop (existing)
        else {
            return {
                layout: 'side-by-side',
                width: 4.0,
                height: 6.0,
                padding: 0.3,
                contentWidth: 3.4,
                contentHeight: 5.4,
                spacing: 0.3,
                gap: 1.5,
                positions: {
                    left: -2.75,
                    right: 2.75
                },
                topY: 2.2,
                bottomY: -3.2,
                centerY: -0.5,
                isDesktop: true
            };
        }
    }

    /**
     * Create uniform column background
     */
    createColumnBackground(columnX, columnIndex) {
        const config = this.getColumnConfig();
        
        const geometry = new THREE.PlaneGeometry(config.width, config.height);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red color
            transparent: true,
            opacity: 0.3,    // Semi-transparent so text is still visible
            side: THREE.DoubleSide 
        });
        
        const backgroundMesh = new THREE.Mesh(geometry, material);
        backgroundMesh.position.set(columnX, config.centerY, -3.1); // Slightly behind text
        
        // Store metadata for easy cleanup
        backgroundMesh.userData = {
            isColumnBackground: true,
            columnIndex: columnIndex,
            migrated: true
        };
        
        console.log(`DEBUG: Created uniform column ${columnIndex + 1} background:`, {
            position: backgroundMesh.position,
            size: `${config.width} x ${config.height}`,
            opacity: 0.3,
            uniform: true
        });
        
        return backgroundMesh;
    }

    /**
     * Animate text meshes to visible
     */
    animateTextMeshesIn(textMeshes, duration = 1000) {
        return new Promise((resolve) => {
            if (!textMeshes || textMeshes.length === 0) {
                resolve();
                return;
            }

            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                textMeshes.forEach((mesh, index) => {
                    // Stagger the animation
                    const staggeredProgress = Math.max(0, progress - (index * 0.1));
                    mesh.material.opacity = staggeredProgress;
                    
                    // Scale effect
                    const scale = 0.8 + (staggeredProgress * 0.2);
                    mesh.scale.setScalar(scale);
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Finalize all meshes
                    textMeshes.forEach(mesh => {
                        mesh.material.transparent = false;
                        mesh.material.opacity = 1;
                        mesh.scale.setScalar(1);
                    });
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Migrate content back to DOM
     */
    async migrateContentToDom() {
        try {
            // Find all migrated text meshes and column backgrounds
            const textMeshes = [];
            this.scene.traverse((child) => {
                if (child.userData && child.userData.migrated && 
                   (child.userData.isTextMesh || child.userData.isColumnBackground)) {
                    textMeshes.push(child);
                }
            });

            if (textMeshes.length === 0) {
                console.warn('No migrated content found');
                return false;
            }

            // Animate text meshes out
            await this.animateTextMeshesOut(textMeshes);

            // Remove meshes from scene with proper cleanup
            textMeshes.forEach(mesh => {
                this.scene.remove(mesh);
                
                // Cleanup geometry
                if (mesh.geometry) {
                    mesh.geometry.dispose();
                }
                
                // Cleanup material and texture
                if (mesh.material) {
                    if (mesh.material.map) {
                        mesh.material.map.dispose();
                    }
                    mesh.material.dispose();
                }
                
                // Cleanup stored canvas if exists
                if (mesh.userData.canvas) {
                    mesh.userData.canvas = null;
                }
            });

            // Show original DOM elements - improved selector to catch all hidden elements
            const hiddenElements = document.querySelectorAll('[style*="visibility: hidden"], [style*="opacity: 0"]');
            hiddenElements.forEach(element => {
                // Reset both opacity and visibility
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                
                // Remove any inline styles that might be hiding the element
                if (element.style.display === 'none') {
                    element.style.display = '';
                }
            });

            // Also restore elements that were hidden during migration
            const heroColumns = document.querySelectorAll('.hero-column');
            heroColumns.forEach(column => {
                column.style.opacity = '1';
                column.style.visibility = 'visible';
                
                // Ensure all child elements are also visible
                const childElements = column.querySelectorAll('*');
                childElements.forEach(child => {
                    child.style.opacity = '1';
                    child.style.visibility = 'visible';
                });
            });

            console.log(`Restored ${textMeshes.length} elements to DOM`);
            return true;
            
        } catch (error) {
            console.error('DOM restoration failed:', error);
            return false;
        }
    }

    /**
     * Animate text meshes out
     */
    animateTextMeshesOut(textMeshes, duration = 800) {
        return new Promise((resolve) => {
            if (!textMeshes || textMeshes.length === 0) {
                resolve();
                return;
            }

            textMeshes.forEach(mesh => {
                mesh.material.transparent = true;
            });

            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                textMeshes.forEach((mesh, index) => {
                    // Stagger the animation
                    const staggeredProgress = Math.max(0, progress - (index * 0.05));
                    mesh.material.opacity = 1 - staggeredProgress;
                    
                    // Scale effect
                    const scale = 1 - (staggeredProgress * 0.2);
                    mesh.scale.setScalar(scale);
                });
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Toggle content migration
     */
    async toggleContentMigration(selector = '.hero-column') {
        // Check if content is currently migrated
        let hasMigratedContent = false;
        this.scene.traverse((child) => {
            if (child.userData && child.userData.isTextMesh && child.userData.migrated) {
                hasMigratedContent = true;
            }
        });

        if (hasMigratedContent) {
            // Migrate back to DOM
            return await this.migrateContentToDom();
        } else {
            // Migrate to 3D
            const textMeshes = await this.migrateContentTo3D(selector);
            if (textMeshes && textMeshes.length > 0) {
                await this.animateTextMeshesIn(textMeshes);
                return true;
            }
            return false;
        }
    }

    /**
     * Mark canvas as ready and notify preloader
     */
    _markReady() {
        if (this.isReady) return;
        
        this.isReady = true;
        
        // Small delay to ensure first render completes
        requestAnimationFrame(() => {
            if (this.onReady) {
                this.onReady();
            }
        });
    }
}

/**
 * ViewportGrid - Creates a 3D coordinate system mapped to the camera viewport
 */
class ViewportGrid {
    constructor(camera, distance = 2) {
        this.camera = camera;
        this.distance = distance; // Distance from camera to grid plane
        
        // Calculate world dimensions at the grid distance
        this.worldDimensions = this.calculateWorldDimensions();
    }
    
    /**
     * Calculate world dimensions at the grid distance from camera
     */
    calculateWorldDimensions() {
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * this.distance;
        const width = height * this.camera.aspect;
        
        return { width, height };
    }
    
    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGridCoordinates(screenX, screenY) {
        // Convert screen pixels to normalized device coordinates (-1 to 1)
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;
        
        // Convert NDC to world coordinates on the grid plane
        const worldX = ndcX * (this.worldDimensions.width / 2);
        const worldY = ndcY * (this.worldDimensions.height / 2);
        const worldZ = -this.distance; // Grid is at fixed distance from camera
        
        return new THREE.Vector3(worldX, worldY, worldZ);
    }
    
    /**
     * Convert HTML element to grid position
     */
    htmlElementToGridPosition(element) {
        const rect = element.getBoundingClientRect();
        
        // Get center point of element
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert to grid coordinates
        return this.screenToGridCoordinates(centerX, centerY);
    }
    
    /**
     * Create visual grid for debugging
     */
    createVisualGrid(divisions = 20) {
        const gridHelper = new THREE.GridHelper(
            Math.max(this.worldDimensions.width, this.worldDimensions.height),
            divisions,
            0x444444,
            0x222222
        );
        
        // Position grid at the mapping plane
        gridHelper.position.z = -this.distance;
        gridHelper.rotation.x = Math.PI / 2; // Rotate to face camera
        
        return gridHelper;
    }
    
    /**
     * Add debug marker at position
     */
    addDebugMarker(position, color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(0.05);
        const material = new THREE.MeshBasicMaterial({ color });
        const marker = new THREE.Mesh(geometry, material);
        
        marker.position.copy(position);
        
        return marker;
    }
    
    /**
     * Update grid dimensions (call after camera or window changes)
     */
    updateDimensions() {
        this.worldDimensions = this.calculateWorldDimensions();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.updateDimensions();
    }
}

export default BackgroundGridWithViewport;