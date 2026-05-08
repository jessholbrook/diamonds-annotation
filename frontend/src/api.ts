import type {
  Annotation,
  AnnotationInput,
  AnnotationStats,
  Conversation,
  ConversationDetail,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listConversations: () => request<Conversation[]>("/api/conversations"),
  getConversation: (id: string) => request<ConversationDetail>(`/api/conversations/${id}`),
  deleteConversation: (id: string) =>
    request<void>(`/api/conversations/${id}`, { method: "DELETE" }),
  saveAnnotation: (conversationId: string, payload: AnnotationInput) =>
    request<Annotation>(`/api/annotations/${conversationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAnnotation: (conversationId: string) =>
    request<void>(`/api/annotations/${conversationId}`, { method: "DELETE" }),
  stats: () => request<AnnotationStats>("/api/annotations/stats"),
};

export type ChatStreamEvent =
  | {
      type: "start";
      conversation_id: string;
      user_message_id: string;
      assistant_message_id: string;
      is_new_conversation: boolean;
    }
  | { type: "delta"; text: string }
  | { type: "end"; created_at: string }
  | { type: "error"; message: string };

export async function* streamChat(
  message: string,
  conversationId: string | null,
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = chunk
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const json = dataLine.slice(6);
      try {
        yield JSON.parse(json) as ChatStreamEvent;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
