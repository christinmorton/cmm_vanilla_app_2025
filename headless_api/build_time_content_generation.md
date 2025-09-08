# Build-Time Content Generation Plan

## Overview

This document outlines a **quick and dirty development solution** for generating static HTML files from WordPress API content at build time. This approach creates individual HTML files for blog posts and portfolio items that get built by Vite and deployed as static assets.

## Problem Statement

**Goal:** Deploy website by Monday morning with dynamic WordPress content
**Constraint:** Need static HTML files for hosting deployment
**Solution:** Build-time content generation that runs before Vite build

## Implementation Strategy

### Core Concept
1. **Pre-Build Script** - NPM script that runs before `npm run build`
2. **Content Fetcher** - Fetches all posts/portfolio items from WordPress API
3. **HTML Generator** - Creates individual HTML files using existing templates
4. **Vite Integration** - Generated files get built and deployed as static assets

## Technical Implementation

### 1. NPM Scripts Setup

#### Updated package.json scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run generate-content && vite build",
    "generate-content": "node scripts/generate-content.js",
    "generate-blog": "node scripts/generate-blog.js",
    "generate-portfolio": "node scripts/generate-portfolio.js",
    "preview": "vite preview"
  }
}
```

### 2. Content Generation Scripts

#### Main Generator Script
- **File:** `scripts/generate-content.js`
- **Purpose:** Orchestrates all content generation
- **Features:**
  - Fetches content from WordPress API
  - Generates blog and portfolio HTML files
  - Updates navigation/index pages with content lists
  - Error handling and logging

#### Blog Post Generator
- **File:** `scripts/generate-blog.js`
- **Purpose:** Creates individual blog post HTML files
- **Output:** `blog/[slug].html` files
- **Template:** Uses `single-post.html` as base template

#### Portfolio Generator  
- **File:** `scripts/generate-portfolio.js`
- **Purpose:** Creates individual portfolio/case study HTML files
- **Output:** `portfolio/[slug].html` files
- **Template:** Uses `portfolio-details.html` as base template

### 3. Template Processing System

#### HTML Template Processor
- **File:** `scripts/utils/template-processor.js`
- **Purpose:** Replace placeholders in existing HTML templates
- **Features:**
  - Read existing HTML template files
  - Replace content placeholders with API data
  - Maintain existing styling and structure
  - Handle featured images and media

#### Content Formatter
- **File:** `scripts/utils/content-formatter.js`  
- **Purpose:** Format WordPress content for HTML output
- **Features:**
  - Convert WordPress content to clean HTML
  - Handle featured images and galleries
  - Format dates and metadata
  - Process excerpt and content fields

## File Structure

```
scripts/
├── generate-content.js         # Main orchestration script
├── generate-blog.js           # Blog post generator
├── generate-portfolio.js      # Portfolio generator
├── utils/
│   ├── wordpress-api.js       # WordPress API client
│   ├── template-processor.js  # HTML template processing
│   ├── content-formatter.js   # Content formatting utilities
│   ├── file-utils.js         # File system operations
│   └── logger.js             # Logging utilities
└── templates/
    ├── blog-template.html     # Blog post HTML template
    └── portfolio-template.html # Portfolio HTML template

Generated Output:
blog/
├── first-post.html
├── second-post.html
└── ...

portfolio/  
├── project-one.html
├── project-two.html
└── ...
```

## Implementation Details

### 1. WordPress API Integration

```javascript
// scripts/utils/wordpress-api.js
class WordPressAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async fetchAllPosts() {
    const posts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(`${this.baseURL}/wp/v2/posts?per_page=100&page=${page}`);
      const pagePosts = await response.json();
      
      if (pagePosts.length === 0) {
        hasMore = false;
      } else {
        posts.push(...pagePosts);
        page++;
      }
    }
    
    return posts;
  }
  
  async fetchAllCaseStudies() {
    // Similar implementation for case_study CPT
    const response = await fetch(`${this.baseURL}/wp/v2/case_study?per_page=100`);
    return await response.json();
  }
}
```

### 2. Template Processing

```javascript
// scripts/utils/template-processor.js
const fs = require('fs').promises;
const path = require('path');

