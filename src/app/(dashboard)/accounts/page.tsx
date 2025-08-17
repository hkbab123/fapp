'use client';
import { useEffect, useMemo, useState } from 'react';

type Account = {
  id: string; name: string; type: string; currencyCode: string;
  openingBalanceMinor: number; openingDate?: string | null;
  institutionName?: string | null; accountRef?: string | null;
  notes?: string | null; archived: 0 | 1;
};
type AccountType = { code: string; name?: string | null; category?: string | null };
type Currency = { code: string; name?: string | null; symbol?: string | null };

export default function AccountsPage() {
  const [list, setList] = useState<Account[]>([]);
  const [types, setTypes] = useState<AccountType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [openingBalanceMinor, setOpeningBalanceMinor] = useState<number>(0);
  const [openingDate, setOpeningDate] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const active = useMemo(() => list.filter(a => a.archived === 0), [list]);
  const archived = useMemo(() => list.filter(a => a.archived === 1), [list]);

  async function loadAll() {
    setLoading(true); setErr(null);
    try {
      const [a, t, c] = await Promise.all([
        fetch('/api/accounts', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/account-types', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/currencies', { cache: 'no-store' }).then(r => r.json()),
      ]);
      setList(a ?? []);
      setTypes(t ?? []);
      setCurrencies(c ?? []);
      // default selects
      if (!type && t?.length) setType(t[0].code);
      if (!currencyCode && c?.length) setCurrencyCode(c[0].code);
    } catch (e: any) {
      setErr(e?.message ?? 'Load error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !type || !currencyCode) return;
    setCreating(true); setErr(null);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          currencyCode,
          openingBalanceMinor,
          openingDate: openingDate || undefined,
          institutionName: institutionName || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName(''); setOpeningBalanceMinor(0); setOpeningDate('');
      setInstitutionName(''); setNotes('');
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function setArchived(id: string, archived: boolean) {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await loadAll();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>

      {/* Create form */}
      <div className="border rounded p-4 space-y-3 max-w-5xl">
        <div className="font-medium">Create Account</div>
        <form onSubmit={createAccount} className="grid grid-cols-4 gap-3">
          <input className="border p-2 rounded col-span-2" placeholder="Account name"
                 value={name} onChange={(e) => setName(e.target.value)} required />
          <select className="border p-2 rounded" value={type} onChange={(e) => setType(e.target.value)} required>
            {types.map(t => <option key={t.code} value={t.code}>{t.code}{t.name ? ` — ${t.name}` : ''}</option>)}
          </select>
          <select className="border p-2 rounded" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} required>
            {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>

          <input className="border p-2 rounded" type="number" placeholder="Opening balance (minor units)"
                 value={openingBalanceMinor} onChange={(e) => setOpeningBalanceMinor(Number(e.target.value))} min={0} />
          <input className="border p-2 rounded" type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Institution (optional)"
                 value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
          <input className="border p-2 rounded col-span-4" placeholder="Notes (optional)"
                 value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="col-span-4 flex justify-end">
            <button className="border px-4 py-2 rounded" disabled={creating}>
              {creating ? 'Creating…' : 'Add Account'}
            </button>
          </div>

          {err && <div className="col-span-4 text-red-600 text-sm">{err}</div>}
        </form>
      </div>

      {/* Active accounts */}
      <div className="space-y-2 max-w-6xl">
        <h2 className="text-lg font-medium">Active</h2>
        {loading ? <div>Loading…</div> : (
          <table className="w-full text-sm border">
            <thead><tr className="bg-gray-50">
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Opening</th>
              <th className="p-2">Institution</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr></thead>
            <tbody>
              {active.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 text-left">{a.name}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.currencyCode}</td>
                  <td className="p-2">{a.openingBalanceMinor}</td>
                  <td className="p-2">{a.institutionName ?? ''}</td>
                  <td className="p-2">{a.notes ?? ''}</td>
                  <td className="p-2">
                    <button className="text-xs underline text-red-600" onClick={() => setArchived(a.id, true)}>Archive</button>
                  </td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr><td className="p-4 text-left text-gray-500" colSpan={7}>No active accounts.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Archived accounts */}
      <div className="space-y-2 max-w-6xl">
        <h2 className="text-lg font-medium">Archived</h2>
        {loading ? <div>Loading…</div> : (
          <table className="w-full text-sm border">
            <thead><tr className="bg-gray-50">
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Opening</th>
              <th className="p-2">Actions</th>
            </tr></thead>
            <tbody>
              {archived.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 text-left">{a.name}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.currencyCode}</td>
                  <td className="p-2">{a.openingBalanceMinor}</td>
                  <td className="p-2">
                    <button className="text-xs underline" onClick={() => setArchived(a.id, false)}>Restore</button>
                  </td>
                </tr>
              ))}
              {archived.length === 0 && (
                <tr><td className="p-4 text-left text-gray-500" colSpan={5}>No archived accounts.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}