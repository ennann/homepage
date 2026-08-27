---
title: "Token 用量是衡量 AI 协作的最佳指标"
date: "2026-04"
description: "我构建了一个自托管的 Token 追踪工具，用于跨设备统计真实的 AI 使用量——这里我想聊聊，为什么 Token 消耗量比任何其他指标都更能说明一个人对 AI 的掌握程度。"
lang: zh
tags: ["AI", "Token", "工具"]
---

前段时间有人问我，怎么判断一个人是真的在用 AI，还是只是说说而已。

我想了一下，答案不是「他订阅了多少工具」，也不是「他每天打开几次 ChatGPT」，而是：**他消耗了多少 Token。**

## Token 统计

然后我就让 Claude Code 帮我统计了一下，在这台 MacBook 上，过去半年里一共消耗了多少 Token。它很快给出了答案。

但我想到到一个问题——我平时有好几台设备都在跑这些 AI Agent：主力 MacBook、家里的 Mac mini，还有远程的 Linux 服务器。这些设备上分别运行着 Claude Code、Codex、Gemini CLI 等各种工具。

那么，**在所有设备所有的 Code Agent 里，我这个人到底消耗了多少 Token？**

这就是核心矛盾所在：每个工具各管各的日志，各自存在各自的机器上，没有一个地方能给出跨设备的全局视图。你看不到全貌，就没法做任何有意义的判断。

而且，比「现在消耗了多少」更重要的一件事是：**把这些数据永久记录下来**。Token 消耗量是你与 AI 协作深度的真实历史——它会随你的工作方式演进，会反映你某段时期的专注方向，也会告诉你某个工具是否真的融入了你的工作流。这份记录，值得被留存。

<iframe src="https://aiusage.yizhe.me/embed?widget=stats-row1&items=0,1,2,3&transparent=true" width="100%" height="100" frameborder="0"></iframe>



## 构建 AIUsage

带着这个问题，我开始让 Cloud Code 帮我构建我的 AI Token Usage 统计工具。

核心思路很简单：在每台设备上运行一个本地扫描器，读取 AI 工具的会话日志，提取 Token 等其他数据，通过 Cloudflare Worker 同步到统一的数据库。所有设备的数据最终汇聚到同一个 Dashboard，按时间、工具、模型维度可视化。

整个系统完全自托管。Worker 和数据库全都在你自己的 Cloudflare 账户下（免费套餐足够用），没有任何第三方持有你的数据。

因为我真的太喜欢 Cloudflare 了，所以我现在的所有项目，第一时间都要考虑使用 Cloudflare。

![AIUsage Dashboard 首屏](./dashboard.png)



## 如何使用

在把这个项目的基本功能全部完成后，我意识到一个事情：现在做工具，第一要考虑的不是文档写得多详细，而是 **AI 是否能直接理解并执行**。

人阅读文档，然后理解，然后操作——这条路越来越长。更好的做法是让你的 Code Agent 直接来做。项目的结构、配置逻辑、部署步骤，只要写成 AI 能读懂的形式，用户根本不需要知道背后的细节。

AIUsage 的部署就是这样设计的。你不需要读任何文档，直接把这条指令发给你的 Code Agent：

```
Clone https://github.com/imetn/aiusage.git, read skills/aiusage-server/aiusage-server.md,
and help me deploy AIUsage to my Cloudflare account.
After the server is up, follow skills/aiusage-cli/aiusage-cli.md to connect this device.
```

Agent 会自己读项目里的部署指引，完成 Worker 创建、D1 数据库初始化、CLI 设备注册的全部流程。你只需要等它完成。

当然，前提是你得准备好一个 Cloudflare 的账号😊。

## 把数据嵌入任何地方

Dashboard 是给自己看的，但有时候你会想把数据分享出去，或者直接展示在自己的博客、个人主页上。AIUsage 为此内置了一些 Widget 小组件系统——任何页面都可以通过一个 `<iframe>` 嵌入实时数据，无需额外配置，无需登录。

比如我当前的 Token 消耗趋势，就直接展示在这里：

<iframe src="https://aiusage.yizhe.me/embed?widget=cost-trend&locale=zh&range=30d&theme=auto&transparent=true" width="100%" height="360" frameborder="0"></iframe>



各工具、模型、设备的占比分布：

<iframe src="https://aiusage.yizhe.me/embed?widget=share&locale=zh&range=30d&item=0,1&theme=auto&transparent=true" frameborder="0"></iframe>

最后是我最喜欢的一张图——Token 流向图。它能直观地告诉你，哪些模型在处理哪些项目，消耗是如何分配的：

<iframe src="https://aiusage.yizhe.me/embed?widget=flow&locale=zh&theme=auto&transparent=true" width="100%" height="620" frameborder="0"></iframe>

这些数据都是我的真是的实时数据，来自我自己部署的 AIUsage 实例。你也可以把同样的组件嵌入到你的博客或网站里，一行 HTML 搞定。



## 最后

这个项目对我来说最有价值的地方，不是 Dashboard 有多好看，而是它在默默地把每一天的数据存下来。

换了新 MacBook，没关系；某个工具不用了，也没关系——历史记录还在，完整地留在你自己的数据库里。这份积累会随时间变得越来越有意思。


如果你只想先看看本机的用量，两行命令就够了，不需要部署任何服务端：

```bash
npm i -g @aiusage/cli
aiusage report
```

如果想要跨设备同步、Dashboard 可视化、Widget 嵌入这些功能，把上面那条指令发给你的 Code Agent，十分钟内就能跑起来。

- **GitHub**：[github.com/imetn/aiusage](https://github.com/imetn/aiusage)
- **在线演示**：[aiusage.yizhe.me](https://aiusage.yizhe.me)

如果觉得这个项目不错，也欢迎你在 GitHub 帮我点个 Star。

<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.source === 'aiusage-embed' && e.data.height) {
    document.querySelectorAll('iframe').forEach(function(f) {
      try {
        var url = new URL(f.src, location.origin);
        if (url.searchParams.get('widget') === e.data.widget) {
          f.style.height = e.data.height + 'px';
        }
      } catch(err) {}
    });
  }
});
</script>