class TemplateProcessor {
  async processTemplate(templatePath, data) {
    const template = await fs.readFile(templatePath, 'utf-8');
    
    return template
      .replace(/{{TITLE}}/g, data.title.rendered)
      .replace(/{{CONTENT}}/g, data.content.rendered)
      .replace(/{{EXCERPT}}/g, data.excerpt.rendered)
      .replace(/{{DATE}}/g, this.formatDate(data.date))
      .replace(/{{FEATURED_IMAGE}}/g, this.getFeaturedImage(data))
      .replace(/{{META_DESCRIPTION}}/g, this.createMetaDescription(data))
      .replace(/{{CANONICAL_URL}}/g, this.createCanonicalURL(data.slug));
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  getFeaturedImage(data) {
    if (data.featured_media && data._embedded && data._embedded['wp:featuredmedia']) {
      return data._embedded['wp:featuredmedia'][0].source_url;
    }
    return '/images/default-featured.jpg';
  }
  
  createMetaDescription(data) {
    const excerpt = data.excerpt.rendered.replace(/<[^>]*>/g, '');
    return excerpt.substring(0, 160).trim() + '...';
  }
  
  createCanonicalURL(slug) {
    return `https://christinmorton.com/blog/${slug}`;
  }
}
```

### 3. Main Content Generator

```javascript
// scripts/generate-content.js
const WordPressAPI = require('./utils/wordpress-api');
const TemplateProcessor = require('./utils/template-processor');
const fs = require('fs').promises;
const path = require('path');

async function generateContent() {
  console.log('🚀 Starting content generation...');
  
  try {
    const api = new WordPressAPI('https://your-wordpress-site.com/wp-json');
    const processor = new TemplateProcessor();
    
    // Generate blog posts
    console.log('📝 Generating blog posts...');
    await generateBlogPosts(api, processor);
    
    // Generate portfolio items
    console.log('🎨 Generating portfolio items...');
    await generatePortfolioItems(api, processor);
    
    // Update listing pages
    console.log('📋 Updating listing pages...');
    await updateListingPages(api, processor);
    
    console.log('✅ Content generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Content generation failed:', error);
    process.exit(1);
  }
}

async function generateBlogPosts(api, processor) {
  const posts = await api.fetchAllPosts();
  const templatePath = path.join(__dirname, '..', 'single-post.html');
  
  // Ensure blog directory exists
  await fs.mkdir(path.join(__dirname, '..', 'blog'), { recursive: true });
  
  for (const post of posts) {
    const html = await processor.processTemplate(templatePath, post);
    const filename = `${post.slug}.html`;
    const filepath = path.join(__dirname, '..', 'blog', filename);
    
    await fs.writeFile(filepath, html);
    console.log(`  ✓ Created blog/${filename}`);
  }
}

async function generatePortfolioItems(api, processor) {
  const caseStudies = await api.fetchAllCaseStudies();
  const templatePath = path.join(__dirname, '..', 'portfolio-details.html');
  
  // Ensure portfolio directory exists
  await fs.mkdir(path.join(__dirname, '..', 'portfolio'), { recursive: true });
  
  for (const study of caseStudies) {
    const html = await processor.processTemplate(templatePath, study);
    const filename = `${study.slug}.html`;
    const filepath = path.join(__dirname, '..', 'portfolio', filename);
    
    await fs.writeFile(filepath, html);
    console.log(`  ✓ Created portfolio/${filename}`);
  }
}

// Run the generator
generateContent();
```

### 4. Template Placeholder System

#### Blog Template Placeholders (`single-post.html`)
```html
<!-- Replace existing static content with placeholders -->
<title>{{TITLE}} - Christine Morton</title>
<meta name="description" content="{{META_DESCRIPTION}}">
<link rel="canonical" href="{{CANONICAL_URL}}">

<article class="blog-post">
  <header class="post-header">
    <h1 class="post-title">{{TITLE}}</h1>
    <div class="post-meta">
      <time datetime="{{DATE_ISO}}">{{DATE}}</time>
    </div>
    <img src="{{FEATURED_IMAGE}}" alt="{{TITLE}}" class="featured-image">
  </header>
  
