# Dynamic Content Implementation Plan

## Overview

This document outlines the strategy for implementing dynamic content loading in the Vite vanilla JavaScript application to consume WordPress REST API data and populate blog posts and portfolio/case study content.

## Current State Analysis

### Existing Static Templates
- `blog.html` - Blog listing page template
- `single-post.html` - Individual blog post template  
- `portfolio.html` - Portfolio/case study listing page template
- `portfolio-details.html` - Individual portfolio/case study details template
- `portfolio-masonry.html` - Masonry grid layout for portfolio

### Available WordPress Content Types

#### 1. Blog Posts (WordPress Default Posts)
- **Endpoint:** `/wp-json/wp/v2/posts`
- **Content:** Standard WordPress blog posts
- **Templates:** `blog.html`, `single-post.html`

#### 2. Case Studies (Custom Post Type)
- **Endpoint:** `/wp-json/wp/v2/case_study`
- **Content:** Project portfolios and detailed case studies
- **Templates:** `portfolio.html`, `portfolio-details.html`, `portfolio-masonry.html`

## Implementation Strategy

### Phase 1: Content API Integration Layer ✨ HIGH PRIORITY

#### 1.1 Create WordPress API Client
- **File:** `js/modules/WordPressAPI.js`
- **Purpose:** Centralized WordPress REST API client
- **Features:**
  - Base API configuration and authentication
  - Generic GET/POST methods with error handling
  - Caching layer for performance optimization
  - Pagination handling for large datasets
  - Image URL processing and optimization

#### 1.2 Create Content Type Managers
- **Blog Manager:** `js/modules/BlogManager.js`
  - Fetch blog posts from WordPress posts API
  - Handle featured images, excerpts, categories, tags
  - Parse content and metadata
  - Handle pagination for blog listings

- **Portfolio Manager:** `js/modules/PortfolioManager.js`
  - Fetch case studies from case_study CPT
  - Handle project media, technologies, client info
  - Parse project details and outcomes
  - Filter by featured status, project date, etc.

### Phase 2: Dynamic Template Rendering System 🎯 HIGH PRIORITY

#### 2.1 Template Engine Implementation
- **File:** `js/modules/TemplateEngine.js`
- **Purpose:** Convert static HTML templates to dynamic content
- **Approach:** 
  - Use existing HTML templates as base structure
  - Identify content placeholders and replace with dynamic data
  - Maintain existing styling and layout structure
  - Support URL-based routing for individual posts/projects

#### 2.2 Content Rendering Modules

##### Blog Content Renderer
- **File:** `js/modules/BlogRenderer.js`
- **Templates:** `blog.html`, `single-post.html`
- **Features:**
  - Blog post listing with pagination
  - Individual post content rendering
  - Category/tag filtering
  - Featured image handling
  - SEO meta tag updates
  - Social sharing integration

##### Portfolio Content Renderer  
- **File:** `js/modules/PortfolioRenderer.js`
- **Templates:** `portfolio.html`, `portfolio-details.html`, `portfolio-masonry.html`
- **Features:**
  - Case study listing with filtering
  - Individual case study detail pages
  - Project gallery and media handling
  - Technology stack display
  - Client information rendering
  - Project timeline visualization

### Phase 3: URL Routing & Navigation 🚀 MEDIUM PRIORITY

#### 3.1 Client-Side Routing
- **File:** `js/modules/Router.js`
- **Purpose:** Handle URL-based navigation without page reloads
- **Features:**
  - Route mapping for content types
  - History API integration
  - Deep linking support for individual posts/projects
  - URL parameter handling (pagination, filtering)
  - Browser back/forward button support

#### 3.2 URL Structure Design
```
Blog Routes:
/blog                          → Blog listing page
/blog/page/{page}              → Blog pagination
/blog/category/{category}      → Category filtering
/blog/tag/{tag}                → Tag filtering  
/blog/{slug}                   → Individual blog post

Portfolio Routes:
/portfolio                     → Portfolio listing page  
/portfolio/masonry             → Masonry grid layout
/portfolio/page/{page}         → Portfolio pagination
/portfolio/{slug}              → Individual case study details
```

### Phase 4: SEO & Performance Optimization ⚡ MEDIUM PRIORITY

#### 4.1 SEO Implementation
- **Dynamic Meta Tags:** Update title, description, og:tags for each content item
- **Structured Data:** JSON-LD markup for blog posts and case studies
- **Sitemap Generation:** Dynamic sitemap based on WordPress content
- **Canonical URLs:** Proper canonical URL management

#### 4.2 Performance Optimization
- **Content Caching:** Client-side caching of API responses
- **Image Optimization:** Lazy loading and responsive image handling
- **Code Splitting:** Dynamic imports for content-specific JavaScript
- **Preloading:** Strategic preloading of linked content

## Technical Implementation Details

### Content Loading Strategy

#### 1. URL-Based Content Detection
```javascript
// Detect content type from URL
const detectContentType = () => {
  const path = window.location.pathname;
  if (path.startsWith('/blog/') && path !== '/blog/') {
    return { type: 'single-post', slug: getSlugFromPath(path) };
  } else if (path.startsWith('/portfolio/') && path !== '/portfolio/') {
    return { type: 'portfolio-detail', slug: getSlugFromPath(path) };
  } else if (path === '/blog') {
    return { type: 'blog-list', params: getQueryParams() };
  } else if (path === '/portfolio') {
    return { type: 'portfolio-list', params: getQueryParams() };
  }
  return { type: 'static' };
};
```

