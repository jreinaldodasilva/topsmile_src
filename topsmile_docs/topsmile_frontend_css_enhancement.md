# TopSmile CSS Improvements - Enhanced Design System

## Overview

Based on my analysis of the current CSS implementation, I've identified key areas for improvement that will create a more cohesive, accessible, and modern design system. The current code shows good practices but lacks consistency and advanced UX patterns.

## Current State Assessment

**✅ Strengths:**
- Modern CSS features (Grid, Flexbox, custom properties)
- Good component-level organization
- Responsive design considerations
- Some accessibility features

**❌ Areas for Improvement:**
- Minimal design token system
- Inconsistent color usage across components
- Limited accessibility features
- Basic animation and interaction patterns
- No dark mode support
- Inconsistent spacing and typography

---

## 1. Enhanced Design System Foundation

### Improved Variables.css

```css
/* Enhanced Design Tokens - Replace current variables.css */
:root {
  /* Color System */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9; /* Main brand */
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-800: #075985;
  --color-primary-900: #0c4a6e;

  /* Semantic Colors */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-700: #15803d;
  
  --color-warning-50: #fefce8;
  --color-warning-500: #eab308;
  --color-warning-700: #a16207;
  
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-700: #b91c1c;
  
  --color-info-50: #eff6ff;
  --color-info-500: #3b82f6;
  --color-info-700: #1d4ed8;

  /* Neutral Colors */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Legacy color mappings for backward compatibility */
  --color-primary: var(--color-primary-500);
  --color-secondary: var(--color-neutral-100);
  --color-dark: var(--color-neutral-800);
  --color-light: var(--color-neutral-0);
  --color-text: var(--color-neutral-600);

  /* Typography Scale */
  --font-family-sans: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif;
  --font-family-display: 'Cal Sans', 'Inter', var(--font-family-sans);
  --font-family-mono: 'SF Mono', 'Monaco', 'Consolas', monospace;

  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* Spacing Scale (8px base unit) */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */

  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-base: 0.375rem; /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-base: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Z-Index Scale */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;

  /* Layout */
  --container-max-width: 1400px;
  --container-padding: var(--space-4);
  --header-height: 4rem;
  --sidebar-width: 16rem;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* Form Elements */
  --input-height-sm: 2rem;
  --input-height-base: 2.5rem;
  --input-height-lg: 3rem;
  --input-padding-x: var(--space-3);
  --input-padding-y: var(--space-2);

  /* Button Heights */
  --btn-height-sm: 2rem;
  --btn-height-base: 2.5rem;
  --btn-height-lg: 3rem;
  --btn-padding-x-sm: var(--space-3);
  --btn-padding-x-base: var(--space-4);
  --btn-padding-x-lg: var(--space-6);

  /* Breakpoints for CSS */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-0: #0f172a;
    --color-neutral-50: #1e293b;
    --color-neutral-100: #334155;
    --color-neutral-200: #475569;
    --color-neutral-300: #64748b;
    --color-neutral-400: #94a3b8;
    --color-neutral-500: #cbd5e1;
    --color-neutral-600: #e2e8f0;
    --color-neutral-700: #f1f5f9;
    --color-neutral-800: #f8fafc;
    --color-neutral-900: #ffffff;
    
    --color-light: var(--color-neutral-50);
    --color-text: var(--color-neutral-300);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --color-text: var(--color-neutral-900);
    --shadow-base: 0 0 0 1px var(--color-neutral-900);
    --shadow-md: 0 0 0 2px var(--color-neutral-900);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0s;
    --transition-base: 0s;
    --transition-slow: 0s;
  }
}
```

---

## 2. Enhanced Global Styles

### Improved global.css

