# 🎨 CMS SaaS - UI/UX SPECIFICATION
## Complete Design System & Component Guide para Developer

---

## 📋 1. DESIGN SYSTEM - FILOSOFIA

### Brand Identity
```
Nome: CMS SaaS Brasil
Tagline: "Gerenciador de conteúdo headless moderno para agências e PMEs"
Público: Profissionais tech 25-45 anos, Brasil
Tom: Moderno, profissional, acessível
```

### Paleta de Cores

#### Cores Principais
```
Primary Blue:    #0066CC (botões, links, CTAs)
Secondary Gray:  #6B7280 (backgrounds secundários)
Success Green:   #10B981 (validação, sucesso)
Warning Orange:  #F59E0B (alertas, avisos)
Error Red:       #EF4444 (erros, deletar)
White:           #FFFFFF (backgrounds principais)
Dark Gray:       #1F2937 (textos principais)
Light Gray:      #F3F4F6 (backgrounds cards)
```

#### Paleta Estendida (Data Viz)
```
Purple:   #8B5CF6 (variação)
Pink:     #EC4899 (variação)
Cyan:     #06B6D4 (variação)
Lime:     #84CC16 (variação)
```

#### CSS Variables
```css
:root {
  /* Primary Colors */
  --color-primary: #0066CC;
  --color-primary-dark: #0052A3;
  --color-primary-darker: #003D7A;
  
  /* Neutrals */
  --color-white: #FFFFFF;
  --color-dark-gray: #1F2937;
  --color-secondary-gray: #6B7280;
  --color-light-gray: #F3F4F6;
  --color-border: #E5E7EB;
  --color-placeholder: #9CA3AF;
  
  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Data Viz */
  --color-purple: #8B5CF6;
  --color-pink: #EC4899;
  --color-cyan: #06B6D4;
  --color-lime: #84CC16;
}
```

### Tipografia

#### Fontes
```
Heading Font:   Inter Bold (sans-serif, moderna)
Body Font:      Inter Regular (sans-serif, legível)
Mono Font:      JetBrains Mono (código, API keys)

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

#### Tamanhos (8px base)
```css
:root {
  /* Headings */
  --font-h1-size: 32px;
  --font-h1-weight: 700;
  --font-h1-line-height: 40px;
  
  --font-h2-size: 24px;
  --font-h2-weight: 700;
  --font-h2-line-height: 32px;
  
  --font-h3-size: 18px;
  --font-h3-weight: 600;
  --font-h3-line-height: 28px;
  
  --font-h4-size: 16px;
  --font-h4-weight: 600;
  --font-h4-line-height: 24px;
  
  /* Body */
  --font-body-size: 14px;
  --font-body-weight: 400;
  --font-body-line-height: 22px;
  
  --font-small-size: 12px;
  --font-small-weight: 400;
  --font-small-line-height: 18px;
  
  /* Mono */
  --font-mono-size: 13px;
  --font-mono-line-height: 20px;
}

h1 { font: var(--font-h1-weight) var(--font-h1-size)/var(--font-h1-line-height) 'Inter', sans-serif; }
h2 { font: var(--font-h2-weight) var(--font-h2-size)/var(--font-h2-line-height) 'Inter', sans-serif; }
h3 { font: var(--font-h3-weight) var(--font-h3-size)/var(--font-h3-line-height) 'Inter', sans-serif; }
h4 { font: var(--font-h4-weight) var(--font-h4-size)/var(--font-h4-line-height) 'Inter', sans-serif; }
p, body { font: var(--font-body-weight) var(--font-body-size)/var(--font-body-line-height) 'Inter', sans-serif; }
small { font-size: var(--font-small-size); line-height: var(--font-small-line-height); }
code, pre { font-family: 'JetBrains Mono', monospace; font-size: var(--font-mono-size); }
```

### Espaçamento (8px grid)
```css
:root {
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

### Border Radius
```css
:root {
  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 12px;
  --radius-round: 9999px;
}
```

### Sombras
```css
:root {
  --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-small: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-large: 0 20px 25px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 10px 20px rgba(0, 0, 0, 0.12);
}

box-shadow: var(--shadow-subtle);
```

### Ícones
```
Biblioteca: Heroicons (https://heroicons.com) ou Feather Icons
Tamanho padrão: 20x20px
Tamanho grande: 24x24px
Tamanho pequeno: 16x16px
Cor: Herdada do texto (#1F2937 padrão)

SVG Inline:
<svg class="icon icon-20" viewBox="0 0 24 24">...</svg>

CSS:
.icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
  stroke: currentColor;
  fill: none;
}
.icon-24 { width: 24px; height: 24px; }
.icon-16 { width: 16px; height: 16px; }
```

---

## 🏗️ 2. COMPONENTES PRINCIPAIS

### Button Component

#### CSS Specifications
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-s);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 150ms ease-in-out;
  font-size: var(--font-body-size);
  line-height: var(--font-body-line-height);
}