#### 2. Dynamic Content Injection
```javascript
// Replace static content with dynamic data
const renderContent = async (contentType, data) => {
  const container = document.getElementById('dynamic-content');
  const template = await getTemplate(contentType);
  const renderedHTML = populateTemplate(template, data);
  container.innerHTML = renderedHTML;
  
  // Update SEO meta tags
  updateMetaTags(data);
  
  // Initialize any content-specific functionality
  initializeContentFeatures(contentType);
};
```

#### 3. Template Population System
```javascript
// Template placeholder replacement
const populateTemplate = (template, data) => {
  return template
    .replace(/\{\{title\}\}/g, data.title.rendered)
    .replace(/\{\{content\}\}/g, data.content.rendered)
    .replace(/\{\{excerpt\}\}/g, data.excerpt.rendered)
    .replace(/\{\{featured_image\}\}/g, getFeaturedImageURL(data))
    .replace(/\{\{date\}\}/g, formatDate(data.date))
    .replace(/\{\{author\}\}/g, data.author_name);
};
```

### WordPress API Integration

#### Authentication Strategy
```javascript
// WordPress API client with optional authentication
class WordPressAPI {
  constructor(baseURL, authToken = null) {
    this.baseURL = baseURL;
    this.authToken = authToken;
    this.cache = new Map();
  }
  
  async fetchPosts(params = {}) {
    const cacheKey = `posts-${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const response = await this.request('/wp/v2/posts', params);
    this.cache.set(cacheKey, response);
    return response;
  }
}
```

## File Structure Organization

```
js/modules/
├── wordpress/
│   ├── WordPressAPI.js         # Base API client
│   ├── BlogManager.js          # Blog post management
│   ├── PortfolioManager.js     # Case study management
│   └── ContentCache.js         # Caching system
├── rendering/
│   ├── TemplateEngine.js       # Template processing
│   ├── BlogRenderer.js         # Blog content rendering
│   ├── PortfolioRenderer.js    # Portfolio content rendering
│   └── SEOManager.js           # Meta tag management
├── routing/
│   ├── Router.js               # Client-side routing
│   ├── URLHandler.js           # URL parsing and generation
│   └── HistoryManager.js       # Browser history management
└── utils/
    ├── ImageOptimizer.js       # Image processing utilities
    ├── DateFormatter.js        # Date/time formatting
    └── TextUtils.js            # Content processing utilities
```

## Implementation Phases & Priorities

### Phase 1: Foundation (Week 1-2) ✨ START HERE
1. **WordPress API Client** - Basic API communication
2. **Content Managers** - Blog and Portfolio data fetching
3. **Basic Template Engine** - Simple content replacement

### Phase 2: Core Functionality (Week 2-3) 🎯 ESSENTIAL
1. **Content Rendering** - Dynamic content display
2. **URL Routing** - Basic client-side navigation
3. **Individual Content Pages** - Single post/project details

### Phase 3: Enhancement (Week 3-4) 🚀 IMPORTANT  
1. **Advanced Filtering** - Categories, tags, project types
2. **Pagination** - Content listing pagination
3. **Search Functionality** - Content search capabilities

### Phase 4: Optimization (Week 4-5) ⚡ POLISH
1. **SEO Implementation** - Meta tags and structured data
2. **Performance Optimization** - Caching and lazy loading
3. **Progressive Enhancement** - Fallbacks and accessibility

## Migration Strategy

### Gradual Implementation Approach
1. **Keep Existing Templates** - Maintain static templates as fallback
2. **Feature Detection** - Detect JavaScript capabilities and graceful degradation
3. **Progressive Enhancement** - Start with basic functionality, add features incrementally
4. **A/B Testing** - Compare static vs dynamic performance and user experience

### Vite Configuration Updates
```javascript
// vite.config.js updates for dynamic routing
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      input: {
        // ... existing entries
        'blog-dynamic': 'js/modules/BlogRenderer.js',
        'portfolio-dynamic': 'js/modules/PortfolioRenderer.js'
      }
    }
  },
  // Handle client-side routing in dev server
  historyApiFallback: {
    rewrites: [
      { from: /^\/blog\/.*/, to: '/blog.html' },
      { from: /^\/portfolio\/.*/, to: '/portfolio.html' }
    ]
  }
});
```

## Success Criteria

### Functional Requirements
- ✅ Blog posts load dynamically from WordPress API
- ✅ Portfolio/case studies display from case_study CPT
- ✅ Individual content pages work with clean URLs
- ✅ Pagination and filtering function correctly
- ✅ SEO meta tags update dynamically
- ✅ Performance matches or exceeds static site

### Technical Requirements
- ✅ Graceful degradation when JavaScript is disabled
- ✅ Fast loading times with caching
- ✅ Mobile-responsive content rendering
- ✅ Search engine indexable content
- ✅ Browser history and bookmarking work correctly

## Future Considerations

### Eleventy Migration Prep
- **Template Structure:** Keep template structure compatible with Eleventy
- **Data Format:** Ensure data processing can be adapted for static generation
- **Asset Pipeline:** Maintain asset organization for easy migration
- **SEO Strategy:** Implement SEO patterns that translate to static generation

### Content Management
- **Preview Functionality:** Allow content preview before publishing
- **Draft Support:** Handle WordPress draft posts appropriately  
- **Multi-author Support:** Author information and profiles
- **Content Relationships:** Related posts and case studies

---

**Next Steps:** Begin implementation with Phase 1 - WordPress API Client and basic content fetching functionality.