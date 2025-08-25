# HTML Migration Checklist
*Step-by-step guide for standardizing remaining HTML files*

## ✅ Completed Files
- [x] **index.html** - Clean semantic structure (baseline)
- [x] **about.html** - Fully standardized ✅
- [x] **contact.html** - Contact form with reusable form components ✅

## 📋 Remaining Files to Migrate

### High Priority
- [x] **service.html** - Services showcase ✅
- [x] **portfolio.html** - Project gallery ✅

### Medium Priority  
- [x] **blog.html** - Article listing ✅
- [ ] **single-post.html** - Individual blog posts
- [ ] **portfolio-details.html** - Project detail pages
- [ ] **portfolio-masonry.html** - Masonry portfolio layout

---

## Migration Process for Each File

### Step 1: Header Navigation
**Replace Bootstrap navbar with standardized header:**

```html
<!-- FROM Bootstrap -->
<nav class="navbar navbar-expand-lg py-4 z-1" data-bs-theme="dark">
    <div class="container-fluid padding-side">
        <a class="navbar-brand" href="index.html">Logo</a>
        <button class="navbar-toggler" data-bs-toggle="offcanvas">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="offcanvas offcanvas-end">
            <!-- Complex offcanvas structure -->
        </div>
    </div>
</nav>

<!-- TO Standardized -->
<header id="header-nav" class="header-nav">
    <div class="site-container">
        <a class="logo" href="index.html">Logo</a>
        <button class="mobile-menu-toggle" type="button" aria-label="Toggle navigation">
            <span class="menu-icon"></span>
        </button>
        <div class="mobile-menu" id="mobile-menu">
            <div class="mobile-menu-header">
                <button type="button" class="mobile-menu-close" aria-label="Close menu">
                    <svg width="16" height="16"><use xlink:href="#close"></use></svg>
                </button>
            </div>
            <div class="mobile-menu-content">
                <div class="mobile-only">
                    <img src="images/my_profile_pic_2025_round-out-effect_transparent_2.png" alt="Profile" class="profile-image">
                    <div class="cta-section">
                        <a href="contact.html" class="action-button">
                            <span>Hire Me</span>
                            <div class="button-icon">
                                <svg class="arrow-right" width="28" height="28"><use xlink:href="#arrow-right"></use></svg>
                            </div>
                        </a>
                    </div>
                </div>
                <ul class="social-links">
                    <!-- Standard social media links -->
                </ul>
            </div>
        </div>
    </div>
</header>
```

### Step 2: Main Content Sections
**Replace Bootstrap containers and grid with semantic sections:**

```html
<!-- FROM Bootstrap -->
<section class="padding-small position-relative">
    <div class="container-fluid padding-side">
        <div class="row">
            <div class="col-lg-6">Content</div>
            <div class="col-lg-6">Content</div>
        </div>
    </div>
</section>

<!-- TO Standardized -->
<section class="[page-name]-hero"> <!-- or appropriate section name -->
    <div class="site-container">
        <div class="hero-layout"> <!-- or appropriate layout class -->
            <div class="hero-content">Content</div>
            <div class="hero-image">Content</div> <!-- if needed -->
        </div>
    </div>
</section>
```

### Step 3: Side Navigation
**Replace Bootstrap navbar-side with standardized side nav:**

```html
<!-- FROM Bootstrap -->
<nav id="side-nav" class="navbar-side p-3 p-lg-4 me-lg-5" data-bs-theme="dark">
    <ul class="navbar-nav">
        <li class="nav-item">
            <a class="nav-link active" href="about.html">Icon</a>
        </li>
    </ul>
</nav>

<!-- TO Standardized -->
<nav id="side-nav" class="side-navigation">
    <ul class="nav-menu">
        <li>
            <a href="about.html" class="nav-link active">Icon</a>
        </li>
    </ul>
</nav>
```

### Step 4: Remove Bootstrap Dependencies
- [ ] Remove `data-bs-*` attributes
- [ ] Remove Bootstrap utility classes (`d-*`, `justify-*`, `align-*`, `mt-*`, `mb-*`, etc.)
- [ ] Remove Bootstrap component classes (`btn`, `form-control`, `nav-pills`, etc.)
- [ ] Remove `data-aos` animation attributes (if present)

### Step 5: Apply Page-Specific Classes
Use semantic, descriptive class names for each page type:

