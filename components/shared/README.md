# MLNF Shared Components

> **📚 For complete development documentation, see [../../docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md)**  
> *This file provides quick reference for developers working directly with components.*

This directory contains the shared components for the MLNF website to ensure consistent navigation, user interface, and authentication across all pages.

## Components Overview

1. **Navigation** - Handles the top navigation bar and mobile navigation
2. **User Menu** - Handles the user dropdown menu in the top right
3. **User Sidebar** - Handles the user sidebar
4. **Auth Modal** - Handles the authentication modal for login/register
5. **Core** - Initializes all components

## How to Use

To use these components in a new page, follow these steps:

### 1. Include the Shared CSS

Add the following to the `<head>` section of your HTML:

```html
<link rel="stylesheet" href="/components/shared/styles.css">
```

### 2. Prepare the HTML Structure

Ensure your page has the following structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta tags and CSS -->
</head>
<body>
    <!-- Empty header for navigation injection -->
    <header></header>
    
    <!-- Your page content -->
    <main>
        <!-- Page content here -->
    </main>
    
    <footer>
        <!-- Footer content -->
    </footer>
    
    <!-- Scripts go here -->
</body>
</html>
```

### 3. Include the Component Scripts

Add the following scripts before the closing `</body>` tag:

```html
<script src="/components/shared/navigation.js"></script>
<script src="/components/shared/userMenu.js"></script>
<script src="/components/shared/userSidebar.js"></script>
<script src="/components/shared/authModal.js"></script>
<script src="/components/shared/mlnf-core.js"></script>
```

The order is important - `mlnf-core.js` should be included last.

## How It Works

1. When the page loads, the `mlnf-core.js` script initializes all components
2. The navigation script injects the navigation HTML into the header
3. The user menu is injected within the navigation
4. The user sidebar and auth modal are injected into the document body
5. All UI components reflect the current user's authentication state

## Authentication State

The components automatically handle the following authentication states:

- **Logged In**: Shows user profile, user menu, and sidebar button
- **Guest**: Shows login/register options

Authentication state is stored in `localStorage` with the following keys:
- `sessionToken`: JWT token for API authentication
- `user`: JSON object with user details

## Manual Control

You can manually interact with the components as follows:

```javascript
// Open the login modal
window.MLNF.openSoulModal('login');

// Open the register modal
window.MLNF.openSoulModal('register');

// Close the modal
window.MLNF.closeSoulModal();

// Update the user menu (e.g., after profile changes)
window.MLNF.updateUserMenu();

// Update the user sidebar
window.MLNF.updateUserSidebar();
```

## Page Template

A complete page template is available at `/templates/page-template.html`. 