```css
/* Enhanced Global Styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import './variables.css';

/* Modern CSS Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Remove default margins and improve text rendering */
body,
h1, h2, h3, h4, h5, h6,
p, figure, blockquote, dl, dd {
  margin: 0;
}

/* Remove list styles on ul, ol elements with a list role */
ul[role='list'],
ol[role='list'] {
  list-style: none;
  padding: 0;
}

/* Set core body defaults */
body {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  background-color: var(--color-light);
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'cv11', 'ss01';
  font-variation-settings: 'opsz' 32;
  min-height: 100vh;
}

/* Improve media defaults */
img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Inherit fonts for inputs and buttons */
input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

/* Remove default button styles */
button {
  background: none;
  border: none;
  cursor: pointer;
}

/* Better link defaults */
a {
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover,
a:focus-visible {
  color: var(--color-primary-700);
  text-decoration: underline;
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Remove outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-neutral-900);
}

h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
}

h2 {
  font-size: var(--font-size-3xl);
}

h3 {
  font-size: var(--font-size-2xl);
}

h4 {
  font-size: var(--font-size-xl);
}

h5 {
  font-size: var(--font-size-lg);
}

h6 {
  font-size: var(--font-size-base);
}

/* Improved text elements */
p {
  line-height: var(--line-height-relaxed);
  color: var(--color-neutral-700);
}

small {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

strong {
  font-weight: var(--font-weight-semibold);
}

em {
  font-style: italic;
}

code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background-color: var(--color-neutral-100);
  padding: 0.125em 0.25em;
  border-radius: var(--radius-sm);
}

/* Container utility */
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* Utility classes for common patterns */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.loading {
  cursor: progress;
}

.disabled {
  pointer-events: none;
  opacity: 0.6;
}

/* Smooth scrolling for reduced motion users */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}

/* High contrast improvements */
@media (prefers-contrast: high) {
  body {
    background-color: var(--color-neutral-0);
    color: var(--color-neutral-900);
  }
  
  a {
    text-decoration: underline;
  }
  
  button,
  input,
  select,
  textarea {
    border: 2px solid var(--color-neutral-900);
  }
}

/* Print styles */
@media print {
  *,
  *::before,
  *::after {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  a,
  a:visited {
    text-decoration: underline;
  }
  
  abbr[title]::after {
    content: " (" attr(title) ")";
  }
  
  pre {
    white-space: pre-wrap !important;
  }
  
  pre,
  blockquote {
    border: 1px solid #999;
    page-break-inside: avoid;
  }
  
  thead {
    display: table-header-group;
  }
  
  tr,
  img {
    page-break-inside: avoid;
  }
  
  p,
  h2,
  h3 {
    orphans: 3;
    widows: 3;
  }
  
  h2,
  h3 {
    page-break-after: avoid;
  }
}
```

---

## 3. Enhanced Component System

### Universal Button System

```css
/* Enhanced Button System - Replace/enhance button styles across all components */
.btn {
  /* Base button styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  
  /* Default size */
  height: var(--btn-height-base);
  padding: 0 var(--btn-padding-x-base);
  min-width: var(--btn-height-base);
}

/* Button variants */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  color: var(--color-neutral-0);
  border-color: var(--color-primary-600);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-600));
  border-color: var(--color-primary-700);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: var(--color-neutral-0);
  color: var(--color-neutral-700);
  border-color: var(--color-neutral-300);
  box-shadow: var(--shadow-xs);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-400);
  color: var(--color-neutral-800);
  box-shadow: var(--shadow-sm);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary-600);
  border-color: var(--color-primary-300);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
  color: var(--color-primary-700);
}

.btn-ghost {
  background: transparent;
  color: var(--color-neutral-600);
  border-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-neutral-100);
  color: var(--color-neutral-800);
}

.btn-destructive {
  background: var(--color-error-500);
  color: var(--color-neutral-0);
  border-color: var(--color-error-500);
}

.btn-destructive:hover:not(:disabled) {
  background: var(--color-error-600);
  border-color: var(--color-error-600);
}

/* Button sizes */
.btn-sm {
  height: var(--btn-height-sm);
  padding: 0 var(--btn-padding-x-sm);
  font-size: var(--font-size-xs);
  min-width: var(--btn-height-sm);
}

.btn-lg {
  height: var(--btn-height-lg);
  padding: 0 var(--btn-padding-x-lg);
  font-size: var(--font-size-base);
  min-width: var(--btn-height-lg);
}

/* Button states */
.btn:disabled,
.btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Loading state */
.btn-loading {
  cursor: wait;
  opacity: 0.8;
}

.btn-loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  border-radius: inherit;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: btn-spin 1s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Icon buttons */
.btn-icon {
  padding: 0;
  aspect-ratio: 1;
}

.btn-icon svg {
  width: 1.25em;
  height: 1.25em;
}

/* Button groups */
.btn-group {
  display: inline-flex;
  isolation: isolate;
}

.btn-group .btn {
  border-radius: 0;
  position: relative;
}

.btn-group .btn:first-child {
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.btn-group .btn:last-child {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.btn-group .btn:only-child {
  border-radius: var(--radius-md);
}

.btn-group .btn:not(:first-child) {
  margin-left: -1px;
}

.btn-group .btn:hover,
.btn-group .btn:focus {
  z-index: 1;
}
```

