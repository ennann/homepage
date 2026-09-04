# 简历网站视觉验收

**比较基准**

- 页面气质参考：`/Users/Ethan/.codex/generated_images/01a06b88-0138-78b2-af88-e7524dfcb3b6/exec-2865cc23-f57c-412c-a16d-75200faf227e.png`
- 独立产品布局参考：`/var/folders/p1/d1ljqlb17q3gxtrr4xw639p40000gp/T/codex-clipboard-1c21faf0-078b-40ab-bee6-9b297a2c7cbe.png`
- 排版与内容原则：`/Users/Ethan/Projects/LarkOffice/tmp/kami-reference/skills/kami/`
- 最终产品对照：`tmp/design-qa/product-source-vs-kami-final.png`
- 桌面全宽验收：`tmp/design-qa/resume-kami-wide.png`，浏览器视口 1280 × 720
- 桌面章节验收：`tmp/design-qa/resume-kami-agent-engineering.png`、`tmp/design-qa/resume-kami-product-compare.png`
- 手机验收：`tmp/design-qa/resume-kami-mobile-375.png`、`tmp/design-qa/resume-kami-mobile-cases-375.png`、`tmp/design-qa/resume-kami-mobile-products-375.png`，内嵌内容视口 375 × 812

**结论**

- 未发现仍需处理的 P0、P1 或 P2 问题。
- Kami 的暖纸色、墨蓝、中文衬线层级和减法设计原则已经进入网站；标题只使用 500 字重，正文保持舒展行高，不使用阴影、装饰竖线或合成粗体。
- 首屏、四项能力、客户项目、Agent 工程闭环、独立产品、工作经历和收尾形成连续叙事。Agent 不再只是技能词，而是通过上下文、工具、边界、验收、工作轨迹和人机分工表达具体判断。
- 一店一群与门店 AI 质检各自保留现场、判断、结果和个人角色，并新增独立的 `Agent 判断`；归因边界清楚，没有把团队成果写成个人独立完成。
- 独立产品使用真实截图，统一放进 4:3 框并采用 `object-fit: contain`，原始比例未变形、内容未裁切。
- 独立产品首行采用 20% 图片加项目摘要，详细说明、指标和链接使用整行；最终对照图确认信息结构与用户参考一致，图片下方没有残留空洞。
- About、PDF、邮箱和 GitHub 均使用 Lucide 图标与文字标签，链接名称和键盘可访问性未受影响。
- 1280 桌面视口未出现断行、溢出或列错位；375 手机视口正确切换为单列叙事，项目图片与摘要仍保持紧凑并排，正文和 `Agent 判断` 自动堆叠。

**有意保留的差异**

- 中文正文比概念稿略大、行距略松，以保证招聘者长时间阅读时的清晰度。
- 客户项目保持文字案例形式，因为目前没有适合公开使用的真实图片；未引入占位图或虚构素材。
- 网站吸收 Kami 的设计令牌和写作方法，但不照搬它的打印模板；网页保留锚点导航、真实产品截图和响应式能力，PDF 再使用严格两页 A4 结构。

**PDF 验收**

- 来源：`src/resume/kami/content.json` 与 `src/resume/kami/resume.html`；产物：`public/resume/yizhe-zhao-resume.pdf`。
- Kami 内容覆盖、占位符、样式、中文字体、密度和页面平衡检查全部通过。
- 最终为 2 页 A4，页面填充 83% / 90%，差值 7%；CJK 正文使用已嵌入的 TsangerJinKai02，共识别 1,705 个汉字。
- 两页已逐页查看，没有字体回退方框、乱码、裁切、重叠、孤立标题或异常断行。

**验收清单**

- [x] 保持图片原始比例并统一视觉高度
- [x] 产品图片占首行约 20%
- [x] 图片、编号、标题和短描述组成首行
- [x] 详细项目说明使用整行宽度
- [x] 四项能力的各列左对齐
- [x] 快捷入口使用真实图标库
- [x] 明确表达 Agent 认知、人机分工与生产边界
- [x] 1280 桌面视口通过
- [x] 375 手机视口通过
- [x] 静态构建通过
- [x] PDF 严格两页并通过 Kami 全套检查

**后续低优先级优化**

- P3：若未来获得可公开的客户现场图或架构图，可为两个企业案例各增加一张真实素材；继续避免装饰性占位图。

final result: passed
