const fs=require('fs'),path=require('path'),vm=require('vm');
const base=__dirname,app=fs.readFileSync(path.join(base,'scene.js'),'utf8');
new vm.Script(app);
const library=fs.readFileSync(path.join(base,'three.min.js'),'utf8').replace(/\/\/# sourceMappingURL=.*$/gm,'');
const license=fs.readFileSync(path.join(base,'THREE-LICENSE.txt'),'utf8');
const output=fs.readFileSync(path.join(base,'page.html'),'utf8').replace('/* THREE_LICENSE */','/*\n'+license+'\n*/').replace('/* THREE_LIBRARY */',()=>library).replace('/* SCENE_SCRIPT */',()=>app);
const dest=path.join(base,'../outputs/coastal-cat.html');fs.writeFileSync(dest,output);console.log(JSON.stringify({file:dest,bytes:Buffer.byteLength(output),syntax:'OK'}));
