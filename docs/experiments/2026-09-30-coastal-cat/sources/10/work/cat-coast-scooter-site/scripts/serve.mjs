import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let file = new URL(`.${safePath}`, root);
    if ((await stat(file)).isDirectory()) file = new URL('index.html', file.href.endsWith('/') ? file : `${file.href}/`);
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file.pathname)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local: http://127.0.0.1:${port}/`);
});

