# Task finished notifications

Watches the session status every session already publishes and raises a system notification for two kinds of moments:

- a session stopped working — its run ended;
- a session started waiting for you — a question, a plan review, or an approval.

Subagent sessions stay quiet; only sessions you drive notify.

## What you see

Nothing is drawn inside the Harness window. The notification arrives in the operating system's notification area — on Windows, the bottom-right corner of the screen — so it reaches you whether Harness is in front of you or behind another window.

- "Run ended" — a run stopped. The card shows the session name underneath.
- "Waiting for your answer" — the session asked a question.
- "Waiting for your approval" — the session is blocked on a decision.

Clicking the notification brings the window forward and opens that session. Notifications share one tag, so the newest state of the app replaces the previous toast instead of piling up.

The notification keeps the sound the operating system plays for it; the bundle adds no chime of its own and no audio asset.

## Permission

The page needs the notification permission. The desktop app grants it without asking, while a plain browser asks on the first click and is never prompted twice.

## Scope

The notifier reads session status that the client already keeps; it adds no host-side work, storage, or network traffic. That snapshot says whether a session is running, not whether the run succeeded, so a notification reports that the run ended rather than claiming success. It also cannot report a task that finishes while Harness itself is closed.
