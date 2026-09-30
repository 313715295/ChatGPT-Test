# 10 · GPT-5.6 Sol / max：原构建材料

原作品为 `index.html`、`styles.css`、`scene.js` 及使用说明，按原字节保留在 [scenes/10](../../scenes/10/)；[原交付ZIP](../../scenes/10-original.zip) 同样保持原字节。解压后打开目录中的 `index.html` 即可离线运行，三个文件需放在一起。

源码保留在 `work/cat-coast-scooter-site`：Three.js 0.180.0、esbuild 0.25.10，原锁文件和构建脚本保留。进入该目录，运行 `npm ci` 后 `npm run build`，生成 `dist/` 三个静态文件。`node scripts/serve.mjs` 可选择开启本地预览，使用后关闭服务。

这些静态产物可本地运行；本仓库通过 GitHub Pages 展示。原任务的 Sites 凭据、私有站点配置、运行时缓存、node_modules 和聊天全文未收录。原源码、样式、构建器及原成品没有为测评修复；诊断副本只用于取证。

打包时原脚本移除了法律注释，完整 Three.js MIT 授权保留为 `work/cat-coast-scooter-site/THREE-LICENSE.txt`。不同构建环境可能改变压缩产物字节，冻结原成品以文件清单中的 SHA-256 为准。
