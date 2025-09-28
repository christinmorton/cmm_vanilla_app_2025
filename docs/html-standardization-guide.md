# HTML Standardization Guide
*Clean Class Vocabulary & Reusable Section Patterns for Design System*

## Overview

This guide documents the process of standardizing all HTML files to use a clean, semantic class vocabulary based on the cleaned `index.html` structure. The goal is to create reusable, semantic HTML patterns that support flexible design development while maintaining consistency across all pages.

---

## Standard Class Vocabulary

### Global Navigation Classes

#### Header Navigation
```html
<!-- Standard header structure for all pages -->
<header id="header-nav" class="header-nav">
    <div class="site-container">
        <a class="logo" href="index.html">
            <img src="images/logo_2.png" alt="logo">
        </a>
        
        <button class="mobile-menu-toggle" type="button" aria-label="Toggle navigation">
            <span class="menu-icon"></span>
        </button>
        
        <div class="mobile-menu" id="mobile-menu">
            <div class="mobile-menu-header">
                <button type="button" class="mobile-menu-close" aria-label="Close menu">
                    <!-- Close icon -->
                </button>
            </div>
            
            <div class="mobile-menu-content">
                <div class="mobile-only">
                    <img src="images/profile-pic.png" alt="Profile" class="profile-image">
                    <div class="cta-section">
                        <a href="contact.html" class="action-button">
                            <span>Hire Me</span>
                            <div class="button-icon">
                                <!-- Arrow icon -->
                            </div>
                        </a>
                    </div>
                </div>
                
                <ul class="social-links">
                    <!-- Social media links -->
                </ul>
            </div>
        </div>
    </div>
</header>
```

#### Side Navigation
```html
<!-- Standard side navigation for all pages -->
<nav id="side-nav" class="side-navigation">
    <ul class="nav-menu">
        <li>
            <a href="index.html" class="nav-link active" aria-current="page">
                <!-- Home icon -->
            </a>
        </li>
        <li>
            <a href="about.html" class="nav-link">
                <!-- Person icon -->
            </a>
        </li>
        <li>
            <a href="service.html" class="nav-link">
                <!-- Services icon -->
            </a>
        </li>
        <li>
            <a href="contact.html" class="nav-link">
                <!-- Contact icon -->
            </a>
        </li>
    </ul>
</nav>
```

### Layout Classes

#### Container System
- `site-container` - Main content container (replaces `container-fluid padding-side`)
- `section-padding` - Standard section padding
- `content-wrapper` - Inner content wrapper when needed

#### Grid/Layout Patterns
- `two-col-layout` - Two-column content layout
- `three-col-layout` - Three-column grid layout
- `hero-layout` - Hero section layout (image + content)
- `centered-content` - Centered content layout
- `full-width` - Full viewport width content

### Component Classes

#### Buttons
- `action-button` - Primary call-to-action buttons
- `button-icon` - Icon container within buttons
- `secondary-button` - Secondary action buttons
- `link-button` - Text-based button links

#### Content Components
- `text-highlight` - Highlighted text (brand color)
- `section-title` - Main section headings
- `section-subtitle` - Section subheadings
- `content-card` - Content card containers
- `image-gallery` - Image gallery containers

#### Interactive Elements
- `social-links` - Social media link containers
- `social-icon` - Social media icons
- `form-group` - Form field groups
- `form-input` - Form input fields
- `form-textarea` - Form textarea fields

---

## Page-Specific Section Patterns

### Homepage (`index.html`) ✅ COMPLETED
**Purpose**: Landing page with hero section and main CTA

**Sections**:
- `hero-section` - Main hero area with title, description, CTA, and profile image
- Global navigation (header + side nav)

### About Page (`about.html`)
**Purpose**: Personal biography, skills, experience showcase

**Proposed Sections**:
```html
<section class="about-hero">
    <div class="site-container">
        <div class="hero-layout">
            <div class="hero-content">
                <h1 class="section-title">About <span class="text-highlight">Christin</span></h1>
                <p class="hero-description">Biography and introduction</p>
            </div>
            <div class="hero-image">
                <img src="profile-image.jpg" alt="About Christin" class="profile-image">
            </div>
        </div>
    </div>
</section>

<section class="skills-section">
    <div class="site-container">
        <div class="content-wrapper">
            <h2 class="section-title">Skills & <span class="text-highlight">Experience</span></h2>
            
            <!-- Tab Navigation -->
            <div class="content-tabs">
                <button class="tab-trigger active" data-tab="skills">Skills</button>
                <button class="tab-trigger" data-tab="experience">Experience</button>
                <button class="tab-trigger" data-tab="education">Education</button>
            </div>
            
            <!-- Tab Content -->
            <div class="tab-content active" id="skills">
                <div class="skills-grid">
                    <div class="skill-card">
                        <h3 class="skill-title">Web Development</h3>
                        <p class="skill-description">Description of web development skills</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

### Service Page (`service.html`) ✅ COMPLETED
**Purpose**: Service detail page with comprehensive information

**Implemented Sections**:
```html
<section class="service-detail-hero">
    <div class="site-container">
        <div class="centered-content">
            <nav class="breadcrumb-nav">
                <a class="breadcrumb-link" href="index.html">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Service Details</span>
            </nav>
            
            <h1 class="section-title">
                Service <span class="text-highlight">Details</span>
            </h1>
            <p class="hero-description">
                Comprehensive web development solutions tailored to your business needs.
            </p>
        </div>
    </div>