**Contact Page Classes:**
- `contact-hero`, `contact-form-section`, `contact-info`
- `form-wrapper`, `form-group`, `form-input`, `form-textarea`
- `contact-details`, `contact-item`, `contact-icon`, `contact-text`

**Service Page Classes:**
- `services-hero`, `services-grid`, `service-card`
- `service-icon`, `service-title`, `service-description`
- `process-section`, `process-steps`, `process-step`

**Portfolio Page Classes:**
- `portfolio-hero`, `portfolio-filter`, `portfolio-gallery`
- `filter-controls`, `filter-button`
- `portfolio-grid`, `portfolio-item`, `portfolio-image`, `portfolio-overlay`

**Blog Page Classes:**
- `blog-hero`, `blog-grid`, `article-grid`
- `article-card`, `article-image`, `article-content`
- `article-title`, `article-excerpt`, `article-meta`

---

## Quick Reference: Class Mapping

### Container & Layout
| Bootstrap Class | Standard Class |
|-----------------|----------------|
| `container-fluid padding-side` | `site-container` |
| `row` | Remove (use semantic layout) |
| `col-lg-6` | Use layout classes like `hero-layout`, `two-col-layout` |
| `d-flex` | Remove (handle with CSS) |
| `justify-content-center` | Remove (handle with CSS) |
| `align-items-center` | Remove (handle with CSS) |

### Navigation
| Bootstrap Class | Standard Class |
|-----------------|----------------|
| `navbar navbar-expand-lg` | `header-nav` |
| `navbar-brand` | `logo` |
| `navbar-toggler` | `mobile-menu-toggle` |
| `offcanvas offcanvas-end` | `mobile-menu` |
| `navbar-side` | `side-navigation` |
| `navbar-nav` | `nav-menu` |

### Components
| Bootstrap Class | Standard Class |
|-----------------|----------------|
| `btn button` | `action-button` |
| `btn-secondary` | `secondary-button` |
| `nav-link` (for buttons) | `link-button` |
| `form-control` | `form-input` |
| `nav nav-pills` | `content-tabs` |
| `nav-link` (for tabs) | `tab-trigger` |
| `tab-pane` | `tab-content` |

### Utility Classes
| Bootstrap Class | Standard Class |
|-----------------|----------------|
| `text-center` | Remove (handle with CSS) |
| `text-white` | Remove (handle with CSS) |
| `text-highlight` | Keep (already custom) |
| `mt-4`, `mb-3`, etc. | Remove (handle with CSS) |
| `position-relative` | Remove (handle with CSS) |
| `d-lg-none` | Use `mobile-only` |

---

## File-Specific Notes

### contact.html
- Focus on form standardization
- Replace Bootstrap form classes with semantic form structure
- Ensure contact information is properly structured

### service.html  
- Service cards should use consistent card component structure
- Process/workflow sections need semantic naming
- Call-to-action buttons should use `action-button` class

### portfolio.html
- Gallery/masonry layouts need custom grid classes
- Filter buttons should use `filter-button` class
- Project items need consistent `portfolio-item` structure

### blog.html
- Article cards need semantic structure
- Pagination components (if present) need custom classes
- Category filtering should follow portfolio filter pattern

---

## Quality Checklist

After each file migration, verify:

### ✅ Structure
- [ ] Clean semantic HTML structure
- [ ] Consistent class naming convention
- [ ] No Bootstrap classes remaining
- [ ] Proper heading hierarchy (h1, h2, h3)

### ✅ Navigation
- [ ] Header navigation matches index.html structure
- [ ] Side navigation matches index.html structure
- [ ] Active states properly set for current page
- [ ] Social links properly structured

### ✅ Content
- [ ] Page-specific semantic section names
- [ ] Proper use of layout classes (`hero-layout`, `two-col-layout`, etc.)
- [ ] Descriptive class names for content components
- [ ] Consistent component structure (cards, buttons, forms)

### ✅ Cleanup
- [ ] No unused `data-bs-*` attributes
- [ ] No Bootstrap utility classes
- [ ] No AOS animation attributes
- [ ] Removed any unused pattern/decoration divs

### ✅ Accessibility
- [ ] Proper ARIA labels on buttons
- [ ] Alt text on images
- [ ] Semantic HTML structure maintained
- [ ] Focus states will work with CSS

---

This checklist provides a systematic approach to migrate all remaining HTML files while maintaining consistency with the established clean structure from index.html and about.html.