## Session Summary: [Current Date] - Header Auth & Active Users Button Refinement

**Objective:** Refine header authentication display and Active Users sidebar button functionality.

**Key Changes Implemented:**

1.  **Header Authentication UI Overhaul:**
    *   **Logged-Out State:**
        *   Removed the "Guest" user dropdown from the main header.
        *   Implemented two stacked buttons ("Embrace Immortality" & "Enter Sanctuary") in the header's top-right for logged-out users. These buttons trigger the authentication modal.
        *   Relevant files: `front/index.html` (added `#headerAuthButtonsContainer`), `front/css/styles.css` (styled new buttons), `front/components/shared/userMenu.js` (updated logic to toggle display and populate new button container).
    *   **Logged-In State:**
        *   The standard user dropdown menu remains in place for logged-in users.
        *   Relevant files: `front/components/shared/userMenu.js` (updated logic).

2.  **Active Users Sidebar Button (`#showUsersBtn`):**
    *   **Conditional Visibility:** The button is now only displayed to logged-in users. It's hidden when no user is logged in.
    *   **Enhanced Styling:** The button's visual appearance was significantly upgraded (larger, rounded-square, gradient background, dynamic hover/active effects).
    *   Relevant files: `front/components/shared/activeUsers.js` (added `updateActiveUsersButtonVisibility()` and integrated it into init and global MLNF object), `front/components/shared/userMenu.js` (calls visibility update on auth state change), `front/css/active-users.css` (new button styles).

**Overall Impact:**
*   Improved clarity in the header UI, distinguishing more effectively between logged-in and guest states.
*   Enhanced the visual appeal and contextual relevance of the Active Users sidebar button. 

---

## Session Summary: May 28, 2025 - Critical Authentication & Profile System Fixes

**Objective:** Resolve critical registration failures and implement functional public profile system.

**Critical Issues Resolved:**

1.  **Registration System Complete Overhaul:**
    *   **Root Cause Identified:** Frontend calling `/auth/register` while backend expected `/auth/signup` - causing 401 errors and JSON parse failures.
    *   **Files Fixed:** 
        *   `front/components/shared/authModal.js` - Updated endpoint from `/auth/register` to `/auth/signup`
        *   `front/js/scripts.js` - Updated duplicate registration logic to use correct endpoint
    *   **Enhanced User Experience:** 
        *   Registration now automatically logs users in (backend returns token + user data)
        *   Eliminated manual login step after successful registration
        *   Updated success message: "Eternity claimed! Welcome to the Sanctuary."
        *   Added automatic page refresh to show logged-in state
    *   **Added Missing Function:** Created `isLoggedIn()` helper function that was being called but not defined

2.  **Public Profile System Architecture:**
    *   **Dynamic Template System:** Confirmed `/souls/[username].html` serves as universal template for all user profiles
    *   **URL Routing Fixed:** Updated `front/_redirects` configuration:
        *   OLD (broken): `/souls/:username → /pages/souls/profile.html?username=:username`
        *   NEW (working): `/souls/:username → /souls/[username].html`
    *   **Backend API Enhanced:** 
        *   Added `online` status field to `GET /users/:username` endpoint in `back/routes/users.js`
        *   Profile endpoint now returns: `username`, `displayName`, `avatar`, `status`, `bio`, `createdAt`, `online`

3.  **System Integration Improvements:**
    *   **Consistent Token Handling:** Both login and registration now store session token and user data identically
    *   **Real-time UI Updates:** Authentication state changes immediately update user interface
    *   **Error Handling:** Improved feedback for authentication failures with specific error messages

**Technical Architecture Confirmed:**
*   **Profile URL Flow:** `https://mlnf.net/souls/username` → Netlify redirects → `/souls/[username].html` → JavaScript extracts username → API call → Dynamic rendering
*   **Authentication Flow:** Registration → Backend returns token + user data → Frontend stores both → Auto-login → UI refresh
*   **API Endpoints:** All authentication and user management endpoints verified and functional

**Files Modified:**
*   `front/components/shared/authModal.js` - Registration endpoint fix + auto-login logic
*   `front/js/scripts.js` - Registration endpoint fix + auto-login logic + isLoggedIn() function
*   `front/_redirects` - Fixed profile URL routing configuration
*   `back/routes/users.js` - Added online status to profile endpoint

**Overall Impact:**
*   Registration system now fully functional - users can create accounts seamlessly
*   Public profile sharing works via clean URLs (`/souls/username`)
*   Enhanced user experience with automatic login after registration
*   Solid foundation established for messaging system and admin dashboard development

---

## Session Summary: [Date of This Session] - Extensive Spring Cleaning & Refactoring

**Objective:** Organize codebase, remove redundancies, ensure efficiency, and prepare for future development. Vanilla JS frontend, Express.js/MongoDB backend.

**Key Changes & Achievements:**

1.  **Project Structure & Git:**
    *   Standardized frontend to `MLNF/front/` and backend to `MLNF/back/`.
    *   Resolved Git "too many active changes" error in `MLNF/back/` by correcting `.gitignore` and untracking `node_modules` contents.