</section>

<section class="service-detail-content">
    <div class="site-container">
        <div class="service-content">
            <div class="service-header">
                <h2 class="service-title">Custom Web Development</h2>
            </div>
            
            <div class="service-description">
                <p>Professional web development services focused on creating high-performance, scalable websites that drive business growth.</p>
                <p>Our comprehensive approach ensures your website performs exceptionally across all devices and platforms.</p>
            </div>
            
            <div class="service-showcase">
                <div class="service-image">
                    <img src="images/portfolio-large2.jpg" alt="Web Development Showcase" class="showcase-image">
                </div>
            </div>
            
            <div class="service-details">
                <div class="service-quote">
                    <blockquote class="quote-text">
                        "Excellence in web development means creating solutions that scale with your business growth."
                    </blockquote>
                </div>
                
                <div class="service-features">
                    <h3 class="features-title">What's Included</h3>
                    <ul class="features-list">
                        <li class="feature-item">
                            <span class="feature-check">✓</span>
                            <span class="feature-text">Custom responsive design and development</span>
                        </li>
                        <li class="feature-item">
                            <span class="feature-check">✓</span>
                            <span class="feature-text">Performance optimization and SEO implementation</span>
                        </li>
                        <!-- More features -->
                    </ul>
                </div>
                
                <div class="service-conclusion">
                    <p>Ready to transform your online presence?</p>
                    
                    <div class="service-cta">
                        <a href="contact.html" class="action-button">
                            <span>Start Your Project</span>
                            <div class="button-icon">
                                <svg class="arrow-right" width="28" height="28">
                                    <use xlink:href="#arrow-right"></use>
                                </svg>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

### Portfolio Page (`portfolio.html`) ✅ COMPLETED
**Purpose**: Portfolio gallery with slider showcase

**Implemented Sections**:
```html
<section class="portfolio-hero">
    <div class="site-container">
        <div class="hero-layout">
            <div class="hero-content">
                <h1 class="section-title">
                    See <span class="text-highlight">My Works</span>
                </h1>
                <p class="section-description">
                    Discover a collection of my most recent and notable projects.
                </p>
            </div>
            <div class="hero-gallery">
                <div class="portfolio-slider">
                    <div class="slider-wrapper">
                        <div class="slider-slide">
                            <div class="portfolio-grid">
                                <div class="portfolio-item">
                                    <div class="portfolio-image">
                                        <a href="portfolio-details.html">
                                            <img src="images/project1.jpg" alt="project description">
                                        </a>
                                    </div>
                                </div>
                                <!-- Repeat for more items -->
                            </div>
                        </div>
                    </div>
                    <div class="slider-pagination"></div>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Portfolio Gallery Classes**:
- `.portfolio-hero` - Main hero section containing portfolio showcase
- `.hero-gallery` - Container for portfolio slider/gallery
- `.portfolio-slider` - Swiper/slider container for portfolio items
- `.slider-wrapper` - Contains multiple slides for carousel functionality  
- `.slider-slide` - Individual slide in portfolio carousel
- `.portfolio-grid` - Grid layout for portfolio items within a slide
- `.portfolio-item` - Individual portfolio project container
- `.portfolio-image` - Image wrapper with hover effects and link
- `.slider-pagination` - Dots/controls for slide navigation

### Blog Page (`blog.html`) ✅ COMPLETED
**Purpose**: Blog listing with articles and pagination

**Implemented Sections**:
```html
<section class="blog-hero">
    <div class="site-container">
        <div class="centered-content">
            <nav class="breadcrumb-nav">
                <a class="breadcrumb-link" href="index.html">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Blog</span>
            </nav>
            <h1 class="section-title">
                Our <span class="text-highlight">Blog</span>
            </h1>
            <p class="section-description">
                Et est, dolorem provident vel debitis perspiciatis ducimus.
            </p>
        </div>
    </div>
</section>

<section class="blog-listing">
    <div class="site-container">
        <div class="article-grid">
            <article class="article-card">
                <div class="article-image">
                    <a href="single-post.html">
                        <img src="images/blog4.jpg" alt="Blog post image">
                    </a>
                </div>
                <div class="article-content">
                    <h2 class="article-title">
                        <a href="single-post.html">Why should we invest more in branding first?</a>
                    </h2>
                    <p class="article-excerpt">
                        Elit adipi massa diam in dignissim... 
                        <a href="single-post.html" class="read-more-link">Read more</a>
                    </p>
                </div>
            </article>
            <!-- More articles -->
        </div>
        
        <nav class="pagination-nav">
            <ul class="pagination-list">
                <li class="pagination-item current">
                    <a href="#" class="pagination-link" aria-current="page">1</a>
                </li>
                <!-- More pagination items -->
            </ul>
        </nav>
    </div>