### Enhanced Form System

```css
/* Enhanced Form Controls */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  line-height: var(--line-height-snug);
}

.form-label--required::after {
  content: ' *';
  color: var(--color-error-500);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  height: var(--input-height-base);
  padding: var(--input-padding-y) var(--input-padding-x);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  
  background-color: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-textarea {
  height: auto;
  min-height: calc(var(--input-height-base) * 2);
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Input states */
.form-input--error,
.form-textarea--error,
.form-select--error {
  border-color: var(--color-error-500);
  background-color: var(--color-error-50);
}

.form-input--error:focus,
.form-textarea--error:focus,
.form-select--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  background-color: var(--color-neutral-50);
  border-color: var(--color-neutral-200);
  color: var(--color-neutral-400);
  cursor: not-allowed;
}

/* Form help text and errors */
.form-help {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
  line-height: var(--line-height-relaxed);
}

.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error-600);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-error::before {
  content: '⚠';
  flex-shrink: 0;
}

/* Input sizes */
.form-input--sm,
.form-select--sm {
  height: var(--input-height-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
}

.form-input--lg,
.form-select--lg {
  height: var(--input-height-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-lg);
}

/* Floating label pattern */
.form-floating {
  position: relative;
}

.form-floating .form-input {
  padding-top: 1.625rem;
  padding-bottom: 0.625rem;
}

.form-floating .form-label {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  padding: var(--input-padding-y) var(--input-padding-x);
  pointer-events: none;
  border: 1px solid transparent;
  transform-origin: 0 0;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.form-floating .form-input:focus ~ .form-label,
.form-floating .form-input:not(:placeholder-shown) ~ .form-label {
  opacity: 0.65;
  transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
}
```

### Enhanced Card System

```css
/* Modern Card Component */
.card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-neutral-100);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0;
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: var(--space-1) 0 0;
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-100);
  background: var(--color-neutral-50);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Card variants */
.card--elevated {
  box-shadow: var(--shadow-lg);
  border: none;
}

.card--bordered {
  border: 2px solid var(--color-neutral-200);
  box-shadow: none;
}

.card--flat {
  box-shadow: none;
  border: none;
  background: transparent;
}
```

---

## 4. Loading States & Animations

```css
/* Enhanced Loading States */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-base);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 1em;
  margin: 0.5em 0;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-button {
  height: 2.5rem;
  width: 80px;
}

/* Spinner variants */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-neutral-200);
  border-top: 2px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner--lg {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Pulse animation */
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Fade in animation */
.fade-in {
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in animations */
.slide-in-left {
  animation: slide-in-left 0.3s ease-out;
}

@keyframes slide-in-left {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

@keyframes slide-in-right {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 5. Enhanced Modal System

```css
/* Modern Modal System */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: modal-overlay-in 0.2s ease-out;
}

@keyframes modal-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--color-neutral-0);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 32rem;
  width: 100%;
  max-height: calc(100vh - var(--space-8));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-content-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid var(--color-neutral-200);
}

@keyframes modal-content-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-neutral-200);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0;
}

.modal-close {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-500);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.modal-close:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

/* Modal sizes */
.modal-content--sm {
  max-width: 24rem;
}

.modal-content--lg {
  max-width: 48rem;
}

.modal-content--xl {
  max-width: 64rem;
  width: 90vw;
}

.modal-content--fullscreen {
  max-width: none;
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  margin: 0;
}
```

---

## 6. Enhanced Notification System

```css
/* Modern Toast/Notification System */
.notification-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.notification {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  pointer-events: auto;
  animation: notification-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

@keyframes notification-in {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.notification::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-primary-500);
}

