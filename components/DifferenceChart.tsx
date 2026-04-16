"use client";

import { History } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#2971b9", "#e74c3c", "#27ae60", "#f39c12", "#8e44ad"];

function shortName(full: string) {
  const parts = full.split(" ");
  return parts.length >= 2 ? parts.slice(-2).join(" ") : full;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function fmt(n: number) {
  return n.toLocaleString("es-PE");
}

export default function DifferenceChart({
  history,
  topN = 5,
}: {
  history: History;
  topN?: number;
}) {
  if (history.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        <p className="text-lg">Necesita al menos 2 snapshots para el gráfico de tendencias</p>
        <p className="text-sm mt-1">
          Ejecuta el scraper varias veces para acumular datos históricos
        </p>
      </div>
    );
  }

  const latest = history[history.length - 1];
  const topCandidates = latest.candidatos.slice(0, topN);
  const leader = topCandidates[0];

  // Build chart data: difference of each candidate vs the leader
  const chartData = history.map((snap) => {
    const row: Record<string, string | number> = {
      time: formatTime(snap.fechaOnpe),
      actas: snap.actasContabilizadas,
    };

    for (let i = 1; i < topCandidates.length; i++) {
      const target = topCandidates[i];
      const leaderSnap = snap.candidatos.find((c) => c.codigo === leader.codigo);
      const targetSnap = snap.candidatos.find((c) => c.codigo === target.codigo);
      if (leaderSnap && targetSnap) {
        row[shortName(target.nombre)] = leaderSnap.votos - targetSnap.votos;
      }
    }

    return row;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="mb-3">
        <h2 className="font-semibold text-gray-800">
          Diferencia de votos vs {shortName(leader.nombre)} (1°)
        </h2>
        <p className="text-xs text-gray-500">Evolución temporal de la brecha</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => fmt(v)}
            width={90}
          />
          <Tooltip
            formatter={(value) => [
              fmt(Number(value)) + " votos",
            ]}
            labelFormatter={(label) => `Hora: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {topCandidates.slice(1).map((c, i) => (
            <Line
              key={c.codigo}
              type="monotone"
              dataKey={shortName(c.nombre)}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
