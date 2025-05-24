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