.notification--success::before {
  background: var(--color-success-500);
}

.notification--warning::before {
  background: var(--color-warning-500);
}

.notification--error::before {
  background: var(--color-error-500);
}

.notification-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--font-size-sm);
}

.notification--success .notification-icon {
  background: var(--color-success-100);
  color: var(--color-success-700);
}

.notification--warning .notification-icon {
  background: var(--color-warning-100);
  color: var(--color-warning-700);
}

.notification--error .notification-icon {
  background: var(--color-error-100);
  color: var(--color-error-700);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-1) 0;
}

.notification-message {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.notification-close {
  width: var(--space-5);
  height: var(--space-5);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.notification-close:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

/* Auto-dismiss progress bar */
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-neutral-200);
  overflow: hidden;
}

.notification-progress-bar {
  height: 100%;
  background: var(--color-primary-500);
  animation: progress-countdown linear;
  transform-origin: left;
}

.notification--success .notification-progress-bar {
  background: var(--color-success-500);
}

.notification--warning .notification-progress-bar {
  background: var(--color-warning-500);
}

.notification--error .notification-progress-bar {
  background: var(--color-error-500);
}

@keyframes progress-countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .notification-container {
    top: var(--space-2);
    right: var(--space-2);
    left: var(--space-2);
    max-width: none;
  }
}
```

---

## 7. Enhanced Table System

```css
/* Modern Table Component */
.table-wrapper {
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-size-sm);
}

.table thead {
  background: var(--color-neutral-50);
}

.table th {
  padding: var(--space-4) var(--space-6);
  text-align: left;
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  border-bottom: 1px solid var(--color-neutral-200);
  white-space: nowrap;
  position: relative;
}

.table th:first-child {
  padding-left: var(--space-6);
}

.table th:last-child {
  padding-right: var(--space-6);
}

.table td {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-neutral-100);
  vertical-align: top;
}

.table tbody tr {
  transition: background-color var(--transition-fast);
}

.table tbody tr:hover {
  background: var(--color-neutral-50);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Sortable table headers */
.table th[data-sortable] {
  cursor: pointer;
  user-select: none;
  padding-right: var(--space-8);
}

.table th[data-sortable]:hover {
  background: var(--color-neutral-100);
}

.table th[data-sortable]::after {
  content: '';
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid var(--color-neutral-400);
  opacity: 0.5;
}

.table th[data-sortable][data-sort="asc"]::after {
  border-bottom: 4px solid var(--color-primary-500);
  opacity: 1;
}

.table th[data-sortable][data-sort="desc"]::after {
  border-top: 4px solid var(--color-primary-500);
  border-bottom: none;
  opacity: 1;
}

/* Table with selection */
.table-checkbox {
  width: var(--space-12);
  text-align: center;
}

.table tbody tr[data-selected="true"] {
  background: var(--color-primary-50);
}

/* Responsive table */
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .table {
    min-width: 600px;
  }
  
  .table th,
  .table td {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-xs);
  }
}

/* Table pagination */
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: between;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

.table-pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.table-pagination-controls {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}
```

---

## 8. Responsive Utilities

```css
/* Enhanced Responsive System */
.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

.container-sm {
  max-width: 640px;
}

.container-md {
  max-width: 768px;
}

.container-lg {
  max-width: 1024px;
}

.container-xl {
  max-width: 1280px;
}

/* Grid system */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

.col-span-2 { grid-column: span 2 / span 2; }
.col-span-3 { grid-column: span 3 / span 3; }
.col-span-4 { grid-column: span 4 / span 4; }
.col-span-6 { grid-column: span 6 / span 6; }
.col-span-full { grid-column: 1 / -1; }

/* Responsive grid utilities */
@media (min-width: 640px) {
  .sm\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sm\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .sm\:col-span-2 { grid-column: span 2 / span 2; }
  .sm\:col-span-3 { grid-column: span 3 / span 3; }
  .sm\:col-span-4 { grid-column: span 4 / span 4; }
}

