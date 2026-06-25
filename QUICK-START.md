# Quick Start Guide - AI for Transformation Playbook v7

## 🚀 Get Started in 30 Seconds

### Step 1: Navigate to the directory
```bash
cd aift-playbook-site-v7
```

### Step 2: Start a local server
```bash
python3 -m http.server 8080
```

### Step 3: Open in browser
Open http://localhost:8080 in your web browser.

That's it! No npm install, no build process, no dependencies.

## 📋 What You'll See

### 1. End-to-End Workflow (Default Page)
- **Interactive Flowchart**: Click on phase bubbles (Assess, Analyze, Design, Build, Sustain)
- **By Phase Tab**: Expand accordions to see chapters and modules for each phase
- **Critical Moments Tab**: View key decision points and activities

### 2. Modules Page
- **Module Grid**: Browse all transformation modules
- **Module Details**: Click any card to see objectives, activities, deliverables, and tools
- **Back Navigation**: Return to grid view with the "Back to Modules" button

### 3. Library Page
- **Organized by Phase**: All deliverables grouped by transformation phase
- **Download Links**: Click to download templates, examples, and resources
- **External Links**: Opens in new tabs to Box, Google Drive, etc.

## 🎨 Design Features

- **IBM Carbon Design**: Professional, enterprise-ready styling
- **IBM Plex Sans Font**: Clean, modern typography
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Square Cards**: 1px borders with IBM Blue hover effects
- **Smooth Interactions**: Transitions and animations throughout

## 🔧 Alternative Servers

### Node.js
```bash
npx http-server -p 8080
```

### PHP
```bash
php -S localhost:8080
```

### VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## 📝 Making Changes

### Update Content
1. Edit `content_full_buildout.json`
2. Refresh browser
3. Changes appear immediately!

### Update Styling
1. Edit `css/styles.css`
2. Refresh browser
3. See your changes instantly

### Update Functionality
1. Edit `js/app.js`
2. Refresh browser
3. Test your changes

## 🆚 v7 vs v4

| Feature | v4 (React) | v7 (HTML) |
|---------|-----------|-----------|
| Setup | `npm install` (5-10 min) | Open file (instant) |
| Build | `npm run build` | None needed |
| Size | ~2MB | ~50KB |
| Tech | React + Vite | HTML + CSS + JS |
| Editing | JSX knowledge | Basic web skills |

## 🎯 Use Cases

### For Developers
- Quick prototyping
- Testing content changes
- Sharing with non-technical users
- Offline presentations

### For Content Editors
- Update JSON without rebuilding
- Preview changes instantly
- No technical setup required

### For Stakeholders
- Easy to share (just zip and send)
- No installation needed
- Works on any device

## 🐛 Troubleshooting

### Content not loading?
- Use a local server (don't open file:// directly)
- Check browser console for errors
- Verify `content_full_buildout.json` exists

### Styling broken?
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Check `css/styles.css` is loading
- Verify Google Fonts connection

### Templates not downloading?
- Check `public/templates/` directory
- Verify file paths in JSON
- Ensure server is serving static files

## 📚 Next Steps

1. **Explore the Site**: Click through all three pages
2. **Test Interactions**: Try the flowchart, accordions, and module details
3. **Review Content**: Check that all data loads correctly
4. **Customize**: Update colors, fonts, or layout as needed
5. **Deploy**: Copy to any static hosting (GitHub Pages, Netlify, etc.)

## 🎉 Success!

You now have a fully functional, simple HTML version of the AI for Transformation Playbook!

**Current Status**: ✅ Server running at http://localhost:8080

Enjoy exploring the playbook! 🚀