  <div class="post-content">
    {{CONTENT}}
  </div>
</article>
```

#### Portfolio Template Placeholders (`portfolio-details.html`)
```html
<title>{{PROJECT_TITLE}} - Christine Morton Portfolio</title>
<meta name="description" content="{{PROJECT_DESCRIPTION}}">

<article class="portfolio-item">
  <header class="project-header">
    <h1 class="project-title">{{PROJECT_TITLE}}</h1>
    <p class="client-name">{{CLIENT_NAME}}</p>
    <time datetime="{{PROJECT_DATE_ISO}}">{{PROJECT_DATE}}</time>
  </header>
  
  <div class="project-gallery">
    {{PROJECT_MEDIA}}
  </div>
  
  <section class="project-details">
    <div class="project-problem">
      <h3>The Challenge</h3>
      {{PROJECT_PROBLEM}}
    </div>
    
    <div class="project-solution">
      <h3>The Solution</h3>
      {{PROJECT_SOLUTION}}
    </div>
    
    <div class="project-outcome">
      <h3>Results</h3>
      {{OUTCOME}}
    </div>
  </section>
</article>
```

## Vite Configuration Updates

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { glob } from 'glob';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        service: 'service.html',
        // ... existing pages
        
        // Dynamically include generated blog posts
        ...Object.fromEntries(
          glob.sync('blog/*.html').map(file => [
            file.replace('blog/', 'blog-').replace('.html', ''),
            file
          ])
        ),
        
        // Dynamically include generated portfolio items  
        ...Object.fromEntries(
          glob.sync('portfolio/*.html').map(file => [
            file.replace('portfolio/', 'portfolio-').replace('.html', ''),
            file
          ])
        )
      }
    }
  }
});
```

## Deployment Workflow

### Development Workflow
```bash
# Regular development
npm run dev

# Content generation only
npm run generate-content

# Full build with content generation
npm run build

# Preview built site
npm run preview
```

### CI/CD Integration
```bash
# In your deployment script or GitHub Actions:
npm install
npm run generate-content  # Generates HTML files from WordPress
npm run build            # Builds everything including generated content
npm run deploy           # Deploy to hosting
```

## Benefits of This Approach

### ✅ Immediate Deployment Ready
- Creates static HTML files that can be deployed anywhere
- No server-side rendering required
- Works with any static hosting (Netlify, Vercel, GitHub Pages)

### ✅ SEO Optimized
- Each page has proper meta tags and structured data
- Search engines can crawl individual posts/projects
- Clean URLs for each piece of content

### ✅ Fast Performance
- All content is pre-generated at build time
- No API calls during user visits
- Cached and optimized by Vite build process

### ✅ WordPress Integration
- Content management still happens in WordPress
- Designers/writers can use familiar WordPress interface
- Content updates require rebuild but maintain WordPress workflow

## Limitations & Considerations

### ⚠️ Content Updates
- **Manual Rebuild Required:** Content changes require running build script
- **Deploy Process:** Need to rebuild and redeploy for content updates
- **CI/CD Integration:** Can automate with WordPress webhooks if needed

### ⚠️ Dynamic Features
- **Comments:** Would need external service (Disqus, etc.)
- **Search:** Would need client-side search or external service
- **Real-time Data:** Not suitable for frequently changing content

## Implementation Timeline

### Day 1: Setup & Basic Generation
1. Create script structure and NPM commands
2. Build WordPress API client
3. Create basic template processor
4. Test with 1-2 blog posts

### Day 2: Full Implementation  
1. Complete blog post generation
2. Implement portfolio/case study generation
3. Update listing pages with generated content
4. Test full build process

### Day 3: Polish & Deploy
1. Add error handling and logging
2. Optimize generated HTML and SEO tags
3. Test deployment process
4. Deploy to production

## Future Migration Path

This approach creates a perfect stepping stone:
1. **Immediate Solution:** Get deployed by Monday
2. **Eleventy Migration:** Templates and data structure easily transfer
3. **Dynamic Upgrade:** Can later implement the dynamic content plan
4. **Hybrid Approach:** Keep static generation but add dynamic features

---

**Ready to start implementation - this gets you deployed by Monday while maintaining WordPress content management!**