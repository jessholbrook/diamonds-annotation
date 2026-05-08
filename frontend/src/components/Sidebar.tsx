import type { Conversation } from "../types";

interface Props {
  conversations: Conversation[];
  currentId: string | null;
  view: "chat" | "stats";
  onSelect: (id: string) => void;
  onNew: () => void;
  onShowStats: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  currentId,
  view,
  onSelect,
  onNew,
  onShowStats,
  onDelete,
}: Props) {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span className="text-diamond-600">◆</span>
          DIAMONDS
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Annotate LLM conversations</p>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <button
          onClick={onNew}
          className="w-full text-sm font-medium py-2 px-3 rounded-md bg-diamond-600 text-white hover:bg-diamond-700 transition"
        >
          + New chat
        </button>
        <button
          onClick={onShowStats}
          className={`w-full text-sm font-medium py-2 px-3 rounded-md border transition ${
            view === "stats"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Stats
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-slate-400">
          Conversations
        </div>
        {conversations.length === 0 ? (
          <div className="px-2 py-3 text-sm text-slate-400">No conversations yet.</div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  onClick={() => onSelect(c.id)}
                  className={`w-full text-left text-sm px-2 py-2 rounded-md truncate transition ${
                    view === "chat" && currentId === c.id
                      ? "bg-diamond-50 text-diamond-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title={c.title}
                >
                  {c.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${c.title}"?`)) onDelete(c.id);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs px-1.5"
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
