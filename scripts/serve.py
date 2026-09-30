"""Serve the public report locally using only the Python standard library."""
import argparse
import functools
import http.server
import pathlib

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8000)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1] / 'docs'
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
print(f'Open http://127.0.0.1:{args.port}/', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
