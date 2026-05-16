export type StreamEvent =
  | { type: "start"; contextMode?: string; chatId?: string | null }
  | { type: "text"; delta: string; accumulated: string }
  | { type: "metadata"; payload: unknown }
  | {
      type: "done"
      actions?: unknown
      sources?: unknown
      webCitations?: unknown
      model?: string
    }
  | { type: "error"; message: string }
  | { type: "rate_limited"; retryAfterSeconds?: number | null }

export type StreamHandlers = {
  onStart?: (event: Extract<StreamEvent, { type: "start" }>) => void
  onText?: (event: Extract<StreamEvent, { type: "text" }>) => void
  onDone?: (event: Extract<StreamEvent, { type: "done" }>) => void
  onError?: (message: string) => void
  onRateLimited?: (retryAfterSeconds: number | null) => void
}

function parseSseChunk(buffer: string): { events: StreamEvent[]; remainder: string } {
  const events: StreamEvent[] = []
  let working = buffer
  let idx: number
  while ((idx = working.indexOf("\n\n")) !== -1) {
    const block = working.slice(0, idx).trim()
    working = working.slice(idx + 2)
    if (!block) continue
    const dataLines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("data:"))
    if (dataLines.length === 0) continue
    const dataStr = dataLines.map((l) => l.replace(/^data:\s*/, "")).join("\n")
    if (dataStr === "[DONE]") continue
    try {
      const parsed = JSON.parse(dataStr) as StreamEvent
      events.push(parsed)
    } catch {
      /* swallow malformed chunk */
    }
  }
  return { events, remainder: working }
}

/**
 * Reads an SSE response stream and dispatches typed events.
 * Falls back to a single onError("Stream not readable") if `response.body` is null.
 */
export async function consumeAssistantStream(
  response: Response,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    let message = `Stream failed (${response.status})`
    try {
      const j = JSON.parse(text) as { error?: unknown }
      if (typeof j?.error === "string") message = j.error
    } catch {
      if (text && text.length < 300) message = text
    }
    handlers.onError?.(message)
    return
  }

  if (!response.body) {
    handlers.onError?.("Stream not readable on this platform.")
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel().catch(() => undefined)
        return
      }
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const { events, remainder } = parseSseChunk(buffer)
      buffer = remainder
      for (const event of events) {
        if (signal?.aborted) {
          await reader.cancel().catch(() => undefined)
          return
        }
        switch (event.type) {
          case "start":
            handlers.onStart?.(event)
            break
          case "text":
            handlers.onText?.(event)
            break
          case "done":
            handlers.onDone?.(event)
            break
          case "error":
            handlers.onError?.(event.message)
            break
          case "rate_limited":
            handlers.onRateLimited?.(event.retryAfterSeconds ?? null)
            break
        }
      }
    }
    if (!signal?.aborted && buffer.trim().length > 0) {
      const { events } = parseSseChunk(buffer + "\n\n")
      for (const event of events) {
        if (signal?.aborted) return
        if (event.type === "text") handlers.onText?.(event)
        else if (event.type === "done") handlers.onDone?.(event)
        else if (event.type === "error") handlers.onError?.(event.message)
      }
    }
  } catch (error) {
    if (signal?.aborted) return
    const msg = error instanceof Error ? error.message : "Stream interrupted."
    handlers.onError?.(msg)
  }
}
