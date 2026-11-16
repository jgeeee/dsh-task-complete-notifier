# DSH 任务完成通知 / Task Complete Notifier

[DeepSeek Harness](https://github.com/deepseek-ai) 的客户端插件：每当一轮任务结束、会话向你提问、或等待你确认时，在**系统通知区域**（Windows 屏幕右下角）弹出一条通知。页面内不画任何东西，声音使用操作系统自带的提示音。

A DeepSeek Harness client plugin that raises an **operating-system notification** whenever a run ends, a session asks a question, or waits for approval. Nothing is drawn inside the page; the system notification keeps its own sound.

## 行为 / Behavior

| 时刻 / Moment | 通知标题 / Title | 正文 / Body |
| --- | --- | --- |
| 一轮运行结束 / a run ended | 运行已结束 · `Run ended` | 会话名 / session name |
| 向你提问 / a question is waiting | 等待你的回答 · `Waiting for your answer` | 会话名 / session name |
| 等待授权 / an approval is waiting | 等待你的确认 · `Waiting for your approval` | 会话名 / session name |

- 子代理会话保持安静，只有你自己驱动的会话会通知。/ Subagent sessions stay quiet.
- 点击通知：窗口置顶并打开对应会话。/ Clicking the notification focuses the window and opens that session.
- 所有通知共用一个 tag，新状态替换旧通知，不会堆积。/ Notifications share one tag, so the newest state replaces the previous one.
- 首帧快照只作为基线，刷新页面不会重放历史事件。/ The first snapshot is a baseline; reloading does not replay old events.

## 安装 / Install

Requires DeepSeek Harness 0.2.2-rc.3 (desktop build). The plugin is a Cordis bundle.

```text
plugin_manager → action: install_bundle → target: <absolute path to this directory>
```

或以已发布的包名安装（发布后）：

```text
plugin_manager → action: install_bundle → target: @<scope>/dsh-task-complete-notifier@1.0.0
```

安装后刷新页面即可生效（本包以 `link:` 方式装入 profile，改源码后刷新即加载新代码）。

## 实现说明 / How it works

- 订阅 `shell.overlay` 槽位，从槽位注入的 `useSessionStatus` / `useSessions` 读取会话状态快照（DSH 客户端没有“任务完成”事件，只能比较快照）。
- 完成判定：`running` 由 `true` 变为 `false`。
- 提问/授权判定：`pendingInteraction.key` 与上一快照不同。
- 通知：`Notification` API，标题为状态、正文为会话名；仅在权限为 `granted` 时发送。
- 桌面壳会自动授予通知权限；普通浏览器在首次点击后询问一次，并用 `localStorage` 记住不再重复打扰。

> 客户端只暴露“是否在运行”，拿不到成功/失败，因此完成通知写“运行已结束”，不谎称成功。

## 已知限制 / Limitations

- 依赖 DSH `0.2.2-rc.3` 的客户端会话快照 API（内部契约），DSH 升级后可能失效。
- 通知权限被拒时不会退回页面内提示（这是有意的：只弹系统通知）。
- Harness 关闭期间结束的任务无法补报。
- 页面从未被点击/按键过时，浏览器/引擎可能不显示通知（自动播放与权限策略）。

## 许可 / License

MIT
