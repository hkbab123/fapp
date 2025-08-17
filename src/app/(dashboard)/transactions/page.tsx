'use client';
import { useEffect, useMemo, useState } from 'react';

type Account = { id: string; name: string; currencyCode: string };
type Group = { id: string; name: string; currencyCode: string };
type Cat = { id: string; name: string; groupId?: string; type: 'expense'|'income'|'saving'|'liability'|'transfer_special'; depth?: number; archived?: boolean };
type Txn = {
  id: string; date: string; typeLabel: 'expense'|'income';
  accountId: string; categoryId: string;
  amountMinor: number; currencyCode: string;
  note?: string | null;
};
type Xfer = {
  id: string; date: string; postingKind: 'acct_to_acct';
  fromAccountId: string; toAccountId: string;
  amountFromMinor: number; currencyFromCode: string;
  amountToMinor: number; currencyToCode: string;
  fxRateUsed?: number | null; fxSource?: string | null;
  note?: string | null;
};

export default function TransactionsPage() {
  const [tab, setTab] = useState<'txn' | 'xfer'>('txn');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [xfers, setXfers] = useState<Xfer[]>([]);

  // ===== Txn (Acct → Category) =====
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [accountId, setAccountId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [typeLabel, setTypeLabel] = useState<'expense'|'income'>('expense');
  const [amountMinor, setAmountMinor] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Transfer (Acct ↔ Acct) =====
  const [xDate, setXDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amountFromMinor, setAmountFromMinor] = useState<number>(0);
  const [xNote, setXNote] = useState<string>('');
  const [xSaving, setXSaving] = useState(false);
  const [xError, setXError] = useState<string | null>(null);
  const [tDelError, setTDelError] = useState<string | null>(null);
  const [xDelError, setXDelError] = useState<string | null>(null);
  const accountCurrency = useMemo(() => {
    const a = accounts.find(a => a.id === accountId);
    return a?.currencyCode ?? '';
  }, [accounts, accountId]);

  // Pretty-display maps
  const accountNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, `${a.name} (${a.currencyCode})`);
    return m;
  }, [accounts]);
  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cats) m.set(c.id, c.name);
    return m;
  }, [cats]);
