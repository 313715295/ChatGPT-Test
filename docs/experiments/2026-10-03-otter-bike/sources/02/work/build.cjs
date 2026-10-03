const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const three=fs.readFileSync(path.join(__dirname,'three.cjs'),'utf8');
const license=fs.readFileSync(path.join(__dirname,'three-license.txt'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'scene.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'template.html'),'utf8').replace('/*__THREE__*/',()=>`/*\nThree.js license:\n${license}\n*/\n(function(exports){\n${three}\n})(window.THREE={});`).replace('/*__SCENE__*/',()=>js);
fs.mkdirSync(path.join(root,'outputs'),{recursive:true});
fs.writeFileSync(path.join(root,'outputs','河畔邮差.html'),html);
console.log('Built self-contained HTML:',Buffer.byteLength(html),'bytes');
