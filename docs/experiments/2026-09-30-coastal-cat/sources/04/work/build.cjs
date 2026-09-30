const fs=require('fs');const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:[__dirname+'/scene.js'],bundle:true,minify:true,format:'iife',outfile:__dirname+'/bundle.js',legalComments:'inline'});
const html=fs.readFileSync(__dirname+'/page.html','utf8').replace('/*__BUNDLE__*/',()=>fs.readFileSync(__dirname+'/bundle.js','utf8').replace(/<\/script/gi,'<\\/script'));
fs.writeFileSync(__dirname+'/../outputs/coast-cat.html',html);
console.log('Built offline HTML: '+Buffer.byteLength(html)+' bytes');
