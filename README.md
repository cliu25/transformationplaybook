# AI for Transformation Playbook - v7 (Simple HTML Version)

A clean, simple HTML-only version of the AI for Transformation Playbook site with no build process required.

## Features

- **End-to-End Workflow**: Interactive flowchart with phase navigation and accordions
- **Modules**: Browse and explore all transformation modules
- **Library**: Access all deliverables, templates, and resources organized by phase
- **IBM Carbon Design**: Professional styling inspired by IBM Carbon Design System
- **No Build Process**: Just open index.html in a browser or use a simple static server

## Structure

```
aift-playbook-site-v7/
├── index.html                          # Main HTML file
├── css/
│   └── styles.css                      # All styling (IBM Carbon inspired)
├── js/
│   └── app.js                          # All JavaScript logic
├── content_full_buildout.json          # Content data
└── public/
    └── templates/                      # Template files
```

## How to Run

### Option 1: Open Directly in Browser
Simply open `index.html` in your web browser. Note: Some browsers may block loading JSON files from the local filesystem due to CORS restrictions.

### Option 2: Use Python HTTP Server (Recommended)
```bash
cd aift-playbook-site-v7
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

### Option 3: Use Node.js HTTP Server
```bash
cd aift-playbook-site-v7
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser.

### Option 4: Use PHP Built-in Server
```bash
cd aift-playbook-site-v7
php -S localhost:8000
```
Then open http://localhost:8000 in your browser.

## Navigation

- **End-to-End Workflow**: View the transformation journey with interactive flowchart
  - Click on phase bubbles to highlight and scroll to that phase
  - Toggle between "By Phase" and "Critical Moments" views
  - Expand accordions to see phase details, chapters, and modules
  
- **Modules**: Browse all transformation modules
  - Click on any module card to see detailed information
  - View objectives, activities, deliverables, and tools
  - Click "Back to Modules" to return to the grid view
  
- **Library**: Access all deliverables and templates
  - Organized by phase for easy navigation
  - Download templates, examples, and resources
  - Links open in new tabs

## Technology Stack

- **HTML5**: Semantic, accessible markup
- **CSS3**: IBM Carbon-inspired design system
- **Vanilla JavaScript**: No frameworks or dependencies
- **IBM Plex Sans**: Professional typography

## Design Principles

- **IBM Carbon Design**: Square cards, 1px borders, IBM Blue (#0f62fe) for interactions
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Accessible**: Semantic HTML and keyboard navigation support
- **Professional**: Clean, corporate aesthetic suitable for enterprise use

## Content Management

All content is loaded from `content_full_buildout.json`. To update content:

1. Edit `content_full_buildout.json`
2. Refresh the browser
3. No build process needed!

## Template Files

Template files are stored in `public/templates/` and linked from the Library page. Templates can be:
- Markdown files (.md)
- Word documents (.docx)
- Excel spreadsheets (.xlsx)
- PowerPoint presentations (.pptx)
- PDF documents (.pdf)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses modern JavaScript)

## Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
    --ibm-blue: #0f62fe;
    --ibm-blue-hover: #0353e9;
    /* ... more colors ... */
}
```

### Typography
Change the font by updating the Google Fonts link in `index.html` and the CSS variable:
```css
:root {
    --font-family: 'IBM Plex Sans', sans-serif;
}
```

### Layout
Adjust spacing, grid columns, and breakpoints in `css/styles.css`.

## Troubleshooting

### Content not loading
- Make sure `content_full_buildout.json` is in the same directory as `index.html`
- Use a local server (Python, Node.js, or PHP) instead of opening the file directly
- Check browser console for errors

### Templates not downloading
- Verify template files exist in `public/templates/`
- Check that URLs in `content_full_buildout.json` are correct
- Ensure the server is serving files from the correct directory

### Styling issues
- Clear browser cache
- Check that `css/styles.css` is loading correctly
- Verify IBM Plex Sans font is loading from Google Fonts

## Comparison with v4

| Feature | v4 (React) | v7 (HTML) |
|---------|-----------|-----------|
| Build Process | ✅ npm build | ❌ None needed |
| Dependencies | ✅ React, Vite | ❌ None |
| File Size | ~2MB (with node_modules) | ~50KB |
| Setup Time | 5-10 minutes | Instant |
| Customization | Requires React knowledge | Simple HTML/CSS/JS |
| Performance | Fast (after build) | Instant load |

## License

Internal IBM use only.

## Support

For questions or issues, contact the AI for Transformation team.