</section>
```

**Blog Listing Classes**:
- `.blog-hero` - Hero section with breadcrumb and title
- `.blog-listing` - Main section containing article grid and pagination
- `.article-grid` - Grid container for blog articles
- `.article-card` - Individual blog post container
- `.article-image` - Image wrapper for blog post thumbnail
- `.article-content` - Container for article title and excerpt
- `.article-title` - Blog post title (h2 element)
- `.article-excerpt` - Blog post preview text
- `.read-more-link` - Link to full article
- `.pagination-nav` - Navigation container for pagination
- `.pagination-list` - List of pagination links
- `.pagination-item` - Individual pagination item
- `.pagination-link` - Pagination link element

### Single Post Page (`single-post.html`) ✅ COMPLETED
**Purpose**: Blog post detail page with article content, meta information, and navigation

**Implemented Sections**:
```html
<section class="post-hero">
    <div class="site-container">
        <div class="centered-content">
            <nav class="breadcrumb-nav">
                <a class="breadcrumb-link" href="index.html">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Single Post</span>
            </nav>
            <h1 class="section-title">
                Single <span class="text-highlight">Post</span>
            </h1>
            <p class="section-description">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit...
            </p>
        </div>
    </div>
</section>

<article class="post-content">
    <div class="site-container">
        <div class="post-article">
            <div class="post-featured-image">
                <img src="images/blogpage-img1.jpg" alt="Featured image">
            </div>
            
            <div class="post-body">
                <div class="post-text">
                    <p>Article content...</p>
                    <blockquote class="post-quote">
                        "Quote content here..."
                    </blockquote>
                    <h2 class="post-subheading">Section Heading</h2>
                    <ul class="post-list">
                        <li>List item...</li>
                    </ul>
                </div>
                
                <div class="post-meta">
                    <div class="post-tags">
                        <h3 class="meta-title">Tags:</h3>
                        <ul class="tag-list">
                            <li><a href="#" class="tag-link">Denim</a></li>
                        </ul>
                    </div>
                    
                    <div class="post-share">
                        <h3 class="meta-title">Share:</h3>
                        <ul class="share-list">
                            <li><a href="#" class="share-link">Facebook</a></li>
                        </ul>
                    </div>
                </div>
                
                <nav class="post-navigation">
                    <div class="nav-links">
                        <a href="#" class="nav-prev">
                            <span class="nav-label">Previous</span>
                            <h3 class="nav-title">Previous Post Title</h3>
                        </a>
                        <a href="#" class="nav-next">
                            <span class="nav-label">Next</span>
                            <h3 class="nav-title">Next Post Title</h3>
                        </a>
                    </div>
                </nav>
            </div>
        </div>
    </div>
