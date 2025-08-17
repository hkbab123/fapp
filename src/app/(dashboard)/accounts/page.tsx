"use client";

import { useEffect, useMemo, useState } from "react";

type AccountRow = {
  id: string;
  name: string;
  typeCode: string;
  currencyCode: string;
  openingMinor: number | null;
  institution: string | null;
  notes: string | null;
  archived: number | boolean; // sqlite int (0/1) or boolean
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "asset.cash", label: "Cash" },
  { value: "asset.bank.checking", label: "Bank — Checking" },
  { value: "asset.bank.savings", label: "Bank — Savings" },
];

const CCY_OPTIONS = ["AED", "USD", "INR"];

export default function AccountsPage() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [typeCode, setTypeCode] = useState<string>(TYPE_OPTIONS[1].value);
  const [currencyCode, setCurrencyCode] = useState<string>(CCY_OPTIONS[0]);
  const [openingMinor, setOpeningMinor] = useState<string>("0");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");

  const active = useMemo(
    () => rows.filter((r) => Number(r.archived) === 0),
    [rows]
  );
  const archived = useMemo(
    () => rows.filter((r) => Number(r.archived) === 1),
    [rows]
  );

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: AccountRow[] = await res.json();
      setRows(data);
    } catch (e: any) {
      setErrorMsg(`Failed: ${e?.message ?? "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      typeCode,
      currencyCode,
      openingMinor: Number.isFinite(Number(openingMinor))
        ? Number(openingMinor)
        : 0,
      institution: institution.trim() || null,
      notes: notes.trim() || null,
    };

    if (!payload.name) {
      setErrorMsg("Please enter an account name.");
      return;
    }

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }
      // clear form & refresh list
      setName("");
      setTypeCode(TYPE_OPTIONS[1].value);
      setCurrencyCode(CCY_OPTIONS[0]);
      setOpeningMinor("0");
      setInstitution("");
      setNotes("");
      await load();
    } catch (e: any) {
      setErrorMsg(`Create failed: ${e?.message ?? "unknown"}`);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Accounts</h1>

      {/* Create Account */}
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">Create Account</h2>

        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-12">
          <input
            className="sm:col-span-5 border rounded-md px-3 py-2"
            placeholder="Account name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="sm:col-span-4 border rounded-md px-3 py-2"
            value={typeCode}
            onChange={(e) => setTypeCode(e.target.value)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="sm:col-span-3 border rounded-md px-3 py-2"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
          >
            {CCY_OPTIONS.map((ccy) => (
              <option key={ccy} value={ccy}>
                {ccy}
              </option>
            ))}
          </select>

          <input
            className="sm:col-span-3 border rounded-md px-3 py-2"
            placeholder="Opening (minor)"
            inputMode="numeric"
            value={openingMinor}
            onChange={(e) => setOpeningMinor(e.target.value)}
          />

          <input
            className="sm:col-span-4 border rounded-md px-3 py-2"
            placeholder="Institution (optional)"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />

          <input
            className="sm:col-span-5 border rounded-md px-3 py-2"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="sm:col-span-12">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-black text-white px-4 py-2 hover:bg-gray-800"
            >
              Add Account
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="text-sm text-red-600 mt-2" role="alert">
            {errorMsg}
          </p>
        )}
      </section>

      {/* Active */}
      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">Active</h2>
        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : active.length === 0 ? (
          <p className="text-gray-600">No active accounts.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 border-b">Name</th>
                <th className="py-2 border-b">Type</th>
                <th className="py-2 border-b">Currency</th>
                <th className="py-2 border-b">Opening</th>
                <th className="py-2 border-b">Institution</th>
                <th className="py-2 border-b">Notes</th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="py-2 border-b">{r.name}</td>
                  <td className="py-2 border-b">{r.typeCode}</td>
                  <td className="py-2 border-b">{r.currencyCode}</td>
                  <td className="py-2 border-b">{r.openingMinor ?? 0}</td>
                  <td className="py-2 border-b">{r.institution ?? "—"}</td>
                  <td className="py-2 border-b">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Archived */}
      <section>
        <h2 className="text-lg font-medium mb-3">Archived</h2>
        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : archived.length === 0 ? (
          <p className="text-gray-600">No archived accounts.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 border-b">Name</th>
                <th className="py-2 border-b">Type</th>
                <th className="py-2 border-b">Currency</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="py-2 border-b">{r.name}</td>
                  <td className="py-2 border-b">{r.typeCode}</td>
                  <td className="py-2 border-b">{r.currencyCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}