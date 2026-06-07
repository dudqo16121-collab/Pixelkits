type LogLevel = 'info' | 'warn' | 'error' | 'critical'

interface LogPayload {
  level:    LogLevel
  message:  string
  context?: Record<string, unknown>
  error?:   unknown
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return { raw: String(err) }
}

function log({ level, message, context, error }: LogPayload) {
  const timestamp = new Date().toISOString()
  const logData   = {
    timestamp,
    level,
    message,
    ...(context ? { context } : {}),
    ...(error   ? { error: serializeError(error) } : {}),
  }

  const output = JSON.stringify(logData)

  if (level === 'error' || level === 'critical') {
    console.error(output)
  } else if (level === 'warn') {
    console.warn(output)
  } else {
    console.log(output)
  }

  // critical — Slack 웹훅 알림
  if (level === 'critical' && process.env.SLACK_WEBHOOK_URL) {
    const contextStr = context ? JSON.stringify(context, null, 2) : ''
    fetch(process.env.SLACK_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: [
          `🚨 *[pixelkits CRITICAL]* ${message}`,
          contextStr ? `\`\`\`${contextStr}\`\`\`` : '',
          error      ? `*Error:* ${serializeError(error).message}` : '',
        ].filter(Boolean).join('\n'),
      }),
    }).catch(() => {}) // 슬랙 실패해도 무시
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) =>
    log({ level: 'info', message: msg, context: ctx }),

  warn: (msg: string, ctx?: Record<string, unknown>) =>
    log({ level: 'warn', message: msg, context: ctx }),

  error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) =>
    log({ level: 'error', message: msg, error: err, context: ctx }),

  critical: (msg: string, err?: unknown, ctx?: Record<string, unknown>) =>
    log({ level: 'critical', message: msg, error: err, context: ctx }),
}