</article>
```

**Single Post Classes**:
- `.post-hero` - Hero section with breadcrumb and title
- `.post-content` - Main article container (uses semantic `<article>` element)
- `.post-article` - Article content wrapper
- `.post-featured-image` - Featured/hero image for the post
- `.post-body` - Main content area containing text, meta, and navigation
- `.post-text` - Article text content container
- `.post-quote` - Blockquote styling for quotes within article
- `.post-subheading` - Section headings within article (h2 elements)
- `.post-list` - Lists within article content
- `.post-meta` - Container for tags and sharing section
- `.post-tags` - Tags section wrapper
- `.meta-title` - Title for meta sections (Tags:, Share:)
- `.tag-list` - List of post tags
- `.tag-link` - Individual tag links
- `.post-share` - Social sharing section
- `.share-list` - List of social share links
- `.share-link` - Individual share links
- `.post-navigation` - Post navigation (prev/next) container
- `.nav-links` - Container for navigation links
- `.nav-prev` / `.nav-next` - Previous and next post links
- `.nav-label` - Label for navigation (Previous/Next)
- `.nav-title` - Post titles in navigation

### Portfolio Details Page (`portfolio-details.html`) ✅ COMPLETED
**Purpose**: Individual project showcase page with detailed information, images, and description

**Implemented Sections**:
```html
<section class="portfolio-details-hero">
    <div class="site-container">
        <div class="centered-content">
            <nav class="breadcrumb-nav">
                <a class="breadcrumb-link" href="index.html">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Portfolio Details</span>
            </nav>
            <h1 class="section-title">
                Portfolio <span class="text-highlight">Details</span>
            </h1>
            <p class="section-description">
                Project overview and description...
            </p>
        </div>
        
        <div class="portfolio-details-content">
            <div class="project-details">
                <h2 class="project-title">Project Name</h2>
                <div class="project-meta">
                    <ul class="project-info-list">
                        <li class="project-info-item">
                            <h3 class="info-label text-highlight">Client</h3>
                            <p class="info-value">Client Name</p>
                        </li>
                        <li class="project-info-item">
                            <h3 class="info-label text-highlight">Date</h3>
                            <p class="info-value">Project Date</p>
                        </li>
                        <li class="project-info-item">
                            <h3 class="info-label text-highlight">Project link</h3>
                            <p class="info-value"><a href="#" target="_blank">Project URL</a></p>
                        </li>
                    </ul>
                </div>
                
                <div class="project-description">
                    <p>Project description paragraphs...</p>
                </div>
                
                <!-- Two-column image gallery -->
                <div class="project-gallery two-col-layout">
                    <div class="gallery-item">
                        <div class="project-image">
                            <figure>
                                <a href="images/project1.jpg" title="Project" class="image-link">
                                    <img src="images/project1.jpg" alt="project" class="showcase-image">
                                </a>
                            </figure>
                            <figcaption class="image-caption">Image Caption</figcaption>
                        </div>
                    </div>
                    <!-- Repeat for more images -->
                </div>
                
                <!-- Full-width featured image -->
                <div class="project-gallery full-width">
                    <div class="gallery-item">
                        <div class="project-image featured-image">
                            <figure>
                                <a href="images/project-large.jpg" title="Project" class="image-link">
                                    <img src="images/project-large.jpg" alt="project" class="showcase-image">
                                </a>
                            </figure>
                            <figcaption class="image-caption">Featured Image Caption</figcaption>
                        </div>
                    </div>
                </div>
                
                <!-- Project quote -->
                <div class="project-quote">
                    <blockquote class="quote-text">"Project testimonial or important quote..."</blockquote>
                </div>
                
                <!-- Project features list -->
                <div class="project-features">
                    <h3 class="features-title">Key Features</h3>
                    <ul class="features-list">
                        <li class="feature-item">Feature description</li>
                        <li class="feature-item">Another feature</li>
                    </ul>
                </div>
                
                <!-- Additional text sections -->
                <div class="project-text-section">
                    <p class="project-text">Additional project details...</p>
                    <h3 class="project-subheading">Section Heading</h3>
                    <p class="project-text">More detailed information...</p>
                </div>
                
                <!-- Project conclusion -->
                <div class="project-conclusion">
                    <p class="project-text">Final thoughts and project wrap-up...</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Portfolio Details Classes**:
- `.portfolio-details-hero` - Hero section with breadcrumb and project overview
- `.portfolio-details-content` - Main content section containing all project details
- `.project-details` - Container for all project information sections
- `.project-title` - Main project title (h2 element)
- `.project-meta` - Project metadata section (client, date, links)
- `.project-info-list` - List container for project metadata
- `.project-info-item` - Individual metadata item (client, date, etc.)
- `.info-label` - Label for metadata (Client:, Date:, etc.)
- `.info-value` - Value for metadata items
- `.project-description` - Project description text container
- `.project-gallery` - Gallery container (can be combined with layout classes)
  - `.two-col-layout` - Two-column image layout
  - `.full-width` - Full-width image layout
- `.gallery-item` - Individual gallery image container
- `.project-image` - Image wrapper with optional modifiers:
  - `.featured-image` - For hero/featured images with special styling
- `.showcase-image` - Image element class for consistent styling
- `.image-caption` - Image caption styling (figcaption element)
- `.image-link` - Link wrapper for gallery images
- `.project-quote` - Container for project testimonials/quotes
- `.quote-text` - Blockquote styling within projects
- `.project-features` - Container for project features/highlights
- `.features-title` - Title for features section
- `.features-list` - List of project features
- `.feature-item` - Individual feature item
- `.project-text-section` - General text content sections
- `.project-text` - Standard text paragraphs within project
- `.project-subheading` - Section headings within project content (h3 elements)
- `.project-conclusion` - Final section/wrap-up content

### Portfolio Masonry Page (`portfolio-masonry.html`) ✅ COMPLETED
**Purpose**: Portfolio gallery with filterable masonry grid layout for showcasing projects by category

