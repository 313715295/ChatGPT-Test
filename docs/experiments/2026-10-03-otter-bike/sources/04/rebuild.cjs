// 测评附加的便携重建入口；不是原模型交付脚本。原scene.html和依赖字节未改写。
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'work/scene.html'),'utf8');
const lib=fs.readFileSync(path.join(__dirname,'work/three.min.js'),'utf8');
const license=fs.readFileSync(path.join(__dirname,'work/three-LICENSE.txt'),'utf8');
const built=source.replace('<!-- THREE_LIBRARY -->',()=>'<script>\n/* Three.js MIT License\n'+license.replaceAll('*/','* /')+'\n*/\n'+lib+'\n</script>');
fs.mkdirSync(path.join(__dirname,'outputs'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'outputs/河岸邮差.html'),built);
