"use client";

import { useEffect, useState } from "react";

type Row = { from: string; to: string; rate: number; date: string };

export default function FxPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/fx/list", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  }

  async function syncNow() {
    setSyncing(true);
    await fetch("/api/fx/fetch", { method: "POST" });
    await load();
    setSyncing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">FX Rates</h1>
        <button onClick={syncNow} disabled={syncing} className="rounded-md border px-4 py-2">
          {syncing ? "Updating…" : "Update (Sync)"}
        </button>
      </div>

      {loading ? <p>Loading…</p> : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">From</th>
              <th className="p-2 text-left">To</th>
              <th className="p-2 text-left">Rate</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.from}</td>
                <td className="p-2">{r.to}</td>
                <td className="p-2">{r.rate}</td>
                <td className="p-2">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}