/* Sizes */
.btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
}
.btn-md {
  height: 40px;
  padding: 0 16px;
}
.btn-lg {
  height: 48px;
  padding: 0 20px;
}
.btn-full {
  width: 100%;
}

/* Primary */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}
.btn-primary:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-small);
}
.btn-primary:active {
  background-color: var(--color-primary-darker);
  box-shadow: none;
}
.btn-primary:disabled {
  background-color: var(--color-border);
  color: var(--color-placeholder);
  cursor: not-allowed;
}

/* Secondary */
.btn-secondary {
  background-color: var(--color-light-gray);
  color: var(--color-dark-gray);
}
.btn-secondary:hover {
  background-color: #E5E7EB;
  box-shadow: var(--shadow-small);
}

/* Outline */
.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-outline:hover {
  background-color: rgba(0, 102, 204, 0.05);
}

/* Ghost */
.btn-ghost {
  background-color: transparent;
  color: var(--color-dark-gray);
}
.btn-ghost:hover {
  background-color: var(--color-light-gray);
}

/* Danger */
.btn-danger {
  background-color: var(--color-error);
  color: var(--color-white);
}
.btn-danger:hover {
  background-color: #DC2626;
  box-shadow: var(--shadow-small);
}

/* Success */
.btn-success {
  background-color: var(--color-success);
  color: var(--color-white);
}
.btn-success:hover {
  background-color: #059669;
  box-shadow: var(--shadow-small);
}

/* Loading state */
.btn:disabled,
.btn.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* With icon */
.btn .icon {
  width: 20px;
  height: 20px;
}
```

#### HTML Examples
```html
<!-- Primary Button -->
<button class="btn btn-primary btn-md">
  Save Changes
</button>

<!-- Button with Icon -->
<button class="btn btn-primary btn-md">
  <svg class="icon" viewBox="0 0 24 24"><path d="..."/></svg>
  Create New
</button>

<!-- Loading State -->
<button class="btn btn-primary btn-md loading">
  <span class="spinner"></span>
  Loading...
</button>

<!-- Danger Button -->
<button class="btn btn-danger btn-md">
  Delete Entry
</button>

<!-- Full Width -->
<button class="btn btn-primary btn-md btn-full">
  Publish to Web
</button>
```

### Input Field Component

#### CSS Specifications
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
  margin-bottom: var(--spacing-l);
}

label {
  font-size: var(--font-small-size);
  font-weight: 600;
  color: var(--color-dark-gray);
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
textarea,
select {
  font-size: var(--font-body-size);
  line-height: var(--font-body-line-height);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 12px;
  font-family: inherit;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
textarea,
select {
  background-color: var(--color-white);
  color: var(--color-dark-gray);
}

input::placeholder,
textarea::placeholder {
  color: var(--color-placeholder);
}

/* Focus State */
input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="search"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Error State */
input.error,
textarea.error,
select.error {
  border-color: var(--color-error);
  background-color: rgba(239, 68, 68, 0.02);
}

input.error:focus,
textarea.error:focus,
select.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Success State */
input.success,
textarea.success,
select.success {
  border-color: var(--color-success);
}

/* Disabled State */
input:disabled,
textarea:disabled,
select:disabled {
  background-color: var(--color-light-gray);
  color: var(--color-placeholder);
  cursor: not-allowed;
}

/* Helper Text */
.form-helper {
  font-size: var(--font-small-size);
  color: var(--color-secondary-gray);
}

/* Error Message */
.form-error {
  font-size: var(--font-small-size);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-s);
}

/* Textarea */
textarea {
  min-height: 100px;
  max-height: 400px;
  resize: vertical;
}

/* Character Count */
.form-char-count {
  font-size: var(--font-small-size);
  color: var(--color-placeholder);
  text-align: right;
}
```

