const fs=require('node:fs'),path=require('node:path');
const lib=fs.readFileSync(path.join(__dirname,'three.min.js'),'utf8');
const template=fs.readFileSync(path.join(__dirname,'scene.html'),'utf8');
const out=path.join(__dirname,'../outputs');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'coast-cat.html'),template.replace('/* THREE_INLINE */',()=>lib.replace(/<\/script/gi,'<\\/script')));
console.log('Created outputs/coast-cat.html');