**Implemented Sections**:
```html
<section class="portfolio-masonry-hero">
    <div class="site-container">
        <div class="centered-content">
            <nav class="breadcrumb-nav">
                <a class="breadcrumb-link" href="index.html">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Portfolio Masonry</span>
            </nav>
            <h1 class="section-title">
                Portfolio <span class="text-highlight">Masonry</span>
            </h1>
            <p class="section-description">
                Project gallery overview...
            </p>
        </div>
        
        <div class="portfolio-masonry-content">
            <!-- Filter Controls -->
            <div class="portfolio-filter-section">
                <div class="filter-controls">
                    <button class="filter-button active" data-filter="*">All</button>
                    <button class="filter-button" data-filter=".logo">Logo</button>
                    <button class="filter-button" data-filter=".web">Web Design</button>
                    <button class="filter-button" data-filter=".mobile">Mobile App</button>
                </div>
            </div>
            
            <!-- Portfolio Grid -->
            <div class="portfolio-masonry-grid">
                <div class="masonry-item web" data-category="web">
                    <div class="portfolio-card">
                        <div class="portfolio-image">
                            <a href="portfolio-details.html" class="portfolio-link">
                                <img src="images/project1.jpg" alt="Web Design Project" class="card-image">
                            </a>
                        </div>
                    </div>
                </div>
                <!-- Repeat for more portfolio items -->
            </div>
        </div>
    </div>
</section>
```

**Portfolio Masonry Classes**:
- `.portfolio-masonry-hero` - Hero section with breadcrumb and page overview
- `.portfolio-masonry-content` - Main content section containing filter and grid
- `.portfolio-filter-section` - Container for filter controls
- `.filter-controls` - Filter button controls wrapper
- `.filter-button` - Individual filter buttons with optional `.active` state
- `.portfolio-masonry-grid` - Masonry/isotope grid container for portfolio items
- `.masonry-item` - Individual portfolio item with category classes (`.web`, `.logo`, `.mobile`)
- `.portfolio-card` - Portfolio item card wrapper
- `.portfolio-image` - Image container within portfolio cards
- `.portfolio-link` - Link wrapper for portfolio items
- `.card-image` - Image element within portfolio cards

**Filter System**:
- Uses `data-filter` attributes on filter buttons for JavaScript filtering
- Uses `data-category` attributes on masonry items for categorization
- Category classes (`.web`, `.logo`, `.mobile`) for CSS-based filtering
- `.active` state on filter buttons to show current selection

### Contact Page (`contact.html`) ✅ COMPLETED
**Purpose**: Contact form and information

**Implemented Sections**:
```html
<section class="contact-hero">
    <div class="site-container">
        <div class="hero-layout">
            <div class="hero-content">
                <h1 class="section-title">Let's work <span class="text-highlight">Together</span></h1>
                <p class="hero-description">Ready to bring your ideas to life? Get in touch, and let's discuss how I can help you achieve your goals.</p>
            </div>
            
            <div class="contact-form-section">
                <form id="contactForm" action="contact.php" method="post" class="form-wrapper">
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" name="name" placeholder="Full Name*" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <input type="email" name="email" placeholder="Email*" class="form-input" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <input type="tel" name="phone" placeholder="Phone" class="form-input">
                        </div>
                        <div class="form-group">
                            <input type="text" name="subject" placeholder="Subject" class="form-input">
                        </div>
                    </div>
                    
                    <div class="form-group form-group-full">
                        <textarea name="message" placeholder="Message" class="form-textarea" rows="4" required></textarea>
                    </div>
                    
                    <div class="form-submit">
                        <button type="submit" name="submit" class="action-button form-submit-button">
                            <span>Let's Talk</span>
                            <div class="button-icon">
                                <svg class="arrow-right" width="28" height="28">
                                    <use xlink:href="#arrow-right"></use>
                                </svg>
                            </div>
                        </button>
                    </div>
                    
                    <!-- Form Status Messages -->
                    <div class="form-status" id="formStatus" style="display: none;">
                        <div class="form-success" id="formSuccess">
                            <p class="success-message">Thank you! Your message has been sent successfully.</p>
                        </div>
                        <div class="form-error" id="formError">
                            <p class="error-message">Sorry, there was an error sending your message. Please try again.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>
```

### Portfolio Page (`portfolio.html`)
**Purpose**: Showcase of work and projects

**Proposed Sections**:
```html
<section class="portfolio-hero">
    <div class="site-container">
        <div class="centered-content">
            <h1 class="section-title">My <span class="text-highlight">Work</span></h1>
            <p class="hero-description">A showcase of recent projects</p>
        </div>
    </div>
</section>

<section class="portfolio-filter">
    <div class="site-container">
        <div class="filter-controls">
            <button class="filter-button active" data-filter="all">All Projects</button>
            <button class="filter-button" data-filter="web">Web Design</button>
            <button class="filter-button" data-filter="app">Applications</button>
        </div>
    </div>
</section>

<section class="portfolio-gallery">
    <div class="site-container">
        <div class="portfolio-grid">
            <div class="portfolio-item" data-category="web">
                <div class="portfolio-image">
                    <img src="project-image.jpg" alt="Project Name">
                    <div class="portfolio-overlay">
                        <h3 class="portfolio-title">Project Name</h3>
                        <p class="portfolio-category">Web Design</p>
                        <a href="portfolio-details.html" class="portfolio-link">View Project</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

### Blog Page (`blog.html`)
**Purpose**: Articles and blog posts

**Proposed Sections**:
```html
<section class="blog-hero">
    <div class="site-container">
        <div class="centered-content">
            <h1 class="section-title">Latest <span class="text-highlight">Articles</span></h1>
            <p class="hero-description">Thoughts on web development and design</p>
        </div>
    </div>
