import { notifyUnauthorized } from './client';

export class StreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StreamError';
  }
}

/**
 * POST qui lit une réponse Server-Sent Events.
 * EventSource ne gère que le GET : on lit le flux de fetch et on découpe les blocs « data: ».
 */
export async function postEventStream<T>(
  path: string,
  body: unknown,
  onEvent: (event: T) => void,
  signal?: AbortSignal,
) {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    if (response.status === 401) notifyUnauthorized();
    const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message;
    throw new StreamError(message ?? 'Une erreur est survenue', response.status);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6))
        .join('\n');
      if (data) onEvent(JSON.parse(data) as T);
    }
  }
}
