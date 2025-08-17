'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Account = { id: string; name: string; currencyCode: string };
type Txn = {
  id: string;
  date: string;
  typeLabel: 'expense'|'income';
  accountId: string;
  categoryId: string;
  amountMinor: number;
  currencyCode: string;
  note?: string | null;
};

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, t] = await Promise.all([
          fetch('/api/accounts', { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/transactions', { cache: 'no-store' }).then(r => r.json()),
        ]);
        setAccounts(Array.isArray(a) ? a : []);
        setTxns(Array.isArray(t) ? t : []);
      } finally { setLoading(false); }
    })();
  }, []);

  const accountNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, `${a.name} (${a.currencyCode})`);
    return m;
  }, [accounts]);

  // Month window
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const yyyymm = `${y}-${m}`;
  const monthLabel = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const mtd = useMemo(() => txns.filter(t => (t.date ?? '').startsWith(yyyymm)), [txns, yyyymm]);

  // Aggregate by currency
  const mtdByCcy = useMemo(() => {
    const agg: Record<string, { income: number; expense: number; net: number }> = {};
    for (const t of mtd) {
      const c = t.currencyCode || '—';
      if (!agg[c]) agg[c] = { income: 0, expense: 0, net: 0 };
      if (t.typeLabel === 'income') { agg[c].income += t.amountMinor; agg[c].net += t.amountMinor; }
      else { agg[c].expense += t.amountMinor; agg[c].net -= t.amountMinor; }
    }
    return agg;
  }, [mtd]);

  const recent = useMemo(() => {
    return [...txns].sort((a,b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)).slice(0, 8);
  }, [txns]);

  // Simple totals for top cards (sum minor across currencies separately)
  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of mtd) {
      if (t.typeLabel === 'income') income += t.amountMinor;
      else expense += t.amountMinor;
    }
    const net = income - expense;
    return { income, expense, net };
  }, [mtd]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500">Month-to-date • {monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">
            + Add Transaction
          </Link>
          <Link href="/accounts" className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Manage Accounts
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="MTD Income (minor)" value={formatMinor(totals.income)} tone="green" />
        <StatCard title="MTD Expense (minor)" value={formatMinor(totals.expense)} tone="red" />
        <StatCard title="MTD Net (minor)" value={formatMinor(totals.net)} tone={totals.net >= 0 ? "green" : "red"} />
      </div>

      {/* By currency */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3 font-medium">By Currency (MTD)</div>
          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : Object.keys(mtdByCcy).length === 0 ? (
              <div className="text-sm text-gray-500">No transactions this month.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Currency</th>
                    <th className="py-2 text-right">Income</th>
                    <th className="py-2 text-right">Expense</th>
                    <th className="py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mtdByCcy).map(([ccy, v]) => (
                    <tr key={ccy} className="border-t">
                      <td className="py-2">{ccy}</td>
                      <td className="py-2 text-right text-emerald-700">{formatMinor(v.income)}</td>
                      <td className="py-2 text-right text-rose-700">{formatMinor(v.expense)}</td>
                      <td className={`py-2 text-right ${v.net < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatMinor(v.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent */}
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3 font-medium">Recent Activity</div>
          <div className="p-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Account</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2">CCY</th>
                    <th className="py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.date}</td>
                      <td className={`py-2 ${t.typeLabel === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{t.typeLabel}</td>
                      <td className="py-2">{accountNameById.get(t.accountId) ?? t.accountId}</td>
                      <td className="py-2 text-right">{formatMinor(t.amountMinor)}</td>
                      <td className="py-2">{t.currencyCode}</td>
                      <td className="py-2">{t.note ?? ''}</td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr><td className="py-4 text-sm text-gray-500" colSpan={6}>No recent transactions.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: "green" | "red" }) {
  const colors =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
      : "bg-rose-50 text-rose-800 ring-rose-600/20";
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${colors}`}>
          MTD
        </span>
      </div>
    </div>
  );
}

function formatMinor(n: number) {
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}