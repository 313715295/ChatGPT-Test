# 浏览器复测

基础、扩展和上下文检查来自本轮实际检查脚本，只将输入目录改为公开实验目录、输出改为根目录`qa-results/`，并去掉机器专用运行库路径。原证据保留在`docs/experiments/.../evidence`，复测不会覆盖原记录。

准备Node.js后在此目录运行：

```sh
npm install
npx playwright install chromium
node browser_qa.cjs
node extended_qa.cjs
node context_qa.cjs
```

如需使用本机Chrome，可设置`CHROME_PATH`环境变量为浏览器可执行文件路径。默认使用Playwright安装的Chromium。浏览器版本、图形后端、GPU和负载会改变性能值，不要求与本轮RTX 4070记录一致。

这三项检查复核运行状态、运动、暂停、调速、镜头、键盘、尺寸、离线、轮转和实际上下文丢失/恢复。统一主体与飞鸟近景还涉及诊断副本构建，不由此脚本重建，详见报告说明与原截图。机器检查结果不会自动产生质量名次。
