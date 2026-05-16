import { useCallback } from "react"
import { useAuth } from "@clerk/expo"
import { fetch as expoFetch } from "expo/fetch"

import { API_URL } from "./config"
import { createClientRateLimiter, parseRetryAfterSeconds } from "./client-rate-limit"

const apiRateLimiter = createClientRateLimiter()

export type ApiError = {
  status: number
  message: string
  body?: unknown
}

export class HttpError extends Error implements ApiError {
  status: number
  body?: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
    this.name = "HttpError"
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_URL}${normalized}`
}

async function parseError(response: Response): Promise<HttpError> {
  let body: unknown = null
  let message = response.statusText || `Request failed (${response.status})`
  try {
    const text = await response.text()
    if (text) {
      try {
        body = JSON.parse(text)
        const candidate =
          typeof body === "object" && body !== null
            ? (body as { error?: unknown; message?: unknown; retryAfter?: number })
            : null
        if (candidate && typeof candidate.error === "string") {
          message = candidate.error
        } else if (candidate && typeof candidate.message === "string") {
          message = candidate.message
        }
        if (response.status === 429 && candidate) {
          const retryAfter = parseRetryAfterSeconds(response, {
            retryAfter:
              typeof candidate.retryAfter === "number" ? candidate.retryAfter : undefined,
            error: typeof candidate.error === "string" ? candidate.error : undefined,
            message: typeof candidate.message === "string" ? candidate.message : undefined,
          })
          if (retryAfter) {
            message = `${message} Try again in ${retryAfter}s.`
          }
        }
      } catch {
        body = text
        if (text.length < 300) message = text
      }
    }
  } catch {
    /* empty */
  }
  return new HttpError(response.status, message, body)
}

export type AuthedFetch = (path: string, options?: RequestOptions) => Promise<Response>

function buildHeaders(token: string | null, options?: RequestOptions): Headers {
  const headers = new Headers(options?.headers ?? undefined)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (
    options?.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }
  return headers
}

function buildBody(options?: RequestOptions): BodyInit | undefined {
  if (options?.body === undefined || options.body === null) return undefined
  if (typeof options.body === "string") return options.body
  if (options.body instanceof FormData) return options.body
  return JSON.stringify(options.body)
}

export function useApi() {
  const { getToken, isSignedIn } = useAuth()

  const request = useCallback<AuthedFetch>(
    async (path, options) => {
      await apiRateLimiter.acquire()
      const token = isSignedIn ? await getToken() : null
      const url = buildUrl(path)
      const headers = buildHeaders(token, options)
      const body = buildBody(options)
      // expo/fetch supports response streaming on iOS and Android, which the
      // assistant chat needs. FormData multipart still goes through the
      // platform's standard fetch since expo/fetch's FormData support is more
      // limited.
      if (body instanceof FormData) {
        const headersObject: Record<string, string> = {}
        headers.forEach((value, key) => {
          headersObject[key] = value
        })
        return fetch(url, {
          method: options?.method,
          headers: headersObject,
          body,
          signal: options?.signal,
        })
      }
      const response = await expoFetch(url, {
        method: options?.method,
        headers,
        body: body as string | undefined,
        signal: options?.signal,
      })
      return response as unknown as Response
    },
    [getToken, isSignedIn]
  )

  const requestJson = useCallback(
    async <T>(path: string, options?: RequestOptions): Promise<T> => {
      const response = await request(path, options)
      if (!response.ok) {
        throw await parseError(response)
      }
      const text = await response.text()
      if (!text) return undefined as unknown as T
      try {
        return JSON.parse(text) as T
      } catch {
        return text as unknown as T
      }
    },
    [request]
  )

  return { request, requestJson }
}
