import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { Composer } from "./components/Composer";
import { DiamondsAnnotator } from "./components/DiamondsAnnotator";
import { DiamondsStats } from "./components/DiamondsStats";
import { api, streamChat } from "./api";
import type {
  Annotation,
  AnnotationInput,
  Conversation,
  ConversationDetail,
  Message,
} from "./types";

type View = "chat" | "stats";

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [view, setView] = useState<View>("chat");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await api.listConversations();
      setConversations(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (!currentId) {
      setDetail(null);
      return;
    }
    api
      .getConversation(currentId)
      .then(setDetail)
      .catch((e) => setError(String(e)));
  }, [currentId]);

  const handleNew = () => {
    setCurrentId(null);
    setDetail(null);
    setStreamingText(null);
    setView("chat");
  };

  const handleSelect = (id: string) => {
    setCurrentId(id);
    setStreamingText(null);
    setView("chat");
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteConversation(id);
      if (currentId === id) {
        setCurrentId(null);
        setDetail(null);
      }
      await refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSend = async (text: string) => {
    setSending(true);
    setError(null);
    setStreamingText("");

    let convId = currentId;
    let userMsg: Message | null = null;
    let assistantMsgId: string | null = null;
    let assistantText = "";

    try {
      for await (const evt of streamChat(text, currentId)) {
        if (evt.type === "start") {
          convId = evt.conversation_id;
          assistantMsgId = evt.assistant_message_id;
          userMsg = {
            id: evt.user_message_id,
            conversation_id: evt.conversation_id,
            role: "user",
            content: text,
            created_at: new Date().toISOString(),
          };
          if (evt.is_new_conversation) {
            setCurrentId(evt.conversation_id);
          }
          setDetail((d) => {
            if (!d || d.id !== evt.conversation_id) {
              return {
                id: evt.conversation_id,
                title: text.slice(0, 60),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                messages: [userMsg!],
                annotation: null,
              };
            }
            return { ...d, messages: [...d.messages, userMsg!] };
          });
        } else if (evt.type === "delta") {
          assistantText += evt.text;
          setStreamingText(assistantText);
        } else if (evt.type === "end") {
          if (assistantMsgId && convId) {
            const finalMsg: Message = {
              id: assistantMsgId,
              conversation_id: convId,
              role: "assistant",
              content: assistantText,
              created_at: evt.created_at,
            };
            setDetail((d) =>
              d ? { ...d, messages: [...d.messages, finalMsg] } : d,
            );
          }
        } else if (evt.type === "error") {
          setError(evt.message);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStreamingText(null);
      setSending(false);
      await refreshConversations();
    }
  };

  const handleSaveAnnotation = async (payload: AnnotationInput) => {
    if (!currentId) return;
    const saved: Annotation = await api.saveAnnotation(currentId, payload);
    setDetail((d) => (d ? { ...d, annotation: saved } : d));
  };

  const handleClearAnnotation = async () => {
    if (!currentId) return;
    await api.deleteAnnotation(currentId);
    setDetail((d) => (d ? { ...d, annotation: null } : d));
  };

  const messages = detail?.messages ?? [];
  const canAnnotate = !!currentId && messages.length > 0;

  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        view={view}
        onSelect={handleSelect}
        onNew={handleNew}
        onShowStats={() => setView("stats")}
        onDelete={handleDelete}
      />
      <main className="flex-1 flex h-full min-w-0">
        {view === "stats" ? (
          <DiamondsStats />
        ) : (
          <>
            <div className="flex-1 flex flex-col h-full min-w-0">
              {error && (
                <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2 flex justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="font-medium">
                    Dismiss
                  </button>
                </div>
              )}
              <Chat messages={messages} streamingText={streamingText} />
              <Composer disabled={sending} onSend={handleSend} />
            </div>
            <DiamondsAnnotator
              disabled={!canAnnotate}
              existing={detail?.annotation ?? null}
              onSave={handleSaveAnnotation}
              onClear={handleClearAnnotation}
            />
          </>
        )}
      </main>
    </div>
  );
}
