"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import ResultsTable from "@/components/ResultsTable";
import TrendSummary from "@/components/TrendSummary";
import DifferenceChart from "@/components/DifferenceChart";
import { History } from "@/lib/types";

export default function Home() {
  const [history, setHistory] = useState<History>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/data/history.json?t=" + Date.now());
      if (res.ok) {
        const data: History = await res.json();
        setHistory(data);
        setLastRefresh(new Date());
      }
    } catch {
      // Silently fail - data might not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#2971b9] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos electorales...</p>
        </div>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sin datos aún</h2>
          <p className="text-gray-600 mb-4">
            Ejecuta el scraper para obtener datos de ONPE:
          </p>
          <code className="bg-gray-100 px-4 py-2 rounded text-sm block">
            node scraper.js
          </code>
          <p className="text-xs text-gray-500 mt-3">
            El archivo history.json se generará en public/data/
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Header snapshot={latest} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Refresh indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {history.length} snapshot{history.length !== 1 ? "s" : ""} registrados
          </span>
          {lastRefresh && (
            <span>
              Última carga:{" "}
              {lastRefresh.toLocaleTimeString("es-PE", { timeZone: "America/Lima" })}
              {" · "}Auto-refresh cada 60s
            </span>
          )}
        </div>

        {/* Trend cards */}
        <TrendSummary history={history} />

        {/* Chart */}
        <DifferenceChart history={history} topN={5} />

        {/* Vote difference table between top candidates */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3">
            Diferencias entre candidatos principales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-left">
                  <th className="px-3 py-2">Candidato A</th>
                  <th className="px-3 py-2">vs</th>
                  <th className="px-3 py-2">Candidato B</th>
                  <th className="px-3 py-2 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {latest.candidatos.slice(0, 7).flatMap((a, i) =>
                  latest.candidatos.slice(i + 1, 7).map((b) => {
                    const diff = a.votos - b.votos;
                    return (
                      <tr key={`${a.codigo}-${b.codigo}`} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-1.5 font-medium">
                          {a.nombre
                            .split(" ")
                            .slice(-2)
                            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                            .join(" ")}
                        </td>
                        <td className="px-3 py-1.5 text-gray-400">vs</td>
                        <td className="px-3 py-1.5 font-medium">
                          {b.nombre
                            .split(" ")
                            .slice(-2)
                            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                            .join(" ")}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold text-green-700">
                          +{diff.toLocaleString("es-PE")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results table */}
        <ResultsTable candidatos={latest.candidatos} />

        {/* Historical timeline */}
        {history.length >= 2 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-3">
              Historial de snapshots
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-left">
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2 text-right">Actas %</th>
                    <th className="px-3 py-2 text-right">1° Votos</th>
                    <th className="px-3 py-2 text-right">2° Votos</th>
                    <th className="px-3 py-2 text-right">Brecha 1°-2°</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((snap, idx) => {
                    const c1 = snap.candidatos[0];
                    const c2 = snap.candidatos[1];
                    const gap = c1 && c2 ? c1.votos - c2.votos : 0;
                    return (
                      <tr key={snap.timestamp} className={`border-b ${idx === 0 ? "bg-blue-50 font-medium" : ""}`}>
                        <td className="px-3 py-1.5">
                          {new Date(snap.fechaOnpe).toLocaleString("es-PE", {
                            timeZone: "America/Lima",
                          })}
                        </td>
                        <td className="px-3 py-1.5 text-right">{snap.actasContabilizadas}%</td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {c1?.votos.toLocaleString("es-PE")}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {c2?.votos.toLocaleString("es-PE")}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">
                          {gap.toLocaleString("es-PE")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">
        Datos de ONPE · Actualización automática cada 60 segundos
      </footer>
    </div>
  );
}