#### HTML Examples
```html
<!-- Basic Text Input -->
<div class="form-group">
  <label for="title">Title</label>
  <input type="text" id="title" placeholder="Enter title" />
  <span class="form-helper">Used in content form</span>
</div>

<!-- Email Input -->
<div class="form-group">
  <label for="email">Email Address</label>
  <input type="email" id="email" placeholder="name@example.com" />
</div>

<!-- With Error -->
<div class="form-group">
  <label for="password">Password</label>
  <input type="password" id="password" class="error" />
  <span class="form-error">
    <svg class="icon icon-16"><!-- error icon --></svg>
    Password must be at least 8 characters
  </span>
</div>

<!-- Textarea -->
<div class="form-group">
  <label for="description">Description</label>
  <textarea id="description" placeholder="Enter description"></textarea>
  <span class="form-char-count">0/500</span>
</div>

<!-- With Success -->
<div class="form-group">
  <label for="username">Username</label>
  <input type="text" id="username" class="success" value="johndoe" />
  <span style="color: var(--color-success);">✓ Username available</span>
</div>
```

### Card Component

#### CSS Specifications
```css
.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-subtle);
  overflow: hidden;
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card.interactive:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
  cursor: pointer;
}

/* Card Parts */
.card-header {
  padding: var(--spacing-l);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: var(--font-h4-size);
}

.card-body {
  padding: var(--spacing-l);
}

.card-footer {
  padding: var(--spacing-l);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-light-gray);
  display: flex;
  gap: var(--spacing-m);
  justify-content: flex-end;
}

.card.no-padding {
  padding: 0;
}
```

#### HTML Examples
```html
<!-- Simple Card -->
<div class="card">
  <div class="card-body">
    <h3 style="margin-top: 0;">Card Title</h3>
    <p>Card content goes here.</p>
  </div>
</div>

<!-- Card with Header & Footer -->
<div class="card">
  <div class="card-header">
    <h3>Blog Post</h3>
    <button class="btn-ghost">⋮</button>
  </div>
  <div class="card-body">
    <p>Article content preview...</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-secondary btn-sm">Edit</button>
    <button class="btn btn-primary btn-sm">Publish</button>
  </div>
</div>

<!-- Interactive Card -->
<div class="card interactive">
  <div class="card-body">
    <h4 style="margin-top: 0;">Click me</h4>
    <p>Hover to see effect</p>
  </div>
</div>
```

### Modal Component

#### CSS Specifications
```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;
}

.modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

/* Modal Container */
.modal {
  background-color: var(--color-white);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-large);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  opacity: 0;
  transition: transform 200ms ease, opacity 200ms ease;
  z-index: 1001;
}

.modal-overlay.active .modal {
  transform: scale(1);
  opacity: 1;
}

/* Sizes */
.modal-sm { width: 400px; }
.modal-md { width: 600px; }
.modal-lg { width: 800px; }
.modal-full { width: 90vw; max-width: 90vw; }

/* Responsive */
@media (max-width: 768px) {
  .modal { width: 90vw; }
}

/* Modal Parts */
.modal-header {
  padding: var(--spacing-l);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-h2-size);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-secondary-gray);
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-body {
  padding: var(--spacing-l);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--spacing-l);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-light-gray);
  display: flex;
  gap: var(--spacing-m);
  justify-content: flex-end;
}
```

#### HTML Examples
```html
<!-- Modal Structure -->
<div class="modal-overlay" id="myModal">
  <div class="modal modal-md">
    <div class="modal-header">
      <h2>Confirm Action</h2>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this entry? This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger">Delete</button>
    </div>
  </div>
</div>

<!-- JavaScript -->
<script>
function openModal() {
  document.getElementById('myModal').classList.add('active');
}
function closeModal() {
  document.getElementById('myModal').classList.remove('active');
}
</script>
```

