# ChatGPT / Codex 作品测评

同一提示词下，记录具体交付的时间、Token、费用折算与成品质量。每次实验独立保存，方便查看原作品、源码和验证依据。

## 2026-09-30：猫在海边骑电动车，九组交付

- [在线完整测评](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/)：可排序用量表、Fast情景滑块、九组质量分析、源码行号、飞鸟与环境、运行证据。
- [仓库内实验说明](docs/experiments/2026-09-30-coastal-cat/README.md) · [聚合数据JSON](docs/experiments/2026-09-30-coastal-cat/analysis-data.json) · [指标CSV](docs/experiments/2026-09-30-coastal-cat/data/metrics.csv)
- [原源码与重建说明](docs/experiments/2026-09-30-coastal-cat/sources/README.md) · [九个原作品](docs/experiments/2026-09-30-coastal-cat/scenes/README.md)

01–07为约10:00启动的原七组；08 · GPT-6.1 Sol / low、09 · GPT-6.1 Sol / medium为约14:25启动的后补两组。九组分两批进行，不能当作同一场并发的受控基准。

## 九个原始交付作品

“在线运行”打开真正的3D场景；“原文件”打开GitHub文件页，可下载HTML后离线打开。GitHub文件页只显示源码，不执行网页。九份原HTML与对应场景源码均按原字节保留。

| 编号 · 模型 / 推理 | 在线运行 | 原文件 | 场景逻辑源码 |
| --- | --- | --- | --- |
| 01 · GPT-6 Astra / max | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/01.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/01.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/01.html) |
| 02 · GPT-6 Astra / xhigh | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/02.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/02.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/02.html) |
| 03 · GPT-6 Astra / medium | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/03.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/03.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/03.html) |
| 04 · GPT-6 Astra / high | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/04.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/04.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/04.html) |
| 05 · GPT-6.1 Sol / max | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/05.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/05.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/05.html) |
| 06 · GPT-6.1 Sol / xhigh | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/06.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/06.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/06.html) |
| 07 · GPT-6.1 Sol / high | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/07.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/07.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/07.html) |
| 08 · GPT-6.1 Sol / low | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/08.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/08.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/08.html) |
| 09 · GPT-6.1 Sol / medium | [运行作品](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/scenes/09.html) | [原HTML](https://github.com/313715295/ChatGPT-Test/blob/main/docs/experiments/2026-09-30-coastal-cat/scenes/09.html) | [源码行号](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/code-review/09.html) |

原任务：

> 全新创建一个可直接运行的 Three.js 网页 3D 场景：内容是一个猫在海边马路上骑电动车的3D动画

| 编号 · 模型 / 推理 | 原任务实际用时 | Standard折算USD | 九组质量名次 | 批次 |
| --- | ---: | ---: | ---: | --- |
| 01 · GPT-6 Astra / max | 15:46 | $3.197128 | 3 | 原七组 |
| 02 · GPT-6 Astra / xhigh | 14:10 | $3.953866 | 4 | 原七组 |
| 03 · GPT-6 Astra / medium | 4:57 | $0.994350 | 8 | 原七组 |
| 04 · GPT-6 Astra / high | 7:16 | $1.500242 | 7 | 原七组 |
| 05 · GPT-6.1 Sol / max | 26:13 | $0.730529 | 1 | 原七组 |
| 06 · GPT-6.1 Sol / xhigh | 26:26 | $0.900746 | 2 | 原七组 |
| 07 · GPT-6.1 Sol / high | 13:38 | $0.418635 | 5 | 原七组 |
| 08 · GPT-6.1 Sol / low | 5:32 | $0.141016 | 9 | 后补两组 |
| 09 · GPT-6.1 Sol / medium | 10:35 | $0.285720 | 6 | 后补两组 |

九组综合质量排序为 **05 > 06 > 01 > 02 > 07 > 09 > 04 > 03 > 08**。由Codex检查实际代码、原场景和统一角度主体后综合判断；05/06、01/02、07/09、04/03接近，属于观察式评估，非盲评。价格、时间和拍摄遮挡不参与质量名次。

**08 · GPT-6.1 Sol / low**的费用折算最低，但轮胎接触运动与地面方向不一致，轮转计算半径也有约1.16%偏差。**09 · GPT-6.1 Sol / medium**的模型细节更完整，轮转关系一致；图形故障后仍依赖刷新恢复。可运行与运动逻辑正确分别记录，详见[源码及实际接触位移证据](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/references/rolling-contact-verification.html)。

九组合计Standard文本Token折算 **$12.122232**，**不是实际账户扣费**。定价为2026-09-30官方快照；原日志未保存service_tier，Fast没有对应重复实测。每种配置只有一次样本，不能据此推断普遍模型排名或稳定提速倍率。

## 原作品与总结目录

```text
docs/
  index.html                         测评入口
  experiments/2026-09-30-coastal-cat/
    index.html                       完整交互报告
    README.md                        方法、结论与口径
    analysis-data.json               九组可复核聚合数据
    data/                            CSV、定价、当前/历史排序、文件哈希
    scenes/                          九份原始可运行HTML
    code-sources/                    原场景逻辑源码
    code-review/                     带行号的源码阅读页
    sources/                         原构建文件、依赖清单和许可证
    evidence/                        总结引用的截图与检查数据
    references/                      站内可读引用与定价说明
```

下载仓库后可直接离线打开九份`scenes/*.html`；在线查看请使用上方“运行作品”。

公开材料保留会话ID、模型、推理等级、聚合用量与作品证据。未上传私人会话全文、数据库、机器目录或凭据。聚合值与原始本地记录交叉核对，但这些未公开原记录不能由本仓库独立审计。第三方代码授权见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

后续测评以新的 `docs/experiments/YYYY-MM-DD-topic/` 目录追加，更新入口与实验索引，保留每轮独立方法和价格快照。原七组排序保存在[历史快照](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/references/ranking-initial-seven.html)。

总结的定价引用同时提供 [站内阅读页](https://313715295.github.io/ChatGPT-Test/experiments/2026-09-30-coastal-cat/references/pricing-notes.html) 和 [GitHub文字说明](docs/experiments/2026-09-30-coastal-cat/references/pricing-notes.md)，原官方链接保留在说明中。
