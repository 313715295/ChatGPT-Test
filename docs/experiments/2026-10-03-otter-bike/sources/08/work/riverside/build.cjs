const fs=require('fs');
const path=require('path');
const dir=__dirname;
const source=fs.readFileSync(path.join(dir,'scene.html'),'utf8');
const three=fs.readFileSync(path.join(dir,'three.min.js'),'utf8').replace(/\/\/# sourceMappingURL=.*$/gm,'');
const html=source.replace('__THREE__',()=>three);
const out=path.resolve(dir,'../../outputs/河岸邮差.html');
fs.writeFileSync(out,html,'utf8');
console.log(JSON.stringify({output:out,bytes:Buffer.byteLength(html)}));