2.  **File System Cleanup (Frontend):**
    *   Consolidated `dev-log.md` into `MLNF/front/`.
    *   Deleted several redundant/old HTML files and a `package-lock.json` from an incorrect location.
    *   Confirmed removal of nested `MLNF/front/MLNF/` folder.
    *   Created `MLNF/front/_redirects` for Cloudflare Pages from a legacy `.htaccess` file. The `.htaccess` file was later confirmed as not present and thus didn't require deletion.

3.  **CSS Externalization & Standardization (`MLNF/front/`):
    *   **`profile-setup.html`**: Inline styles moved to `css/profile-setup.css`.
    *   **`base-theme.css`**: Created to centralize CSS custom properties (`:root`) from various files.
    *   **`styles.css` (main stylesheet)**: Removed its local `:root` (merged one variable to `base-theme.css`).
    *   **`blog.html`**: Inline styles moved to `css/blog.css`.
    *   **`messageboard.html`**: Inline styles moved to `css/messageboard.css`.
    *   **`souls/index.html`**: Large inline `<style>` block's content was moved. Page-specific styles were consolidated into `css/souls-listing.css` (which was cleaned of global style duplications). Generic/global styles from the inline block were added/merged into `css/styles.css`. The HTML file itself will need manual removal of the now-redundant `<style>` tags.
    *   All relevant HTML files updated to link `base-theme.css` and their specific stylesheets.

4.  **CSS Consolidation (Shared vs. Main - `MLNF/front/`):
    *   **User Menu, Mobile Nav Toggle, Soul Modal**: Styles were removed/confirmed to be primarily in `components/shared/styles.css`, removing them from `styles.css`.
    *   **Active Users Sidebar**: Styles moved from `styles.css` to `css/active-users.css`.
    *   **Message Modal**: Styles consolidated into `components/shared/styles.css` (from `active-users.css` and `styles.css`). The content class was renamed from `.auth-modal` to `.message-modal-content` in CSS and relevant HTML files.
    *   **`styles.css` Full Refactor**: The main `styles.css` was manually replaced with a cleaner version focusing on global styles, generic elements, and page structure, excluding component-specific rules.
    *   `@keyframes modalContentAppear` moved from `styles.css` to `components/shared/styles.css`.

5.  **Shared JavaScript Components & Refactoring (`MLNF/front/`):
    *   **`messageModal.js`**: Created as a new shared component from inline JS in `lander.html`.
    *   **`index.html`**: Corrected JS path, removed redundant inline JS for Active Users and Message Modal.
    *   **`lander.html`**: Removed large commented-out JS block.
    *   **`souls/index.html`**: JavaScript was reviewed. Page-specific logic (fetching/rendering profiles, search) remains. Redundant initializers for shared components were confirmed removed. Added missing script tag for `js/user-sidebar.js` (its page-specific sidebar).
    *   **`profile-setup.html`**: Refactored inline JS to use global config and shared auth functions.
    *   **`blog.html`**: Inline JS (including `jwt-decode` and Active Users logic) moved to `js/blog.js`. Redundant Active Users logic removed from `js/blog.js`.
    *   **`authModal.js`**: A dead call to a non-existent `updateUserSidebar` function was identified for manual removal.

**Overall Impact:**
*   Significantly improved codebase organization, modularity, and maintainability.
*   Reduced CSS and JavaScript redundancy, promoting better caching and performance.
*   Established clearer patterns for managing global styles, component-specific styles, and shared JavaScript functionality.
*   The project is now in a much stronger position for ongoing and future development. 

---

## Session Summary: [Current Date] - Eternal Souls Refactor & Immortal's Sanctum Admin Panel

**Objective:** Simplify the Eternal Souls user directory, unify online status and messaging, and implement a robust administrative control center.

**Key Changes Implemented:**

1.  **Eternal Souls Directory Refactor:**
    *   Removed feather (posts) and connections count from user cards.
    *   Eliminated search/filter functionality for now, focusing on a clean, simple user listing.
    *   Ensured only the shared Active Users sidebar is used for online status and instant messaging (removed duplicate/custom user sidebar and related JS/CSS).
    *   Kept privacy controls as is.
    *   Updated UI for clarity and simplicity.

2.  **Admin Panel Creation (Immortal's Sanctum):**
    *   Created a new admin panel at `/admin/`, initially named "Eternal Dominion," then renamed to **Immortal's Sanctum** per user preference.
    *   Features dashboard, user management (Soul Management), and analytics (Eternal Analytics) sections.
    *   Admin role detection is currently by username.
    *   All references and documentation updated to use the new name.

3.  **Documentation & Logging:**
    *   Updated `README.md`, `DEV-SETUP.md`, and `DEVELOPMENT-PREFERENCES.md` to reflect the Eternal Souls refactor, admin panel creation, and session progress.
    *   Confirmed that `dev-log.md` is the canonical development log file in the frontend directory.

4.  **Git Troubleshooting:**
    *   Encountered and documented a "not a git repository" error in the frontend; provided troubleshooting steps for resolving git issues in the `front` directory.

**Overall Impact:**
*   The Eternal Souls page is now a clean, user-friendly directory with unified online status and messaging.
*   The admin panel (Immortal's Sanctum) provides a foundation for robust site management and analytics.
*   All major changes and session progress are now consistently documented.
*   The project is well-positioned for further enhancements to Eternal Souls and administrative features. 