</section>

<section class="blog-grid">
    <div class="site-container">
        <div class="article-grid">
            <article class="article-card">
                <div class="article-image">
                    <img src="article-image.jpg" alt="Article Title">
                </div>
                <div class="article-content">
                    <h3 class="article-title">Article Title</h3>
                    <p class="article-excerpt">Brief description of the article...</p>
                    <div class="article-meta">
                        <span class="article-date">January 15, 2025</span>
                        <span class="article-category">Web Development</span>
                    </div>
                    <a href="single-post.html" class="link-button">Read More</a>
                </div>
            </article>
        </div>
    </div>
</section>
```

---

## Reusable Component Patterns

### Hero Section Pattern
```html
<!-- Flexible hero section for any page -->
<section class="[page-name]-hero">
    <div class="site-container">
        <div class="hero-layout"> <!-- or "centered-content" for single-column -->
            <div class="hero-content">
                <h1 class="section-title">[Title] <span class="text-highlight">[Highlighted]</span></h1>
                <p class="hero-description">[Description]</p>
                <!-- Optional CTA -->
                <a href="#" class="action-button">
                    <span>[Button Text]</span>
                    <div class="button-icon"><!-- Icon --></div>
                </a>
            </div>
            <!-- Optional hero image -->
            <div class="hero-image">
                <img src="[image-source]" alt="[alt-text]">
            </div>
        </div>
    </div>
</section>
```

### Content Section Pattern
```html
<!-- Standard content section -->
<section class="[section-name]">
    <div class="site-container">
        <div class="content-wrapper"> <!-- or layout class like "two-col-layout" -->
            <h2 class="section-title">[Section Title]</h2>
            <!-- Section content -->
        </div>
    </div>
</section>
```

### Card Grid Pattern
```html
<!-- Reusable card grid for services, portfolio, blog, etc. -->
<div class="[item-type]-grid"> <!-- services-grid, portfolio-grid, article-grid -->
    <div class="[item-type]-card"> <!-- service-card, portfolio-item, article-card -->
        <div class="[item-type]-image">
            <img src="[image-source]" alt="[alt-text]">
        </div>
        <div class="[item-type]-content">
            <h3 class="[item-type]-title">[Title]</h3>
            <p class="[item-type]-description">[Description]</p>
            <a href="#" class="link-button">[Link Text]</a>
        </div>
    </div>
</div>
```

---

## Migration Process

### Step-by-Step HTML File Migration

#### 1. **Backup Original File**
Always keep a backup of the original Bootstrap version

#### 2. **Replace Global Navigation**
- Replace Bootstrap `navbar` structure with standard `header-nav`
- Replace Bootstrap `offcanvas` with `mobile-menu`
- Replace Bootstrap nav classes with `nav-link`, `nav-menu`

#### 3. **Update Container Structure**
- Replace `container-fluid padding-side` with `site-container`
- Remove Bootstrap grid classes (`row`, `col-*`)
- Use semantic layout classes (`two-col-layout`, `hero-layout`, etc.)

#### 4. **Replace Bootstrap Components**
- Replace `btn` classes with `action-button`, `secondary-button`, `link-button`
- Replace Bootstrap form classes with `form-group`, `form-input`, etc.
- Replace Bootstrap utility classes with semantic alternatives

#### 5. **Update Section Structure**
- Give each major section a semantic class name
- Use page-specific naming: `about-hero`, `services-grid`, `contact-form-section`
- Apply consistent inner structure with `content-wrapper` or layout classes

#### 6. **Clean Bootstrap Dependencies**
- Remove Bootstrap `data-bs-*` attributes
- Remove Bootstrap utility classes (`d-*`, `justify-*`, `align-*`, etc.)
- Remove Bootstrap component classes not needed

### Before/After Examples

#### Bootstrap Navigation (Before)
```html
<nav class="navbar navbar-expand-lg py-4 z-1" data-bs-theme="dark">
    <div class="container-fluid padding-side">
        <a class="navbar-brand" href="index.html">Logo</a>
        <button class="navbar-toggler" data-bs-toggle="offcanvas">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="offcanvas offcanvas-end">
            <!-- Complex Bootstrap offcanvas structure -->
        </div>
    </div>
</nav>
```

#### Clean Navigation (After)
```html
<header id="header-nav" class="header-nav">
    <div class="site-container">
        <a class="logo" href="index.html">Logo</a>
        <button class="mobile-menu-toggle">
            <span class="menu-icon"></span>
        </button>
        <div class="mobile-menu">
            <!-- Clean, semantic mobile menu structure -->
        </div>
    </div>
