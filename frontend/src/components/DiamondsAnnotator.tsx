import { useEffect, useState } from "react";
import { DIMENSIONS, SALIENCE_VALUES } from "../types";
import type { Annotation, AnnotationInput, DimensionKey, Salience } from "../types";

const EMPTY_INPUT: AnnotationInput = {
  duty: { score: 0, salience: "none" },
  intellect: { score: 0, salience: "none" },
  adversity: { score: 0, salience: "none" },
  mating: { score: 0, salience: "none" },
  positivity: { score: 0, salience: "none" },
  negativity: { score: 0, salience: "none" },
  deception: { score: 0, salience: "none" },
  sociality: { score: 0, salience: "none" },
  notes: "",
};

interface Props {
  disabled: boolean;
  existing: Annotation | null;
  onSave: (payload: AnnotationInput) => Promise<void>;
  onClear?: () => Promise<void>;
}

export function DiamondsAnnotator({ disabled, existing, onSave, onClear }: Props) {
  const [draft, setDraft] = useState<AnnotationInput>(EMPTY_INPUT);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      const next: AnnotationInput = { ...EMPTY_INPUT, notes: existing.notes };
      for (const dim of DIMENSIONS) {
        next[dim.key] = existing[dim.key];
      }
      setDraft(next);
      setSavedAt(existing.updated_at);
    } else {
      setDraft(EMPTY_INPUT);
      setSavedAt(null);
    }
    setError(null);
  }, [existing]);

  const updateDimension = (key: DimensionKey, patch: Partial<{ score: number; salience: Salience }>) => {
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!onClear || !existing) return;
    if (!confirm("Delete this annotation?")) return;
    setSaving(true);
    try {
      await onClear();
      setDraft(EMPTY_INPUT);
      setSavedAt(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-96 shrink-0 border-l border-slate-200 bg-slate-50 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h2 className="text-sm font-semibold tracking-tight">DIAMONDS Annotation</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Score this conversation across 8 dimensions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {disabled && (
          <div className="text-sm text-slate-500 italic">
            Send some messages first, then annotate.
          </div>
        )}

        {DIMENSIONS.map((dim) => {
          const value = draft[dim.key];
          return (
            <div key={dim.key} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-diamond-600 font-bold text-sm">{dim.letter}</span>
                  <span className="font-medium text-sm">{dim.label}</span>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {value.score.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{dim.description}</p>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value.score}
                disabled={disabled}
                onChange={(e) =>
                  updateDimension(dim.key, { score: parseFloat(e.target.value) })
                }
                className="w-full accent-diamond-600"
              />
              <div className="flex gap-1 mt-2">
                {SALIENCE_VALUES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateDimension(dim.key, { salience: s })}
                    disabled={disabled}
                    className={`flex-1 text-xs py-1 rounded border transition capitalize ${
                      value.salience === s
                        ? "bg-diamond-600 text-white border-diamond-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Notes
          </label>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            disabled={disabled}
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-diamond-500/40 focus:border-diamond-500 disabled:opacity-50"
            placeholder="Optional rationale, context, edge cases…"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 p-3 bg-white">
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={disabled || saving}
            className="flex-1 bg-diamond-600 text-white text-sm font-medium py-2 rounded-md hover:bg-diamond-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving…" : existing ? "Update" : "Save annotation"}
          </button>
          {existing && (
            <button
              onClick={clear}
              disabled={saving}
              className="px-3 text-sm text-slate-500 hover:text-red-500 disabled:opacity-40"
              title="Delete annotation"
            >
              Delete
            </button>
          )}
        </div>
        {savedAt && (
          <div className="text-xs text-slate-400 mt-1.5 text-center">
            Saved {new Date(savedAt).toLocaleString()}
          </div>
        )}
      </div>
    </aside>
  );
}