### Toast Notification Component

#### CSS Specifications
```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  pointer-events: none;
}

.toast {
  background-color: var(--color-white);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-large);
  padding: var(--spacing-l);
  min-width: 300px;
  max-width: 400px;
  display: flex;
  gap: var(--spacing-m);
  align-items: flex-start;
  animation: slideInRight 200ms ease;
  pointer-events: auto;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Toast Types */
.toast.success {
  border-left: 4px solid var(--color-success);
}

.toast.error {
  border-left: 4px solid var(--color-error);
}

.toast.warning {
  border-left: 4px solid var(--color-warning);
}

.toast.info {
  border-left: 4px solid var(--color-info);
}

.toast-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-message {
  font-size: var(--font-body-size);
  color: var(--color-dark-gray);
  margin: 0;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-placeholder);
  padding: 0;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* Auto-hide */
.toast.hiding {
  animation: slideOutRight 200ms ease forwards;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
```

#### HTML Examples
```html
<!-- Toast Container -->
<div class="toast-container" id="toastContainer"></div>

<!-- Success Toast -->
<div class="toast success">
  <svg class="toast-icon" viewBox="0 0 24 24">
    <path d="M9 16.2L4.8 12m-4.6 0a6 6 0 1 1 8.5 8.5" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>
  <div class="toast-content">
    <p class="toast-message">Entry published successfully</p>
  </div>
  <button class="toast-close">×</button>
</div>

<!-- Error Toast -->
<div class="toast error">
  <svg class="toast-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M12 8v4m0 4v.01" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>
  <div class="toast-content">
    <p class="toast-message">Error uploading file. Maximum size is 10MB.</p>
  </div>
  <button class="toast-close">×</button>
</div>
```

---

## 📱 3. LAYOUT PRINCIPAL (Dashboard)

### CSS Grid Layout

```css
/* Main Layout */
body {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  background-color: var(--color-white);
}

/* Navbar */
.navbar {
  grid-column: 1 / -1;
  grid-row: 1;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--spacing-l);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

/* Sidebar */
.sidebar {
  grid-column: 1;
  grid-row: 2;
  background-color: var(--color-white);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: var(--spacing-l) 0;
}

/* Main Content */
main {
  grid-column: 2;
  grid-row: 2;
  overflow-y: auto;
  background-color: var(--color-light-gray);
  padding: var(--spacing-l);
}

/* Tablet Responsive */
@media (max-width: 1024px) {
  body {
    grid-template-columns: 60px 1fr;
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    width: 260px;
    height: calc(100vh - 60px);
    transform: translateX(-100%);
    transition: transform 300ms ease;
    z-index: 99;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}

/* Mobile Responsive */
@media (max-width: 640px) {
  body {
    grid-template-columns: 1fr;
    grid-template-rows: 60px 1fr;
  }
  
  .sidebar {
    width: 100%;
  }
}
```

### Navbar Component

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-l);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-l);
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-s);
  font-size: var(--font-h4-size);
  font-weight: 700;
  color: var(--color-dark-gray);
  text-decoration: none;
}

.navbar-search {
  position: relative;
  width: 300px;
}

.navbar-search input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  font-size: var(--font-body-size);
}

.navbar-search::before {
  content: '🔍';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-l);
}

.navbar-item {
  position: relative;
  cursor: pointer;
}

.navbar-item .badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--color-error);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
```

### Sidebar Navigation

```css
.sidebar-section {
  padding: var(--spacing-m) 0;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-section:last-child {
  border-bottom: none;
}

.sidebar-section-title {
  padding: 0 var(--spacing-m);
  font-size: var(--font-small-size);
  font-weight: 600;
  color: var(--color-secondary-gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-s);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-m);
  padding: var(--spacing-s) var(--spacing-m);
  color: var(--color-secondary-gray);
  text-decoration: none;
  cursor: pointer;
  transition: all 150ms ease;
  margin: 4px var(--spacing-m);
  border-radius: var(--radius-medium);
}