@media (min-width: 768px) {
  .md\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .md\:col-span-2 { grid-column: span 2 / span 2; }
  .md\:col-span-3 { grid-column: span 3 / span 3; }
  .md\:col-span-4 { grid-column: span 4 / span 4; }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lg\:col-span-2 { grid-column: span 2 / span 2; }
  .lg\:col-span-3 { grid-column: span 3 / span 3; }
  .lg\:col-span-4 { grid-column: span 4 / span 4; }
}

@media (min-width: 1280px) {
  .xl\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .xl\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .xl\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .xl\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .xl\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .xl\:col-span-2 { grid-column: span 2 / span 2; }
  .xl\:col-span-3 { grid-column: span 3 / span 3; }
  .xl\:col-span-4 { grid-column: span 4 / span 4; }
}

/* Flexbox utilities */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }
.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-initial { flex: 0 1 auto; }
.flex-none { flex: none; }

/* Spacing utilities */
.gap-0 { gap: 0; }
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-5 { gap: var(--space-5); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
.gap-10 { gap: var(--space-10); }
.gap-12 { gap: var(--space-12); }

/* Visibility utilities */
.hidden { display: none; }
.invisible { visibility: hidden; }
.visible { visibility: visible; }

/* Position utilities */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Show/hide at breakpoints */
.show { display: block; }
.hide { display: none; }

@media (max-width: 639px) {
  .hide-on-mobile { display: none; }
  .show-on-mobile { display: block; }
}

@media (min-width: 640px) and (max-width: 767px) {
  .hide-on-tablet { display: none; }
  .show-on-tablet { display: block; }
}

@media (min-width: 768px) {
  .hide-on-desktop { display: none; }
  .show-on-desktop { display: block; }
}

/* Text utilities */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-wrap { white-space: normal; }
.text-nowrap { white-space: nowrap; }
.text-break { word-break: break-word; }

/* Color utilities */
.text-primary { color: var(--color-primary-600); }
.text-secondary { color: var(--color-neutral-600); }
.text-success { color: var(--color-success-600); }
.text-warning { color: var(--color-warning-600); }
.text-error { color: var(--color-error-600); }
.text-muted { color: var(--color-neutral-500); }

.bg-primary { background-color: var(--color-primary-500); }
.bg-secondary { background-color: var(--color-neutral-100); }
.bg-success { background-color: var(--color-success-500); }
.bg-warning { background-color: var(--color-warning-500); }
.bg-error { background-color: var(--color-error-500); }
.bg-white { background-color: var(--color-neutral-0); }
.bg-gray-50 { background-color: var(--color-neutral-50); }
.bg-gray-100 { background-color: var(--color-neutral-100); }
```

---

## 9. Component-Specific Enhancements

### Enhanced Header Component

```css
/* Enhanced Header - Replace existing Header.css */
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  transition: box-shadow var(--transition-base);
}

.header--scrolled {
  box-shadow: var(--shadow-md);
}

.header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  position: relative;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.header-logo:hover {
  color: var(--color-primary-700);
}

.header-logo-img {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-base);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.header-nav-list {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  list-style: none;
  margin: 0;
  padding: 0;
}

.header-nav-link {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  text-decoration: none;
  border-radius: var(--radius-base);
  transition: all var(--transition-fast);
  position: relative;
}

.header-nav-link:hover,
.header-nav-link:focus-visible {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.header-nav-link--active {
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

.header-nav-link--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--color-primary-500);
  border-radius: 1px;
}

.header-cta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast);
  cursor: pointer;
}

.header-user:hover {
  background: var(--color-neutral-50);
}

.header-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-primary-700);
}

.header-user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.header-user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
  line-height: 1.2;
}

.header-user-role {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
  line-height: 1.2;
  text-transform: capitalize;
}

/* Mobile menu */
.header-mobile-toggle {
  display: none;
  width: var(--space-10);
  height: var(--space-10);
  border-radius: var(--radius-base);
  background: transparent;
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-600);
  transition: all var(--transition-fast);
}

.header-mobile-toggle:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-800);
}

.header-mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  display: none;
  animation: slide-down 0.2s ease-out;
}

