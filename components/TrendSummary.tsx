"use client";

import { History } from "@/lib/types";

function fmt(n: number) {
  return Math.abs(n).toLocaleString("es-PE");
}

function shortName(full: string) {
  const parts = full.split(" ");
  return parts.length >= 2 ? parts.slice(-2).join(" ") : full;
}

interface GapCard {
  label: string;
  nameA: string;
  nameB: string;
  currentGap: number;
  previousGap: number | null;
}

export default function TrendSummary({ history }: { history: History }) {
  if (history.length === 0) return null;

  const latest = history[history.length - 1];
  const previous = history.length >= 2 ? history[history.length - 2] : null;
  const top = latest.candidatos.slice(0, 5);

  const cards: GapCard[] = [];
  for (let i = 0; i < Math.min(3, top.length - 1); i++) {
    const a = top[i];
    const b = top[i + 1];
    const currentGap = a.votos - b.votos;

    let previousGap: number | null = null;
    if (previous) {
      const prevA = previous.candidatos.find((c) => c.codigo === a.codigo);
      const prevB = previous.candidatos.find((c) => c.codigo === b.codigo);
      if (prevA && prevB) previousGap = prevA.votos - prevB.votos;
    }

    cards.push({
      label: `${i + 1}° vs ${i + 2}°`,
      nameA: shortName(a.nombre),
      nameB: shortName(b.nombre),
      currentGap,
      previousGap,
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const change =
          card.previousGap !== null ? card.currentGap - card.previousGap : null;
        const isGrowing = change !== null && change > 0;
        const isShrinking = change !== null && change < 0;

        return (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-4 border-t-4"
            style={{
              borderColor:
                isGrowing ? "#22c55e" : isShrinking ? "#ef4444" : "#94a3b8",
            }}
          >
            <div className="text-xs text-gray-500 font-medium mb-1">
              {card.label} — Diferencia
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {fmt(card.currentGap)}
              </span>
              <span className="text-sm text-gray-500">votos</span>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              <span className="font-medium">{card.nameA}</span>
              {" vs "}
              <span className="font-medium">{card.nameB}</span>
            </div>
            {change !== null && (
              <div
                className={`mt-2 text-sm font-medium ${
                  isGrowing
                    ? "text-green-600"
                    : isShrinking
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {isGrowing ? "↑" : isShrinking ? "↓" : "→"}{" "}
                {change === 0
                  ? "Sin cambio"
                  : `${change > 0 ? "+" : "-"}${fmt(change)} vs anterior`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
