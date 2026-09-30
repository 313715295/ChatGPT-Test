const fs=require('fs');const path=require('path');const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
const result=esbuild.buildSync({entryPoints:[path.join(__dirname,'scene.js')],bundle:true,write:false,format:'iife',minify:true,target:'es2020',legalComments:'inline'});
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const license=fs.readFileSync(path.join(__dirname,'node_modules/three/LICENSE'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'template.html'),'utf8').replace('<!-- BUNDLE -->',()=>'<!-- Three.js 0.180.0\n'+license+'\n-->\n<script>'+js+'</script>');
fs.mkdirSync(path.join(root,'outputs'),{recursive:true});fs.writeFileSync(path.join(root,'outputs','海风小骑.html'),html);
console.log('Built standalone HTML:',Buffer.byteLength(html),'bytes');
