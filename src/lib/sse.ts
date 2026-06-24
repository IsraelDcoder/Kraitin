import ky, { type AfterResponseHook } from 'ky';
import { createParser } from 'eventsource-parser';

export interface SSEOptions {
  onData: (data: string) => void;
  onEvent?: (event: unknown) => void;
  onCompleted?: (error?: Error) => void;
  onAborted?: () => void;
}

export function createSSEHook(options: SSEOptions): AfterResponseHook {
  return async (request, _opts, response) => {
    if (!response.ok || !response.body) return;

    let done = false;
    const finish = (err?: Error) => {
      if (!done) { done = true; options.onCompleted?.(err); }
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf8');
    const parser = createParser({
      onEvent: (event) => {
        if (!event.data) return;
        options.onEvent?.(event);
        for (const chunk of event.data.split('\n')) options.onData(chunk);
      },
    });

    const read = (): void => {
      reader.read().then(({ done: streamDone, value }) => {
        if (streamDone) { finish(); return; }
        parser.feed(decoder.decode(value, { stream: true }));
        read();
      }).catch((err) => {
        if (request.signal.aborted) { options.onAborted?.(); return; }
        finish(err as Error);
      });
    };
    read();
    return response;
  };
}

export interface StreamRequestOptions {
  functionUrl: string;
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  /** Credits to deduct for this request (default: 5). Research=5, others=10. */
  credits?: number;
  supabaseAnonKey: string;
  accessToken?: string;
  onData: (data: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function sendAiSearchRequest(options: StreamRequestOptions): Promise<void> {
  const { functionUrl, contents, credits = 5, supabaseAnonKey, accessToken, onData, onComplete, onError, signal } = options;

  const sseHook = createSSEHook({
    onData,
    onCompleted: (err) => (err ? onError(err) : onComplete()),
    onAborted: () => {},
  });

  // Prefer the user's access token; fall back to anon key for public usage
  const authToken = accessToken ?? supabaseAnonKey;

  try {
    await ky.post(functionUrl, {
      json: { contents, credits },
      headers: {
        Authorization: `Bearer ${authToken}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      signal,
      timeout: 60000,
      hooks: { afterResponse: [sseHook] },
    });
  } catch (err) {
    if (!signal?.aborted) onError(err as Error);
  }
}
