import { useEffect, useState } from "react";
import { api } from "../api";
import { DIMENSIONS, SALIENCE_VALUES } from "../types";
import type { AnnotationStats } from "../types";

export function DiamondsStats() {
  const [stats, setStats] = useState<AnnotationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!stats) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Annotation statistics
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Aggregate scores across {stats.total} annotated conversation
          {stats.total === 1 ? "" : "s"}.
        </p>

        {stats.total === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
            No annotations yet. Annotate a conversation and come back.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIMENSIONS.map((dim) => {
              const data = stats.dimensions[dim.key];
              const max = Math.max(1, ...Object.values(data.salience_counts));
              return (
                <div
                  key={dim.key}
                  className="bg-white border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-diamond-600 font-bold text-base mr-2">
                        {dim.letter}
                      </span>
                      <span className="font-semibold">{dim.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Mean score</div>
                      <div className="text-lg font-semibold tabular-nums">
                        {data.mean_score.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-diamond-500"
                      style={{ width: `${data.mean_score * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">
                    Salience distribution
                  </div>
                  <div className="space-y-1">
                    {SALIENCE_VALUES.map((s) => {
                      const count = data.salience_counts[s];
                      const pct = (count / max) * 100;
                      return (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <span className="w-16 capitalize text-slate-600">
                            {s}
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-diamond-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right tabular-nums text-slate-600">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
