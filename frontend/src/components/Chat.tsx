import { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { Message as MessageType } from "../types";

interface Props {
  messages: MessageType[];
  streamingText: string | null;
}

export function Chat({ messages, streamingText }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  if (messages.length === 0 && streamingText === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div className="max-w-md">
          <div className="text-4xl text-diamond-500 mb-3">◆</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Start a conversation
          </h2>
          <p className="text-sm text-slate-500">
            Chat with Claude, then annotate the conversation across the 8 DIAMONDS
            dimensions in the panel on the right.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {messages.map((m) => (
          <Message key={m.id} role={m.role} content={m.content} />
        ))}
        {streamingText !== null && (
          <Message
            role="assistant"
            content={streamingText || "…"}
            streaming
          />
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
