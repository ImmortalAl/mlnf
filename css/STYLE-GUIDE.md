# MLNF CSS Style Guide

## 🎨 Design System Overview

### **Brand Colors & Variables**
All styling MUST use CSS custom properties from `base-theme.css`:

```css
:root {
  /* Primary Palette */
  --primary: #0d0d1a;        /* Deep cosmic blue */
  --secondary: #1a1a33;      /* Lighter cosmic blue */
  --accent: #ff5e78;         /* Vibrant pink accent */
  --text: #f0e6ff;           /* Light purple text */
  --highlight: #2a4066;      /* Interactive elements */
  
  /* Status Colors */
  --success: #5cb85c;        /* Success states */
  --warning: #ffca28;        /* Warning states */
  --danger: #ff4444;         /* Error states */
  
  /* Gradients */
  --gradient-accent: linear-gradient(45deg, var(--accent), var(--warning));
  --gradient-secondary: linear-gradient(to bottom, var(--secondary), rgba(26, 26, 51, 0.9));
  
  /* Layout */
  --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
  --shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  --border-radius: 12px;
}
```

## 📏 Layout Standards

### **Container Patterns**
```css
/* Page container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Section spacing */
.section {
  padding: 2rem 0;
}

/* Card pattern */
.card {
  background: var(--secondary);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}
```

### **Grid System**
```css
/* Responsive grid */
.grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Profile cards grid */
.profiles-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  padding: 2rem 0;
}
```

## 🎯 Component Patterns

### **Button Hierarchy**
```css
/* Primary action button */
.btn-primary {
  background: var(--gradient-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

/* Secondary button */
.btn-secondary {
  background: transparent;
  color: var(--accent);
  border: 2px solid var(--accent);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
}

/* Outline button */
.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--highlight);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
}
```

### **Header Structure**
```css
/* Standard header layout */
header {
  background: var(--gradient-secondary);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Logo with title stack */
.logo .title-stack {
  display: flex;
  flex-direction: column;
}

.full-title {
  display: block;
}

.short-title {
  display: none;
}

/* Mobile responsive title */
@media (max-width: 768px) {
  .full-title { display: none; }
  .short-title { display: block; }
}
```

### **Modal Pattern**
```css
/* Modal overlay */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal content */
.modal-content {
  background: var(--secondary);
  border-radius: var(--border-radius);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
```

### **Sidebar Pattern**
```css
/* Sidebar base */
.sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--gradient-secondary);
  transition: var(--transition);
  z-index: 200;
}

.sidebar.active {
  right: 0;
}

/* Sidebar overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: var(--transition);
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}
```

## 📱 Responsive Design Rules

### **Breakpoint Strategy**
```css
/* Mobile First Approach */

/* Base styles (mobile) */
.component {
  /* Mobile styles here */
}

/* Tablet */
@media (min-width: 768px) {
  .component {
    /* Tablet adjustments */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    /* Desktop enhancements */
  }
}

/* Large screens */
@media (min-width: 1440px) {
  .component {
    /* Large screen optimizations */
  }
}
```

### **Mobile Navigation Pattern**
```css
/* Hide desktop nav on mobile */
@media (max-width: 767px) {
  .main-nav {
    display: none;
  }
  
  .mobile-nav-toggle {
    display: block;
  }
}

/* Hide mobile nav on desktop */
@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
  
  .mobile-nav-toggle {
    display: none;
  }
}
```

## ✨ Animation & Interaction Standards

### **Transition Timing**
```css
/* Standard transitions */
.interactive-element {
  transition: var(--transition); /* 0.4s cubic-bezier */
}

/* Quick interactions */
.button, .link {
  transition: all 0.2s ease;
}

/* Slow reveals */
.modal, .sidebar {
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1);
}
```

### **Hover States**
```css
/* Button hover pattern */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
}

/* Card hover pattern */
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

## 🔧 Utility Classes

### **Spacing Utilities**
```css
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
.p-3 { padding: 1.5rem; }
.p-4 { padding: 2rem; }
```

### **Text Utilities**
```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.text-primary { color: var(--primary); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }
```

### **Display Utilities**
```css
.hidden { display: none; }
.visible { display: block; }
.flex { display: flex; }
.grid { display: grid; }

.justify-center { justify-content: center; }
.align-center { align-items: center; }
.space-between { justify-content: space-between; }
```

## 🚫 Anti-Patterns (What NOT to Do)

### **❌ Avoid These Practices**
```css
/* DON'T use hardcoded colors */
.bad-example {
  background: #0d0d1a; /* Use var(--primary) instead */
  color: #ff5e78;      /* Use var(--accent) instead */
}

/* DON'T use !important unless absolutely necessary */
.bad-example {
  color: red !important; /* Find a better selector instead */
}

/* DON'T use inline styles */
<div style="color: red;"> <!-- Use CSS classes instead -->

/* DON'T use non-semantic class names */
.red-text { } /* Use .error-text or .danger-text instead */
.big-box { }  /* Use .hero-section or .feature-card instead */
```

### **✅ Best Practices**
```css
/* DO use semantic class names */
.error-message { color: var(--danger); }
.success-notification { color: var(--success); }
.hero-section { padding: 4rem 0; }

/* DO use CSS variables */
.component {
  background: var(--secondary);
  color: var(--text);
  border-radius: var(--border-radius);
}

/* DO use consistent spacing */
.section { padding: 2rem 0; }
.card { padding: 1.5rem; }
.button { padding: 0.75rem 1.5rem; }
```

---

## 📋 CSS Checklist for New Components

- [ ] Uses CSS variables from `base-theme.css`
- [ ] Follows mobile-first responsive design
- [ ] Includes hover/focus states
- [ ] Uses semantic class names
- [ ] Follows established spacing patterns
- [ ] Includes proper transitions
- [ ] Works across all breakpoints
- [ ] Follows accessibility guidelines

---
*Last updated: Phase 2 Complete*
*Next: Phase 3 - Preventative Measures* 