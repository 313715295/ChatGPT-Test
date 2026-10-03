const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8')
 .replace('<!-- THREE_LIBRARY -->', () => '<script>\n' + fs.readFileSync(path.join(__dirname, 'three.min.js'), 'utf8') + '\n</script>')
 .replace('<!-- SCENE_SCRIPT -->', () => '<script>\n' + fs.readFileSync(path.join(__dirname, 'scene.js'), 'utf8') + '\n</script>');
fs.writeFileSync(path.join(root, 'outputs', '河岸邮差.html'), html);
console.log('Built self-contained HTML: ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