</header>
```

---

## Form Component Patterns 
*Reusable form structures for contact forms, newsletters, and user input*

### Standard Form Wrapper Structure
```html
<!-- Base form component -->
<div class="contact-form-section"> <!-- or newsletter-form, search-form, etc. -->
    <form class="form-wrapper" action="[endpoint]" method="post" id="[formId]">
        <!-- Form rows and groups here -->
    </form>
</div>
```

### Form Layout Classes

#### Two-Column Form Row
```html
<div class="form-row">
    <div class="form-group">
        <input type="text" name="name" placeholder="Full Name*" class="form-input" required>
    </div>
    <div class="form-group">
        <input type="email" name="email" placeholder="Email*" class="form-input" required>
    </div>
</div>
```

#### Full-Width Form Group
```html
<div class="form-group form-group-full">
    <textarea name="message" placeholder="Message" class="form-textarea" rows="4" required></textarea>
</div>
```

#### Single Form Group
```html
<div class="form-group">
    <input type="text" name="subject" placeholder="Subject" class="form-input">
</div>
```

### Form Input Types & Classes

#### Text Inputs
```html
<!-- Standard text input -->
<input type="text" name="name" placeholder="Full Name*" class="form-input" required>

<!-- Email input -->
<input type="email" name="email" placeholder="Email*" class="form-input" required>

<!-- Phone input -->
<input type="tel" name="phone" placeholder="Phone" class="form-input">

<!-- URL input -->
<input type="url" name="website" placeholder="Website" class="form-input">
```

#### Textarea
```html
<textarea name="message" placeholder="Message" class="form-textarea" rows="4" required></textarea>
```

#### Select Dropdown
```html
<select name="service" class="form-select" required>
    <option value="">Select a Service</option>
    <option value="web-design">Web Design</option>
    <option value="web-development">Web Development</option>
    <option value="consulting">Consulting</option>
</select>
```

#### Checkbox & Radio Groups
```html
<!-- Checkbox group -->
<div class="form-group form-group-full">
    <div class="form-check-group">
        <label class="form-check-label">
            <input type="checkbox" name="services[]" value="design" class="form-checkbox">
            <span class="check-indicator"></span>
            Web Design
        </label>
        <label class="form-check-label">
            <input type="checkbox" name="services[]" value="development" class="form-checkbox">
            <span class="check-indicator"></span>
            Web Development
        </label>
    </div>
</div>

<!-- Radio group -->
<div class="form-group form-group-full">
    <div class="form-radio-group">
        <label class="form-radio-label">
            <input type="radio" name="project_type" value="new" class="form-radio" required>
            <span class="radio-indicator"></span>
            New Project
        </label>
        <label class="form-radio-label">
            <input type="radio" name="project_type" value="redesign" class="form-radio" required>
            <span class="radio-indicator"></span>
            Website Redesign
        </label>
    </div>
</div>
```

### Form Submit Section
```html
<div class="form-submit">
    <button type="submit" name="submit" class="action-button form-submit-button">
        <span>Send Message</span>
        <div class="button-icon">
            <svg class="arrow-right" width="28" height="28">
                <use xlink:href="#arrow-right"></use>
            </svg>
        </div>
    </button>
</div>
```

### Form Status Messages
```html
<!-- Form feedback system -->
<div class="form-status" id="formStatus" style="display: none;">
    <div class="form-success" id="formSuccess">
        <p class="success-message">Thank you! Your message has been sent successfully.</p>
    </div>
    <div class="form-error" id="formError">
        <p class="error-message">Sorry, there was an error sending your message. Please try again.</p>
    </div>
    <div class="form-loading" id="formLoading">
        <p class="loading-message">Sending your message...</p>
    </div>