const filteredCats = useMemo(() => {
  const t = typeLabel;
  return cats.filter(c =>
    !c.archived &&
    (c.groupId ? c.groupId === groupId : true) &&
    (c.type === t || c.type === 'transfer_special')
  );
}, [cats, groupId, typeLabel]);
  // Loaders
  async function loadAccounts() {
    const r = await fetch('/api/accounts', { cache: 'no-store' });
    setAccounts(await r.json());
  }
  async function loadGroups() {
    const r = await fetch('/api/category-groups', { cache: 'no-store' });
    const g = await r.json();
    setGroups(g);
    if (g.length && !groupId) setGroupId(g[0].id);
  }
  async function loadCats(gid: string) {
  try {
    const r = await fetch(`/api/categories?groupId=${encodeURIComponent(gid)}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(await r.text());
    setCats(await r.json());
  } catch (e) {
    setCats([]);
    console.error('Failed to load categories for group', gid, e);
  }
}
  async function loadTxns() {
    try {
      const r = await fetch('/api/transactions', { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      setTxns(await r.json());
    } catch { setTxns([]); }
  }
  async function loadXfers() {
    try {
      const r = await fetch('/api/transfers', { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      setXfers(await r.json());
    } catch { setXfers([]); }
  }
  useEffect(() => { loadAccounts(); loadGroups(); loadTxns(); loadXfers(); }, []);
  useEffect(() => { setCategoryId(''); }, [typeLabel]);
    // Load categories whenever group changes
  useEffect(() => {
    if (!groupId) return;
    loadCats(groupId);
  }, [groupId]);
  // Auto-pick group by account currency
  useEffect(() => {
    if (!accountCurrency || !groups.length) return;
    const match = groups.find(g => g.currencyCode === accountCurrency);
    if (match && match.id !== groupId) setGroupId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountCurrency, groups]);

  // Submit txn
  async function submitTxn(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !categoryId || !accountCurrency || amountMinor <= 0) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date, accountId, categoryId, amountMinor, typeLabel, note: note || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setAmountMinor(0); setNote('');
      await loadTxns();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  }

  // Submit transfer
  async function submitXfer(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitXfer) { setXError('Please choose different From/To accounts and enter a positive amount.'); return; }
    setXSaving(true); setXError(null);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: xDate, fromAccountId, toAccountId, amountFromMinor, note: xNote || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setAmountFromMinor(0); setXNote('');
      await loadXfers();
    } catch (err: any) {
      setXError(err?.message ?? 'Failed to save transfer');
    } finally { setXSaving(false); }
  }

  async function deleteTxn(id: string) {
    setTDelError(null);
    try {
      if (!confirm('Delete this transaction?')) return;
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await loadTxns();
    } catch (err: any) {
      setTDelError(err?.message ?? 'Failed to delete transaction');
    }
  }
  
  async function deleteXfer(id: string) {
    setXDelError(null);
    try {
      if (!confirm('Delete this transfer?')) return;
      const res = await fetch(`/api/transfers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await loadXfers();
    } catch (err: any) {
      setXDelError(err?.message ?? 'Failed to delete transfer');
    }
  }

  const canSubmitTxn = !!date && !!accountId && !!categoryId && amountMinor > 0 && !!accountCurrency;
  const canSubmitXfer = !!xDate && !!fromAccountId && !!toAccountId && fromAccountId !== toAccountId && amountFromMinor > 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      {/* tabs */}
      <div className="flex gap-2">
        <button className={`border px-3 py-1 rounded ${tab==='txn' ? 'bg-gray-100' : ''}`} onClick={() => setTab('txn')} type="button">
          Expense / Income
        </button>
        <button className={`border px-3 py-1 rounded ${tab==='xfer' ? 'bg-gray-100' : ''}`} onClick={() => setTab('xfer')} type="button">
          Transfer (Acct ↔ Acct)
        </button>
      </div>

      {tab === 'txn' ? (
        <>
          <form onSubmit={submitTxn} className="grid grid-cols-4 gap-3 max-w-5xl border rounded p-4">
            {error && (
              <div className="col-span-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <input className="border p-2 rounded" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <select className="border p-2 rounded" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">— Select Account —</option>
              {accounts.map(a => (<option key={a.id} value={a.id}>{a.name} ({a.currencyCode})</option>))}
            </select>
            <select className="border p-2 rounded" value={typeLabel} onChange={(e) => setTypeLabel(e.target.value as 'expense'|'income')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input className="border p-2 rounded" type="number" placeholder="Amount (minor units)" step={1}
              value={amountMinor} onChange={(e) => setAmountMinor(Number(e.target.value))} min={1} required />

            <div className="col-span-2 flex items-center gap-2">
              <span className="text-sm w-28">Currency</span>
              <select className="border p-2 rounded flex-1" value={groupId}
                onChange={(e) => { setGroupId(e.target.value); setCategoryId(''); }}>
                {groups.map(g => (<option key={g.id} value={g.id}>{g.currencyCode}</option>))}
              </select>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <span className="text-sm w-28">Category</span>
              <select className="border p-2 rounded flex-1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">— Select —</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>
                    {'— '.repeat(Math.max(0, (c.depth ?? 2) - 2))}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <textarea className="border p-2 rounded col-span-4" placeholder="Note (optional)"
              value={note} onChange={(e) => setNote(e.target.value)} />

            <div className="col-span-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Currency: <b>{accountCurrency || '—'}</b></div>
              <button disabled={saving || !canSubmitTxn} className="border px-4 py-2 rounded">
                {saving ? 'Saving…' : 'Add Transaction'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">Recent</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Account</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Currency</th>
                  <th className="p-2 text-left">Note</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {txns.slice().reverse().map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="p-2 text-left">{t.date}</td>
                    <td className="p-2">{t.typeLabel}</td>
                    <td className="p-2">{accountNameById.get(t.accountId) ?? t.accountId}</td>
                    <td className="p-2">{categoryNameById.get(t.categoryId) ?? t.categoryId}</td>
                    <td className="p-2">{t.amountMinor}</td>
                    <td className="p-2">{t.currencyCode}</td>
                    <td className="p-2 text-left">{t.note || ''}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-red-600 underline text-xs"
                        onClick={() => deleteTxn(t.id)}
                        title="Delete transaction"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tDelError && <div className="text-sm text-red-600 mt-2">{tDelError}</div>}
          </div>
        </>
      ) : (
        <>
          <form onSubmit={submitXfer} className="grid grid-cols-3 gap-3 max-w-4xl border rounded p-4">
            <input className="border p-2 rounded" type="date" value={xDate} onChange={(e) => setXDate(e.target.value)} required />
            <select className="border p-2 rounded" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
              <option value="">— From Account —</option>
              {accounts.map(a => (<option key={a.id} value={a.id}>{a.name} ({a.currencyCode})</option>))}
            </select>
            <select className="border p-2 rounded" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
              <option value="">— To Account —</option>
              {accounts.filter(a => a.id !== fromAccountId).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currencyCode})</option>
              ))}
            </select>

            <input className="border p-2 rounded" type="number" placeholder="Amount (minor units)" step={1}
              value={amountFromMinor} onChange={(e) => setAmountFromMinor(Number(e.target.value))}
              min={1} required />

            <textarea className="border p-2 rounded col-span-3" placeholder="Note (optional)"
              value={xNote} onChange={(e) => setXNote(e.target.value)} />

            <div className="col-span-3 flex items-center justify-end">
              <button disabled={xSaving || !canSubmitXfer} className="border px-4 py-2 rounded">
                {xSaving ? 'Saving…' : 'Save Transfer'}
              </button>
            </div>

            {xError && <div className="col-span-3 text-red-600 text-sm">{xError}</div>}
          </form>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">Recent Transfers</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2">From</th>
                  <th className="p-2">To</th>
                  <th className="p-2">From Amt</th>
                  <th className="p-2">From CCY</th>
                  <th className="p-2">To Amt</th>
                  <th className="p-2">To CCY</th>
                  <th className="p-2">FX</th>
                  <th className="p-2 text-left">Note</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {xfers.slice().reverse().map(x => (
                  <tr key={x.id} className="border-t">
                    <td className="p-2 text-left">{x.date}</td>
                    <td className="p-2">{accountNameById.get(x.fromAccountId) ?? x.fromAccountId}</td>
                    <td className="p-2">{accountNameById.get(x.toAccountId) ?? x.toAccountId}</td>
                    <td className="p-2">{x.amountFromMinor}</td>
                    <td className="p-2">{x.currencyFromCode}</td>
                    <td className="p-2">{x.amountToMinor}</td>
                    <td className="p-2">{x.currencyToCode}</td>
                    <td className="p-2">{x.fxRateUsed ?? ''}</td>
                    <td className="p-2 text-left">{x.note || ''}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-red-600 underline text-xs"
                        onClick={() => deleteXfer(x.id)}
                        title="Delete transfer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {xDelError && <div className="text-sm text-red-600 mt-2">{xDelError}</div>}
          </div>
        </>
      )}
    </div>
  );
}