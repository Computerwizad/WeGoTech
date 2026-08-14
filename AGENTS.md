# WeGoTech — AI Coding Agent Guide

## Project Overview
WeGoTech is a modern marketing website for a tech company. It showcases services in AI, automation, smart systems, and data solutions through an engaging, animated single-page experience.

**Stack**: HTML5, vanilla CSS3, vanilla JavaScript (ES6+)  
**Theme**: Dark-mode tech aesthetic with cyan/violet accents  
**Fonts**: Space Grotesk (display), Inter (body), JetBrains Mono (code)  

## Architecture

### File Structure
- **index.html** — Single-page markup with hero, services, case studies, team, research, and contact sections
- **styles.css** — All styling (no preprocessor). Uses CSS custom properties (--bg, --cyan, etc.) for theming
- **script.js** — Interactive features: boot animation, nav scroll state, scroll-triggered reveals, micro-animations
- **README.md** — Project description

### Key Features & Patterns

#### 1. **Animations & Transitions**
- Boot sequence with staggered lines (1.7s delay)
- Scroll-triggered reveals using Intersection Observer (`reveal`, `reveal-stagger` classes)
- Word-by-word reveal for philosophy section
- Smooth scroll behavior (respects `prefers-reduced-motion`)
- Canvas-based hero background visualization

**When modifying**: Ensure animations reduce to instant for `prefers-reduced-motion: reduce`

#### 2. **Accessibility**
- ARIA attributes on decorative elements (`aria-hidden="true"`)
- Semantic HTML structure (header, nav, section)
- Color contrast meets WCAG standards
- Keyboard navigation support on all CTAs

**When modifying**: Maintain semantic HTML and ARIA labels

#### 3. **Responsive Design**
- Mobile breakpoint: `@media (max-width: 780px)`
- Fluid container: `.container { max-width: 1280px; padding: 0 32px; }`
- Padding adjusts on mobile: `padding: 0 20px`

#### 4. **JavaScript Conventions**
- IIFE pattern to avoid global scope pollution
- Uses modern APIs: `IntersectionObserver`, `matchMedia`, `requestAnimationFrame`
- Passive event listeners where appropriate
- Defers animations if `prefers-reduced-motion` is detected

#### 5. **CSS Architecture**
- Single stylesheet (no SCSS/preprocessor)
- CSS custom properties for consistent colors and spacing
- BEM-inspired class naming (`.hero-inner`, `.btn-primary`)
- Utility classes (`.container`, `.eyebrow`, `.btn`)

## Development Workflow

### Common Tasks
- **Styling**: Add to `styles.css` with mobile-first media queries
- **Interactions**: Add to script.js within the IIFE; use `addEventListener` with options
- **Content**: Update `index.html` and ensure ARIA labels for decorative elements
- **Testing**: Browser DevTools (check animations, responsive at 780px, accessibility tree)

### Design System
- **Colors**: Use CSS custom properties from `:root`
- **Spacing**: Multiples of 8px (padding, margins, gaps)
- **Border Radius**: `--radius: 3px` (minimal, clean aesthetic)
- **Easing**: `--ease: cubic-bezier(.16,.8,.24,1)` (custom ease for animations)

## Conventions & Best Practices

✓ **Do**:
- Preserve reduced-motion behavior in all new animations
- Use Intersection Observer for scroll-triggered reveals
- Add `aria-hidden="true"` to purely decorative elements
- Test responsive behavior at 780px breakpoint
- Keep CSS custom properties updated in `:root`

✗ **Avoid**:
- Adding external CSS frameworks (maintain vanilla styling)
- Importing new JavaScript libraries (use vanilla APIs)
- Hardcoding colors (use CSS variables instead)
- Ignoring accessibility (ARIA, semantic HTML, color contrast)
- Auto-playing media without user interaction

## Useful Commands
```bash
# No build step required — open index.html in browser
# For live reload during development, use VS Code Live Server extension
```

## Related Documentation
See [README.md](README.md) for project description.