.sidebar-item:hover {
  color: #4B5563;
  background-color: var(--color-light-gray);
}

.sidebar-item.active {
  background-color: rgba(0, 102, 204, 0.1);
  color: var(--color-primary);
  font-weight: 600;
}

.sidebar-item .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Collapsed sidebar */
.sidebar.collapsed {
  width: 60px;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: var(--spacing-s) var(--spacing-m);
}

.sidebar.collapsed .sidebar-item span {
  display: none;
}
```

---

## 📄 4. DARK MODE (OPCIONAL)

### Dark Mode CSS Variables

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-white: #0F172A;
    --color-dark-gray: #F1F5F9;
    --color-secondary-gray: #94A3B8;
    --color-light-gray: #1E293B;
    --color-border: #334155;
    --color-primary: #3B82F6;
    
    --color-white-bg: #1A1F36;
  }
  
  body {
    background-color: #0F172A;
    color: #F1F5F9;
  }
  
  .card {
    background-color: #1A1F36;
  }
}

/* Manual Dark Mode Toggle */
html[data-theme="dark"] {
  --color-white: #0F172A;
  --color-dark-gray: #F1F5F9;
  --color-secondary-gray: #94A3B8;
  --color-light-gray: #1E293B;
  --color-border: #334155;
  --color-primary: #3B82F6;
}
```

### JavaScript Toggle

```javascript
// Dark mode toggle
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Load saved preference
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
});
```

---

## 📱 5. RESPONSIVE DESIGN

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  body { grid-template-columns: 1fr; }
  main { padding: var(--spacing-m); }
  .card { padding: var(--spacing-m); }
}

/* Tablet */
@media (max-width: 1024px) and (min-width: 641px) {
  body { grid-template-columns: 60px 1fr; }
  .sidebar { width: 60px; }
}

/* Desktop */
@media (min-width: 1025px) {
  body { grid-template-columns: 260px 1fr; }
}

/* Large Desktop */
@media (min-width: 1921px) {
  main { max-width: 1400px; margin: 0 auto; }
}
```

---

## 🎬 6. MICRO-INTERACTIONS & ANIMATIONS

### CSS Animations

```css
/* Loading Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Pulsing */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
  background-color: var(--color-light-gray);
  border-radius: var(--radius-medium);
}

/* Shimmer Effect */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-light-gray) 25%,
    var(--color-border) 50%,
    var(--color-light-gray) 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Fade + Slide */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-slide-in {
  animation: fadeSlideIn 200ms ease;
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.error-bounce {
  animation: bounce 400ms ease;
}

/* Scale */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 200ms ease;
}
```

---

## ♿ 7. ACCESSIBILITY (A11Y)

### WCAG 2.1 AA Compliance

```css
/* Focus Indicators */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Color Contrast */
/* All text: 4.5:1 (AA standard) */
/* Large text (18pt+): 3:1 ratio */

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background-color: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### HTML Semantic & ARIA

```html
<!-- Skip Link -->
<a href="#main" class="skip-link">Skip to main content</a>

<!-- Form Accessibility -->
<form>
  <label for="email">Email Address *</label>
  <input
    type="email"
    id="email"
    name="email"
    aria-required="true"
    aria-describedby="email-help"
  />
  <span id="email-help" class="form-helper">We'll never share your email.</span>
</form>

<!-- Icon Buttons -->
<button aria-label="Delete item">
  <svg class="icon" viewBox="0 0 24 24">...</svg>
</button>

<!-- Loading State -->
<button aria-busy="true" disabled>
  <span class="spinner" aria-hidden="true"></span>
  Loading...
</button>

<!-- Navigation -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

---

## 📐 8. COMPONENT SPECIFICATIONS

### Form Field Specifications

```
Height (inputs):    40px
Padding:            12px (vertical 8px, horizontal 12px)
Border:             1px solid #E5E7EB
Border radius:      8px
Focus border:       2px solid #0066CC
Focus outline:      3px solid rgba(0, 102, 204, 0.1)
Font size:          14px
Font family:        Inter
Placeholder color:  #9CA3AF
```

### Card Specifications

```
Padding:            24px
Border:             1px solid #E5E7EB
Background:         #FFFFFF
Border radius:      12px
Shadow:             0 1px 3px rgba(0,0,0,0.1)
Hover shadow:       0 10px 15px rgba(0,0,0,0.1) [if clickable]
Margin bottom:      24px
```

### Button Specifications

```
Height (default):   40px
Padding:            0 16px
Font weight:        600
Border radius:      8px
Transition:         150ms ease-in-out

