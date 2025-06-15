# MLNF Avatar System Documentation

The MLNF Avatar System provides a consistent, scalable, and immortal-themed approach to displaying user avatars and information across the site.

## Features

- **Scalable avatars** with 6 size variants (xs, sm, md, lg, xl, xxl)
- **Mystical effects** including rotating gradient borders and glowing animations
- **Status indicators** for online/offline users
- **Immortal typography** with 4 themed font families
- **Responsive design** that adapts to mobile screens
- **Automatic fallbacks** for avatar loading errors
- **Light/dark theme support**

## Quick Start

### Basic Avatar

```html
<img class="mlnf-avatar mlnf-avatar--md" src="avatar-url.jpg" alt="Username">
```

### Avatar with Mystical Effects

```html
<img class="mlnf-avatar mlnf-avatar--lg mlnf-avatar--mystical mlnf-avatar--online" src="avatar-url.jpg" alt="Username">
```

### Complete User Display

```html
<div class="mlnf-user-display mlnf-user-display--md">
    <img class="mlnf-avatar mlnf-avatar--md" src="avatar-url.jpg" alt="Username">
    <div class="mlnf-user-info">
        <span class="mlnf-username mlnf-username--immortal">Username</span>
        <span class="mlnf-user-title">Eternal Soul</span>
        <span class="mlnf-user-status">Online now</span>
    </div>
</div>
```

## JavaScript API

### Creating Avatars Programmatically

```javascript
// Basic avatar
const avatar = window.MLNFAvatars.createAvatar({
    username: 'ImmortalAl',
    size: 'lg',
    mystical: true,
    online: true
});

// Complete user display
const userDisplay = window.MLNFAvatars.createUserDisplay({
    username: 'ImmortalAl',
    title: 'Founder & Eternal Guide',
    status: 'Manifesting Liberation',
    avatarSize: 'xl',
    displaySize: 'lg',
    mystical: true,
    usernameStyle: 'mystical',
    clickable: true,
    onClick: () => console.log('User clicked!')
});

// Append to DOM
document.body.appendChild(userDisplay);
```

### Generating Avatar URLs

```javascript
// Generate avatar URL with fallback
const avatarUrl = window.MLNFAvatars.generateAvatarUrl('Username', 48);

// With custom avatar
const customUrl = window.MLNFAvatars.generateAvatarUrl('Username', 48, 'https://example.com/avatar.jpg');
```

## CSS Classes Reference

### Avatar Sizes
- `mlnf-avatar--xs` - 20px (16px on mobile)
- `mlnf-avatar--sm` - 28px (20px on mobile)
- `mlnf-avatar--md` - 36px (28px on mobile)
- `mlnf-avatar--lg` - 48px (36px on mobile)
- `mlnf-avatar--xl` - 64px (44px on mobile)
- `mlnf-avatar--xxl` - 80px (56px on mobile)

### Avatar Effects
- `mlnf-avatar--mystical` - Rotating gradient border with pulsing glow
- `mlnf-avatar--online` - Green status indicator
- `mlnf-avatar--offline` - Gray status indicator

### User Display Sizes
- `mlnf-user-display--xs` - Extra small padding and gaps
- `mlnf-user-display--sm` - Small padding and gaps
- `mlnf-user-display--md` - Medium padding and gaps (default)
- `mlnf-user-display--lg` - Large padding and gaps
- `mlnf-user-display--xl` - Extra large padding and gaps

### User Display Variants
- `mlnf-user-display--compact` - Transparent background, minimal padding

### Username Styles
- `mlnf-username--immortal` - Cinzel font with gradient text
- `mlnf-username--mystical` - Caesar Dressing font with glow effect
- `mlnf-username--eternal` - Metal Mania font with letter spacing

## Immortal Typography

### Font Classes
- `font-immortal-heading` - Cinzel serif, formal and elegant
- `font-immortal-mystical` - Caesar Dressing, mysterious and ancient
- `font-immortal-gothic` - Metal Mania, bold and eternal
- `font-immortal-ancient` - Griffy, weathered and timeless

### Text Effects
- `text-immortal-glow` - Multi-layer glowing text shadow
- `text-immortal-gradient` - Gradient text using accent colors
- `text-immortal-pulse` - Pulsing glow animation

### Example Usage

```html
<h1 class="font-immortal-heading text-immortal-glow">Eternal Heading</h1>
<span class="font-immortal-mystical text-immortal-gradient">Mystical Text</span>
<p class="font-immortal-gothic text-immortal-pulse">Pulsing Gothic Text</p>
```

## Best Practices

### When to Use Each Size
- **xs/sm**: Inline mentions, compact lists, mobile navigation
- **md**: Standard comments, forum posts, general UI
- **lg**: Profile headers, author bylines, featured content
- **xl/xxl**: Profile pages, modal headers, special displays

### Mystical Effects
- Use `mlnf-avatar--mystical` for:
  - VIP users or moderators
  - Special events or announcements
  - Profile highlights
  - Modal displays for emphasis

### Username Styling
- `immortal`: Professional content, formal displays
- `mystical`: Special users, magical content, featured items
- `eternal`: Gothic themes, metal/rock content, edgy displays

### Performance Notes
- Avatars use lazy loading by default
- Fallback URLs prevent broken images
- CSS animations are optimized for performance
- Responsive breakpoints reduce sizes on mobile

## Integration Examples

### Chronicles Highlights
```html
<div class="mlnf-user-display mlnf-user-display--sm mlnf-user-display--compact">
    <img class="mlnf-avatar mlnf-avatar--sm" src="avatar.jpg" alt="Author">
    <div class="mlnf-user-info">
        <span class="mlnf-username mlnf-username--immortal">AuthorName</span>
        <span class="mlnf-user-title">Eternal Chronicler</span>
    </div>
</div>
```

### Modal Author Display
```html
<div class="mlnf-user-display mlnf-user-display--lg">
    <img class="mlnf-avatar mlnf-avatar--lg mlnf-avatar--mystical" src="avatar.jpg" alt="Author">
    <div class="mlnf-user-info">
        <span class="mlnf-username mlnf-username--mystical">AuthorName</span>
        <span class="mlnf-user-title">Eternal Chronicler</span>
        <span class="mlnf-user-status">Keeper of Immortal Truths</span>
    </div>
</div>
```

### Comment System
```javascript
const commentUser = window.MLNFAvatars.createUserDisplay({
    username: comment.author.username,
    title: 'Eternal Soul',
    avatarSize: 'sm',
    displaySize: 'sm',
    compact: true,
    usernameStyle: 'immortal',
    customAvatar: comment.author.avatar
});
```

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- CSS custom properties (CSS variables)
- CSS `background-clip: text` for gradient text (with fallbacks)
- ES6+ JavaScript features

## Updates and Versioning

Current Version: 1.0

- Avatar system with 6 size variants
- Mystical effects and animations
- Immortal typography system
- Responsive design
- JavaScript API for dynamic creation