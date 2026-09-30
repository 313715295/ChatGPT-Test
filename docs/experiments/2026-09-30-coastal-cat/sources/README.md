# 原源码与构建

各编号保留原场景源码、HTML模板、构建入口和原依赖文件。`code-sources/`是供报告行号阅读的同字节副本。未收录node_modules、机器专用预览/截图程序和私人日志。

无需构建即可打开相邻`scenes/`目录的原HTML。若要修改后重建，准备Node.js，按下表进入目录，先创建对应编号下的`outputs/`目录，再运行构建命令。

| 编号 | 相对此目录的工作目录 | 安装 | 构建 | 生成位置，相对此编号目录 |
| --- | --- | --- | --- | --- |
| 01 · GPT-6 Astra / max | `01/work` | `npm ci` | `node build.mjs` | `outputs/coastal-cat.html` |
| 02 · GPT-6 Astra / xhigh | `02/work` | 无需安装 | `node build.cjs` | `outputs/coastal-cat.html` |
| 03 · GPT-6 Astra / medium | `03/work` | 无需安装 | `node build.cjs` | `outputs/coast-cat.html` |
| 04 · GPT-6 Astra / high | `04/work` | `npm ci` | `node build.cjs` | `outputs/coast-cat.html` |
| 05 · GPT-6.1 Sol / max | `05/work/cat-coast` | `pnpm install --frozen-lockfile` | `node build.mjs` | `outputs/cat-coast-ride.html` |
| 06 · GPT-6.1 Sol / xhigh | `06/work` | `npm install` | `node build.mjs` | `outputs/cat-coastal-ride.html` |
| 07 · GPT-6.1 Sol / high | `07/work` | `npm ci` | `node build.cjs` | `outputs/海风小骑.html` |

03原场景使用内嵌库占位符，新增`build.cjs`仅用于可移植打包，不是原模型生成交付的一部分。其余原构建入口保持原字节。05原构建入口按工作目录计算输出路径，以上目录是必须条件。06原交付未保存锁文件，依赖在原package.json中固定版本。

依赖版本不同、构建器压缩变化可能导致重建字节不同；原成品哈希只用于核对冻结原文件。Three.js许可证保留在各编号目录或工作目录中。
