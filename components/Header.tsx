"use client";

import { Snapshot } from "@/lib/types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("es-PE", { timeZone: "America/Lima" });
}

export default function Header({ snapshot }: { snapshot: Snapshot | null }) {
  if (!snapshot) return null;

  const pct = snapshot.actasContabilizadas;

  return (
    <header className="bg-[#1a3a5c] text-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Elecciones Generales 2026
            </h1>
            <p className="text-blue-200 text-sm">
              Elección de Fórmula Presidencial — Tracker
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-sm text-blue-200">
                ONPE actualizado: {formatDate(snapshot.fechaOnpe)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>
                Actas: {snapshot.contabilizadas.toLocaleString("es-PE")}/
                {snapshot.totalActas.toLocaleString("es-PE")}
              </span>
              <span className="font-bold text-lg text-[#d4a843]">{pct}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-2 bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4a843] rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