.header-mobile-menu--open {
  display: block;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-mobile-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.header-mobile-nav .header-nav-link {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
}

.header-mobile-cta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.header-mobile-cta .btn {
  justify-content: center;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .header-nav,
  .header-cta {
    display: none;
  }
  
  .header-mobile-toggle {
    display: flex;
  }
  
  .header .container {
    justify-content: space-between;
  }
  
  .header-logo {
    font-size: var(--font-size-lg);
  }
}

/* Search integration */
.header-search {
  display: flex;
  align-items: center;
  max-width: 400px;
  flex: 1;
  margin: 0 var(--space-6);
}

.header-search-input {
  width: 100%;
  height: var(--space-10);
  padding: 0 var(--space-3) 0 var(--space-10);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  position: relative;
}

.header-search-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  background: var(--color-neutral-0);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.header-search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  width: var(--space-4);
  height: var(--space-4);
  color: var(--color-neutral-400);
  pointer-events: none;
}

/* Notification badge */
.header-notification {
  position: relative;
  width: var(--space-10);
  height: var(--space-10);
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-notification:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-800);
}

.header-notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: var(--color-error-500);
  color: var(--color-neutral-0);
  border-radius: 50%;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-neutral-0);
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom-color: var(--color-neutral-700);
  }
}
```

### Enhanced Dashboard Components

```css
/* Enhanced Dashboard - Additional improvements to existing Dashboard.css */

/* Dashboard layout improvements */
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-neutral-50);
}

.dashboard-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  width: var(--sidebar-width);
  height: calc(100vh - var(--header-height));
  background: var(--color-neutral-0);
  border-right: 1px solid var(--color-neutral-200);
  overflow-y: auto;
  z-index: var(--z-fixed);
  transition: transform var(--transition-base);
}

.dashboard-sidebar--hidden {
  transform: translateX(-100%);
}

.dashboard-main {
  margin-left: var(--sidebar-width);
  padding: var(--space-6);
  transition: margin-left var(--transition-base);
}

.dashboard-main--full-width {
  margin-left: 0;
}

/* Enhanced stat cards with better visual hierarchy */
.stat-card {
  background: var(--color-neutral-0);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid var(--color-neutral-200);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-base);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-200);
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: var(--space-4);
}

.stat-card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-100);
  color: var(--color-primary-600);
  margin-bottom: var(--space-3);
}

.stat-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.stat-card-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
  line-height: 1;
  margin: var(--space-2) 0;
}

.stat-card-change {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.stat-card-change--positive {
  color: var(--color-success-600);
}

.stat-card-change--negative {
  color: var(--color-error-600);
}

.stat-card-change--neutral {
  color: var(--color-neutral-500);
}

/* Enhanced chart containers */
.chart-container {
  background: var(--color-neutral-0);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid var(--color-neutral-200);
  box-shadow: var(--shadow-xs);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: var(--space-6);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: var(--space-2);
}

.chart-filter {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-xs);
  background: var(--color-neutral-0);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chart-filter:hover,
.chart-filter--active {
  background: var(--color-primary-500);
  color: var(--color-neutral-0);
  border-color: var(--color-primary-500);
}

/* Activity feed component */
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.activity-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
  transition: all var(--transition-fast);
}

.activity-item:hover {
  border-color: var(--color-primary-200);
  box-shadow: var(--shadow-sm);
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-primary-700);
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-1) 0;
  line-height: 1.4;
}

.activity-description {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  margin: 0;
  line-height: 1.4;
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
  margin-top: var(--space-1);
}

/* Quick actions panel */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.quick-action-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  text-align: center;
  transition: all var(--transition-base);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-200);
}

.quick-action-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-3);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-100);
  color: var(--color-primary-600);
}

.quick-action-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-2) 0;
}

.quick-action-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0;
  line-height: 1.4;
}

