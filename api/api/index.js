// serverless entry that serves the static landing page for non-file routes
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Serve index.html for any non-file route (vercel.json already rewrites those here)
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');

  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Server error: could not read index.html');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(data);
  });
};
