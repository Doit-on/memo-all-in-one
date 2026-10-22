const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDevPath = path.join(baseDir, 'index.dev.html');
const htmlOutPath = path.join(baseDir, 'index.html');

console.log('Reading source files for single-file bundle...');
let html = fs.readFileSync(htmlDevPath, 'utf8');
const css = fs.readFileSync(path.join(baseDir, 'assets/css/style.css'), 'utf8');
const defaultLogos = fs.readFileSync(path.join(baseDir, 'assets/js/default_logos.js'), 'utf8');
const storage = fs.readFileSync(path.join(baseDir, 'assets/js/storage.js'), 'utf8');
const utils = fs.readFileSync(path.join(baseDir, 'assets/js/utils.js'), 'utf8');
const app = fs.readFileSync(path.join(baseDir, 'assets/js/app.js'), 'utf8');

// Inline CSS
html = html.replace(
  '<link rel="stylesheet" href="assets/css/style.css">',
  `<!-- Inlined Self-Contained Stylesheet for GitHub Pages Deployment -->\n  <style>\n${css}\n  </style>`
);

// Inline JS
const combinedJs = [
  '/* --- Inlined default_logos.js --- */',
  defaultLogos,
  '/* --- Inlined storage.js --- */',
  storage,
  '/* --- Inlined utils.js --- */',
  utils,
  '/* --- Inlined app.js --- */',
  app
].join('\n\n').replace(/<\/script>/gi, '<\\/script>');

const scriptTagGroup = `  <!-- APPLICATION SCRIPTS -->
  <script src="assets/js/default_logos.js"></script>
  <script src="assets/js/storage.js"></script>
  <script src="assets/js/utils.js"></script>
  <script src="assets/js/app.js"></script>`;

html = html.replace(
  scriptTagGroup,
  `  <!-- BUNDLED APPLICATION SCRIPT (Self-Contained for GitHub Pages) -->\n  <script>\n${combinedJs}\n  </script>`
);

fs.writeFileSync(htmlOutPath, html, 'utf8');
console.log(`Bundle generated successfully: ${htmlOutPath} (${(fs.statSync(htmlOutPath).size / 1024).toFixed(1)} KB)`);
