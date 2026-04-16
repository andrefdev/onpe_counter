"use client";

import { Candidato } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("es-PE");
}

const TOP_COLORS = [
  "bg-yellow-50 border-l-4 border-yellow-400",
  "bg-gray-50 border-l-4 border-gray-400",
  "bg-orange-50 border-l-4 border-orange-400",
];

export default function ResultsTable({
  candidatos,
  topN = 15,
}: {
  candidatos: Candidato[];
  topN?: number;
}) {
  const shown = candidatos.slice(0, topN);
  const maxVotes = shown[0]?.votos || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-800">Resultados Presidenciales</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a3a5c] text-white text-left">
              <th className="px-3 py-2 w-10">#</th>
              <th className="px-3 py-2">Candidato</th>
              <th className="px-3 py-2 hidden md:table-cell">Partido</th>
              <th className="px-3 py-2 text-right">Votos</th>
              <th className="px-3 py-2 text-right w-20">%</th>
              <th className="px-3 py-2 hidden sm:table-cell w-40">Barra</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c, i) => (
              <tr
                key={c.codigo}
                className={`border-b hover:bg-blue-50 transition ${
                  i < 3 ? TOP_COLORS[i] : ""
                }`}
              >
                <td className="px-3 py-2 font-bold text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">
                    {c.nombre
                      .split(" ")
                      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                      .join(" ")}
                  </div>
                  <div className="text-xs text-gray-500 md:hidden">{c.partido}</div>
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs hidden md:table-cell max-w-48 truncate">
                  {c.partido}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {fmt(c.votos)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {(c.porcentaje || 0).toFixed(2)}%
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(c.votos / maxVotes) * 100}%`,
                        backgroundColor:
                          i === 0
                            ? "#2971b9"
                            : i === 1
                            ? "#5ba3e0"
                            : i === 2
                            ? "#8bc4f0"
                            : "#cbd5e1",
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
