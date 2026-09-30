# 定价与Fast计算依据

快照日期：2026-09-30。本页摘录本次计算实际使用的参数和方法，供不方便访问外部官方站点的读者核对；不是对官方整篇文档的复制。

| 模型 | 未缓存输入 / 百万Token | 缓存输入 / 百万Token | 输出 / 百万Token | Standard credits分别对应 |
| --- | ---: | ---: | ---: | --- |
| GPT-6 Astra | $10 | $1 | $50 | 250 / 25 / 1250 |
| GPT-6.1 Sol | $2 | $0.10 | $10 | 50 / 2.5 / 250 |

成本公式：`((input_tokens − cached_input_tokens) × 未缓存输入价 + cached_input_tokens × 缓存价 + output_tokens × 输出价) / 1,000,000`。推理Token包含在输出中，不重复加算。本轮每次输入低于272K；缓存写入记录均为0。费用为公开文本Token价格折算，不是实际账单。

Fast相对Standard：API价格和已购credits按2倍折算，Codex套餐内额度按2.5倍消耗。消耗倍率不能作为提速倍率。本轮没有Fast重复实测，原service_tier也未记录。

时间情景：`(T − M) + M/s`。T为原任务实际墙钟用时，M为记录估算的模型响应窗口，s是设定加速倍数；工具等其余时间保持不变。M包含排队及网络等待，不能视为独立测出的纯推理时间。官方API延迟说明不能直接证明本轮Codex任务会快同样倍数。

原始官方来源（2026-09-30重新打开核查）：

1. [GPT-6.1 Sol模型与价格](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
2. [GPT-6 Astra模型与价格](https://developers.openai.com/api/docs/models/gpt-6-astra)
3. [Codex / Work定价与credits](https://learn.chatgpt.com/docs/pricing)
4. [Codex Fast速度配置及额度倍率](https://learn.chatgpt.com/docs/agent-configuration/speed)
5. [API Fast延迟说明](https://developers.openai.com/api/docs/guides/fast-mode)

外链在本次检查中可访问，但访问仍受读者网络与站点变化影响。计算参数同时保留在本仓库的 `data/pricing.json`，本轮价格快照不会随官方网页后续更新而自动改变。
