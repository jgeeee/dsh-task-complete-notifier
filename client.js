/**
 * Client half of the task-complete notifier.
 *
 * Watches the Session UI status snapshot the Session Controller already
 * publishes and raises an operating-system notification when a Session stops
 * working or starts waiting for the user. Nothing is drawn inside the page and
 * no audio is synthesized: the notification keeps the sound the operating
 * system already plays for it.
 */
window.__ModuleLoader__.load({
  id: '@jgeeee/dsh-task-complete-notifier',
  factory(require) {
    const React = require('react')
    const NS = 'task-complete-notifier'

    /** Copy owned by this bundle; English is the fallback the locale chain lands on. */
    const dictionaries = {
      en: {
        statusDone: 'Run ended',
        statusQuestion: 'Waiting for your answer',
        statusApproval: 'Waiting for your approval',
        untitled: 'Session',
      },
      zh: {
        statusDone: '运行已结束',
        statusQuestion: '等待你的回答',
        statusApproval: '等待你的确认',
        untitled: '会话',
      },
    }

    /** Remembered so a reload does not re-ask a browser that already answered. */
    const PERMISSION_ASKED_KEY = 'dsh-task-complete-notifier:permission-asked'

    /** @returns whether this page can raise a desktop notification at all. */
    function notificationsSupported() {
      return typeof window !== 'undefined' && typeof window.Notification === 'function'
    }

    /** @returns whether the browser prompt was already shown from this profile. */
    function permissionAlreadyAsked() {
      try {
        return window.localStorage.getItem(PERMISSION_ASKED_KEY) === '1'
      } catch {
        // Storage refusal only costs a repeated silent request.
        return false
      }
    }

    /** @returns the granted Notification constructor, or null when none can show. */
    function grantedNotifier() {
      if (!notificationsSupported()) return null
      return window.Notification.permission === 'granted' ? window.Notification : null
    }

    /**
     * Ask for the desktop-notification permission once.
     * @param fromGesture - whether a click opened the door; a browser only
     * shows its prompt then, while the desktop shell grants without asking.
     */
    function requestDesktopPermission(fromGesture) {
      if (!notificationsSupported()) return
      if (window.Notification.permission !== 'default') return
      // Outside the desktop shell a prompt on page load would be noise.
      if (!fromGesture && !/Electron/i.test(navigator.userAgent)) return
      // A dismissed prompt leaves the permission at "default"; never nag again.
      if (permissionAlreadyAsked()) return
      try {
        try {
          window.localStorage.setItem(PERMISSION_ASKED_KEY, '1')
        } catch {
          // Same trade as above.
        }
        const pending = window.Notification.requestPermission()
        if (pending !== undefined && typeof pending.catch === 'function') pending.catch(() => {})
      } catch {
        // A refused permission simply means no notification is raised.
      }
    }

    /**
     * Raise one operating-system notification and bring the session forward
     * when the user clicks it.
     * @param title - notification heading, the state that just happened.
     * @param body - session label under the heading.
     * @param onActivate - run when the notification is clicked.
     */
    function notifyDesktop(title, body, onActivate) {
      const NotificationCtor = grantedNotifier()
      if (NotificationCtor === null) return
      try {
        const notice = new NotificationCtor(title, {
          body,
          // The operating system supplies the sound; the bundle stays silent.
          // One slot: the newest state of the app replaces the previous toast.
          tag: 'dsh-task-complete-notifier',
        })
        notice.onclick = () => {
          try {
            window.focus()
            onActivate()
          } finally {
            notice.close()
          }
        }
      } catch {
        // Best-effort: a refusing system notification layer is not our problem.
      }
    }

    /**
     * Frame-wide host: turns Session status transitions into notifications.
     * It renders nothing; the seat only exists to receive the status hooks.
     * @param props - runtime seats, the entry locale seat, and the opener.
     * @returns nothing.
     */
    function TaskCompleteNotifier({ t, useSessions, useSessionStatus, openSession }) {
      const statuses = useSessionStatus((snapshot) => snapshot)
      const rows = useSessions((state) => state.byId)
      const rowsRef = React.useRef({})
      const previousRef = React.useRef(new Map())
      const primedRef = React.useRef(false)

      React.useEffect(() => { rowsRef.current = rows ?? {} }, [rows])

      const statusOf = React.useCallback((kind) => (
        kind === 'done' ? t('statusDone') : kind === 'approval' ? t('statusApproval') : t('statusQuestion')
      ), [t])

      React.useEffect(() => {
        const previous = previousRef.current
        const next = new Map()
        const arrivals = []
        statuses.forEach((status, sessionId) => {
          const before = previous.get(sessionId)
          const interaction = status.pendingInteraction
          next.set(sessionId, {
            running: status.running === true,
            interaction: interaction === undefined ? undefined : interaction.key,
          })
          const row = rowsRef.current[sessionId]
          // Subagent rows finish constantly; only the Sessions the user drives notify.
          if (row !== undefined && row.origin === 'subagent') return
          if (interaction !== undefined) {
            if (interaction.key !== before?.interaction) {
              arrivals.push({ kind: interaction.kind === 'approval' ? 'approval' : 'question', sessionId })
            }
            return
          }
          if (before?.running === true && status.running === false) {
            arrivals.push({ kind: 'done', sessionId })
          }
        })
        previousRef.current = next
        // The first snapshot is a baseline: it must not replay whatever the
        // page reloaded into.
        if (!primedRef.current) {
          primedRef.current = true
          return
        }
        if (arrivals.length === 0) return
        for (const arrival of arrivals) {
          const row = rowsRef.current[arrival.sessionId]
          const title = row?.displayTitle ?? row?.title
          const label = typeof title === 'string' && title !== '' ? title : t('untitled')
          notifyDesktop(statusOf(arrival.kind), label, () => {
            requestDesktopPermission(true)
            try { window.focus() } catch { /* focus is best-effort */ }
            openSession(arrival.sessionId)
          })
        }
      }, [statuses, t, statusOf, openSession])

      return null
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'task-complete-notifier: dictionaries')
        ctx.effect(() => {
          // The desktop shell grants the permission without a prompt; a plain
          // browser is asked on the first click anywhere in the page.
          const timer = setTimeout(() => { requestDesktopPermission(false) }, 1500)
          return () => { clearTimeout(timer) }
        }, 'task-complete-notifier: notification permission')
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'task-complete-notifier',
          order: 100,
          locale: NS,
          inject: () => ({
            openSession: (sessionId) => { ctx.uiWorkspace.openSession(sessionId) },
          }),
        }, TaskCompleteNotifier))
      },
    }
  },
})
