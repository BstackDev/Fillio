const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const mimeTypes = {
    '.html': 'text/html', 
    '.js': 'application/javascript', // Pastikan ini ada
    '.css': 'text/css',
    '.json': 'application/json', 
    '.txt': 'text/plain'
};
http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    let filePath;
    try {
        filePath = path.resolve(ROOT, `.${urlPath}`);
    } catch (error) {
        res.writeHead(400); res.end('Bad Request'); return;
    }
    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') { res.writeHead(404); res.end('404 Not Found'); }
            else { res.writeHead(500); res.end('Server Error'); }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log(`[AutoFill] Server berjalan di http://localhost:${PORT}/`);
});