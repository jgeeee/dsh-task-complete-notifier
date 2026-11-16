# DSH Task Complete Notifier

English | [简体中文](README.md)

A client plugin for [DeepSeek Harness](https://github.com/deepseek-ai): whenever a run ends, a session asks you a question, or waits for your approval, it raises an **operating-system notification** (bottom-right of the screen on Windows). Nothing is drawn inside the page; the notification keeps the system's own sound.

## Behavior

| Moment | Notification title | Body |
| --- | --- | --- |
| A run ended | Run ended | session name |
| A question is waiting | Waiting for your answer | session name |
| An approval is waiting | Waiting for your approval | session name |

- Subagent sessions stay quiet; only sessions you drive notify.
- Clicking the notification focuses the window and opens that session.
- Notifications share one tag, so the newest state replaces the previous one instead of piling up.
- The first snapshot is only a baseline; reloading the page does not replay old events.

## Install

Requires DeepSeek Harness 0.2.2-rc.3 (desktop build). The plugin is a Cordis bundle.

```text
plugin_manager → action: install_bundle → target: <absolute path to this directory>
```

Or install by published package name (after publishing):

```text
plugin_manager → action: install_bundle → target: @<scope>/dsh-task-complete-notifier@1.0.0
```

Refresh the page after installing (the package is linked into the profile, so edits to the source are picked up on the next refresh).

## How it works

- Registers into the `shell.overlay` slot and reads session snapshots through the injected `useSessionStatus` / `useSessions` props (the DSH client has no "run finished" event, so snapshots are compared).
- Completion: `running` goes from `true` to `false`.
- Question / approval: `pendingInteraction.key` differs from the previous snapshot.
- Notification: the `Notification` API, title is the state and body is the session name, sent only when permission is `granted`.
- The desktop shell grants notification permission automatically; a plain browser asks once after the first click and remembers the answer in `localStorage`.

> The client only exposes whether a session is running, not whether it succeeded, so the completion notice says "Run ended" rather than claiming success.

## Limitations

- Depends on the DSH `0.2.2-rc.3` client session snapshot API (an internal contract); a DSH upgrade may break it.
- If notification permission is denied it does not fall back to an in-page notice (intentionally: system notifications only).
- Runs that finish while Harness is closed cannot be reported later.
- A page that has never been clicked or typed into may be blocked from showing notifications by the engine.

## License

[MIT](LICENSE)