/* Responsive dashboard adjustments */
@media (max-width: 1024px) {
  .dashboard-sidebar {
    transform: translateX(-100%);
  }
  
  .dashboard-sidebar--open {
    transform: translateX(0);
  }
  
  .dashboard-main {
    margin-left: 0;
  }
  
  .dashboard-content {
    padding: var(--space-4);
  }
  
  .stats-overview {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .stats-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-content {
    padding: var(--space-3);
    gap: var(--space-4);
  }
  
  .stat-card {
    padding: var(--space-4);
  }
  
  .stat-card-value {
    font-size: var(--font-size-2xl);
  }
  
  .chart-container {
    padding: var(--space-4);
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 10. Implementation Guidelines

### Migration Strategy

1. **Phase 1: Foundation (Week 1)**
   ```css
   /* Start by updating these core files: */
   src/styles/variables.css    /* Replace entirely */
   src/styles/global.css       /* Replace entirely */
   ```

2. **Phase 2: Component Updates (Weeks 2-3)**
   ```css
   /* Update component CSS files in this order: */
   components/Header/Header.css           /* High impact */
   components/Admin/Dashboard/Dashboard.css /* High impact */
   components/Auth/LoginForm/LoginForm.css  /* Medium impact */
   components/ContactForm/ContactForm.css   /* Medium impact */
   ```

3. **Phase 3: Advanced Components (Week 4)**
   ```css
   /* Add new component systems: */
   components/UI/Button/Button.css        /* New component */
   components/UI/Form/Form.css           /* New component */
   components/UI/Card/Card.css           /* New component */
   components/UI/Modal/Modal.css         /* New component */
   components/UI/Table/Table.css         /* New component */
   ```

### CSS Architecture Best Practices

```css
/* File naming convention */
ComponentName.css           /* Component styles */
ComponentName.module.css    /* CSS Modules (if used) */
utils.css                  /* Utility classes */
animations.css             /* Animation definitions */
responsive.css             /* Responsive utilities */

/* Class naming convention (BEM methodology) */
.component-name             /* Block */
.component-name__element    /* Element */
.component-name--modifier   /* Modifier */
.component-name--state      /* State */

/* CSS custom property naming */
--component-property-name   /* Component-specific */
--color-semantic-shade     /* Design tokens */
--space-size              /* Spacing tokens */
--font-property-value     /* Typography tokens */
```

### Performance Optimization

```css
/* CSS optimization techniques */

/* 1. Efficient selectors */
.btn { /* Good: single class */ }
.sidebar .nav .item { /* Avoid: deep nesting */ }

/* 2. Hardware acceleration for animations */
.animated-element {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}

/* 3. Efficient transitions */
.element {
  transition: transform 0.2s ease; /* Specific property */
  /* Avoid: transition: all 0.2s ease; */
}

/* 4. CSS containment for performance */
.component {
  contain: layout style paint;
}

/* 5. Efficient custom properties */
:root {
  --shadow-color: 220 3% 15%;
  --shadow-strength: 1%;
}

.element {
  box-shadow: 
    0 1px 2px hsl(var(--shadow-color) / calc(var(--shadow-strength) + 9%));
}
```

### Browser Support Considerations

```css
/* Progressive enhancement */
.modern-feature {
  /* Fallback for older browsers */
  background: #blue;
  
  /* Modern browsers with support detection */
  background: var(--color-primary-500);
}

/* Feature queries for advanced CSS */
@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@supports not (display: grid) {
  .grid-container {
    display: flex;
    flex-wrap: wrap;
  }
}

/* Logical properties for internationalization */
.element {
  margin-inline-start: var(--space-4); /* Instead of margin-left */
  padding-block: var(--space-2);       /* Instead of padding-top/bottom */
  border-inline-end: 1px solid;       /* Instead of border-right */
}
```

---

## Summary & Next Steps

This enhanced CSS system provides:

1. **🎨 Comprehensive Design System**: Consistent colors, typography, spacing, and components
2. **📱 Mobile-First Responsive**: Optimized for all screen sizes
3. **♿ Accessibility**: WCAG compliance and screen reader support  
4. **⚡ Performance**: Optimized animations and efficient CSS
5. **🌙 Dark Mode**: Built-in dark mode support
6. **🎯 Component Library**: Reusable UI components
7. **🔧 Developer Experience**: Well-organized, maintainable code

### Immediate Implementation Priorities:

1. **Replace `variables.css`** with the enhanced design tokens
2. **Update `global.css`** with modern CSS reset and utilities
3. **Implement the button system** across all components
4. **Enhance form components** for better user experience
5. **Add loading states** and animations
6. **Implement the modal system** for better dialogs
7. **Add the notification system** for user feedback

This foundation will dramatically improve the visual consistency, user experience, and maintainability of the TopSmile application while providing a scalable system for future enhancements.