</div>
```

### Complete Contact Form Example
```html
<section class="contact-hero">
    <div class="site-container">
        <div class="hero-layout">
            <div class="hero-content">
                <h1 class="section-title">Get In <span class="text-highlight">Touch</span></h1>
                <p class="hero-description">Ready to start your project? Let's discuss your ideas.</p>
            </div>
            
            <div class="contact-form-section">
                <form id="contactForm" action="contact.php" method="post" class="form-wrapper">
                    <!-- Personal Information Row -->
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" name="name" placeholder="Full Name*" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <input type="email" name="email" placeholder="Email*" class="form-input" required>
                        </div>
                    </div>
                    
                    <!-- Contact Details Row -->
                    <div class="form-row">
                        <div class="form-group">
                            <input type="tel" name="phone" placeholder="Phone" class="form-input">
                        </div>
                        <div class="form-group">
                            <input type="text" name="company" placeholder="Company" class="form-input">
                        </div>
                    </div>
                    
                    <!-- Project Information -->
                    <div class="form-group form-group-full">
                        <select name="service" class="form-select" required>
                            <option value="">Select a Service*</option>
                            <option value="web-design">Web Design</option>
                            <option value="web-development">Web Development</option>
                            <option value="consulting">Consulting</option>
                        </select>
                    </div>
                    
                    <!-- Message -->
                    <div class="form-group form-group-full">
                        <textarea name="message" placeholder="Tell us about your project*" class="form-textarea" rows="4" required></textarea>
                    </div>
                    
                    <!-- Budget Range (Optional) -->
                    <div class="form-group form-group-full">
                        <div class="form-radio-group">
                            <label class="form-radio-label">
                                <input type="radio" name="budget" value="under-5k" class="form-radio">
                                <span class="radio-indicator"></span>
                                Under $5,000
                            </label>
                            <label class="form-radio-label">
                                <input type="radio" name="budget" value="5k-15k" class="form-radio">
                                <span class="radio-indicator"></span>
                                $5,000 - $15,000
                            </label>
                            <label class="form-radio-label">
                                <input type="radio" name="budget" value="15k-plus" class="form-radio">
                                <span class="radio-indicator"></span>
                                $15,000+
                            </label>
                        </div>
                    </div>
                    
                    <!-- Submit Button -->
                    <div class="form-submit">
                        <button type="submit" name="submit" class="action-button form-submit-button">
                            <span>Send Message</span>
                            <div class="button-icon">
                                <svg class="arrow-right" width="28" height="28">
                                    <use xlink:href="#arrow-right"></use>
                                </svg>
                            </div>
                        </button>
                    </div>
                    
                    <!-- Status Messages -->
                    <div class="form-status" id="formStatus" style="display: none;">
                        <div class="form-success" id="formSuccess">
                            <p class="success-message">Thank you! Your message has been sent successfully.</p>
                        </div>
                        <div class="form-error" id="formError">
                            <p class="error-message">Sorry, there was an error sending your message. Please try again.</p>
                        </div>
                        <div class="form-loading" id="formLoading">
                            <p class="loading-message">Sending your message...</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>
```

### Form Variations

#### Newsletter Signup Form
```html
<div class="newsletter-form-section">
    <form class="form-wrapper newsletter-form" action="newsletter.php" method="post">
        <div class="form-row">
            <div class="form-group">
                <input type="email" name="email" placeholder="Your email address" class="form-input" required>
            </div>
            <div class="form-submit">
                <button type="submit" class="action-button">
                    <span>Subscribe</span>
                </button>
            </div>
        </div>
    </form>
</div>
```

#### Search Form
```html
<div class="search-form-section">
    <form class="form-wrapper search-form" action="search.php" method="get">
        <div class="form-group search-group">
            <input type="search" name="q" placeholder="Search..." class="form-input search-input" required>
            <button type="submit" class="search-button">
                <svg width="20" height="20">
                    <use xlink:href="#search"></use>
                </svg>
            </button>
        </div>
    </form>
</div>
```

### Form Accessibility Features
- All inputs have proper `name` attributes for form submission
- Required fields marked with `required` attribute and `*` in placeholder
- Proper input types (`email`, `tel`, `url`) for better mobile keyboards
- ARIA labels can be added via `aria-label` or `aria-describedby`
- Form validation works with native HTML5 validation
- Semantic form structure for screen readers

### Form Enhancement JavaScript Hooks
Common class names for JavaScript enhancement:
- `.form-wrapper` - Main form container
- `.form-submit-button` - Submit button
- `.form-status` - Status message container
- `.form-success`, `.form-error`, `.form-loading` - Status states
- Form field classes for validation styling

This form system provides a consistent, accessible, and easily customizable foundation for all user input needs across the website.

---

## Benefits of This Approach

### 1. **Design Flexibility**
- Clean semantic HTML ready for any design direction
- No Bootstrap constraints limiting creativity
- Custom CSS can be built from scratch without conflicts

### 2. **Consistency**
- Standardized class vocabulary across all pages
- Reusable section patterns reduce code duplication
- Predictable HTML structure for development

### 3. **Maintainability**
- Descriptive class names make code self-documenting
- Modular component approach enables easy updates
- Clear separation of concerns between structure and styling

### 4. **Performance**
- Removes unused Bootstrap CSS
- Semantic HTML is more accessible
- Cleaner markup improves page load speed

### 5. **Development Speed**
- Established patterns speed up new page creation
- Consistent vocabulary reduces decision fatigue
- Reusable components enable rapid prototyping

---

## Next Steps

### Immediate Tasks
1. ✅ Document standardization guide
2. ✅ Apply standardization to `about.html`
3. ✅ Apply to `contact.html`
4. 📋 Apply to `service.html`
5. 📋 Apply to `portfolio.html`
6. 📋 Apply to `blog.html`
7. 📋 Apply to remaining HTML files

### Future Enhancements
- Create component library documentation
- Build design tokens for consistent styling
- Implement CSS custom properties system
- Add accessibility guidelines for each component
- Create responsive behavior documentation

This guide provides the foundation for creating a clean, maintainable, and flexible HTML structure that supports rapid design development while maintaining consistency across your entire portfolio website.