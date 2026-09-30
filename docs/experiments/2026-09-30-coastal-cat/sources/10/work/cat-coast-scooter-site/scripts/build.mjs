import { build } from 'esbuild';

await build({
  entryPoints: ['src/scene.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  outfile: 'dist/scene.js',
});