Primary:
  Background:       #0066CC
  Text:             #FFFFFF
  Hover BG:         #0052A3
  Active BG:        #003D7A

Secondary:
  Background:       #F3F4F6
  Text:             #1F2937
  Hover BG:         #E5E7EB

Danger:
  Background:       #EF4444
  Text:             #FFFFFF
  Hover BG:         #DC2626
```

---

## 🎯 9. BEST PRACTICES PARA DEV

### File Structure
```
src/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Navbar.tsx
│   └── Sidebar.tsx
├── styles/
│   ├── variables.css
│   ├── global.css
│   ├── components.css
│   └── responsive.css
├── layouts/
│   ├── DashboardLayout.tsx
│   └── PublicLayout.tsx
└── pages/
    ├── dashboard.tsx
    ├── content-types.tsx
    └── entries.tsx
```

### CSS Organization
```css
/* 1. Variables */
:root { --color-primary: ...; }

/* 2. Reset & Base */
* { box-sizing: border-box; }
body { font-family: ...; }

/* 3. Utilities */
.container { max-width: ...; }
.flex { display: flex; }

/* 4. Components */
.btn { ... }
.card { ... }

/* 5. Layouts */
.dashboard { ... }

/* 6. Responsive */
@media (max-width: 640px) { ... }
```

### Naming Conventions
```
BEM (Block Element Modifier):
.card
.card__header
.card__body
.card--interactive

Utility Classes:
.m-0, .p-4, .flex, .grid, .text-center

State Classes:
.is-active, .is-disabled, .is-loading, .has-error
```

### Performance Tips
```
1. Minimize repaints: Batch DOM changes
2. Use CSS transforms: For animations (GPU accelerated)
3. Debounce events: Search, resize, scroll
4. Lazy load images: Use lazy-loading attribute
5. Code split: By routes/features
6. Tree shake: Remove unused CSS
7. Minify: Production build
```

---

## 📦 10. EXPORT ASSETS

### CSS Custom Properties Export
```css
/* Copy these to your global.css */

:root {
  /* Colors */
  --color-primary: #0066CC;
  --color-primary-dark: #0052A3;
  --color-primary-darker: #003D7A;
  --color-white: #FFFFFF;
  --color-dark-gray: #1F2937;
  --color-secondary-gray: #6B7280;
  --color-light-gray: #F3F4F6;
  --color-border: #E5E7EB;
  --color-placeholder: #9CA3AF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  --color-purple: #8B5CF6;
  --color-pink: #EC4899;
  --color-cyan: #06B6D4;
  --color-lime: #84CC16;

  /* Typography */
  --font-h1-size: 32px;
  --font-h1-weight: 700;
  --font-h1-line-height: 40px;
  --font-h2-size: 24px;
  --font-h2-weight: 700;
  --font-h2-line-height: 32px;
  --font-h3-size: 18px;
  --font-h3-weight: 600;
  --font-h3-line-height: 28px;
  --font-h4-size: 16px;
  --font-h4-weight: 600;
  --font-h4-line-height: 24px;
  --font-body-size: 14px;
  --font-body-weight: 400;
  --font-body-line-height: 22px;
  --font-small-size: 12px;
  --font-small-weight: 400;
  --font-small-line-height: 18px;
  --font-mono-size: 13px;
  --font-mono-line-height: 20px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* Radius */
  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 12px;
  --radius-round: 9999px;

  /* Shadows */
  --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-small: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-large: 0 20px 25px rgba(0, 0, 0, 0.15);
  --shadow-hover: 0 10px 20px rgba(0, 0, 0, 0.12);
}
```

---

*Design System for Developers - January 2026*  
*Ready for Implementation*
