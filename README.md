# Manifest Liberation, Naturally Free (MLNF)

**Important Project Structure Note:**
- The front-end static site files are located in: `MLNF/front/`
- The back-end Express.js app is in: `MLNF/back/`

This is to avoid confusion when running git commands or editing files. Always `cd MLNF/front` for front-end git operations.

---

A timeless sanctuary for liberated spirits to manifest truth and freedom.

## Project Structure

```
mlnf/
├── assets/              # Static assets (images, fonts, etc.)
├── css/                # CSS files
│   ├── components/     # Component-specific styles
│   ├── sections/      # Section-specific styles
│   ├── variables.css  # CSS variables
│   ├── utilities.css  # Utility classes
│   └── main.css       # Main entry point
├── js/                 # JavaScript files
├── pages/             # Page templates
├── dist/              # Build output
└── src/              # Source files
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## Features

- Modern CSS architecture with modular components
- Theme support (dark/light)
- Responsive design
- Optimized build process
- Font Awesome icons
- Cross-browser compatibility

## Development

The project uses:
- PostCSS for CSS processing
- Rollup for JavaScript bundling
- Tailwind CSS for utility classes
- Font Awesome for icons

## Deployment

The project is deployed using Cloudflare Pages. To deploy:
```bash
npm run deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC License
