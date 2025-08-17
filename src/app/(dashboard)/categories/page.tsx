'use client';
import { useEffect, useMemo, useState } from 'react';

type Group = { id: string; name: string; countryCode: string; currencyCode: string };
type Category = {
  id: string; groupId: string; parentId: string | null;
  name: string; type: 'expense'|'income'|'saving'|'liability'|'transfer_special';
  depth?: number | null; archived: 0|1;
};

// Normalize archived flag from API (0/1/true/false)
const asArchivedBool = (v: any) => v === 1 || v === true || v === '1';

export default function CategoriesPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>('');
  const [cats, setCats] = useState<Category[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // create form
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('expense');
  const [parentId, setParentId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  async function loadGroups() {
    const rows = await fetch('/api/category-groups', { cache: 'no-store' }).then(r => r.json());
    setGroups(rows || []);
    if (!groupId && rows?.length) setGroupId(rows[0].id);
  }

  async function loadCats(gid: string) {
    if (!gid) return;
    setLoading(true);
    setErr(null);
    try {
      const rows = await fetch(`/api/categories?groupId=${encodeURIComponent(gid)}`, { cache: 'no-store' })
        .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.text())));
      setCats(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setErr(e?.message ?? 'Load error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (groupId) loadCats(groupId); }, [groupId]);

  const visibleCats = useMemo(
    () => cats.filter(c => {
      const isArch = asArchivedBool(c.archived);
      return showArchived ? isArch : !isArch;
    }),
    [cats, showArchived]
  );

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) {
      setErr('Please select a Category Group first.');
      return;
    }
    if (!name.trim()) {
      setErr('Category name is required.');
      return;
    }
    setCreating(true);
    setErr(null);
    try {
      const base = { groupId, name: name.trim() };
      const payload: any = parentId
        ? { ...base, parentId }                                  // inherit type from parent
        : { ...base, type, typeLabel: type };                    // send both keys to satisfy API variations

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.debug('Create category response:', res.status, text);
      if (!res.ok) {
        setErr(text || 'Create failed');
        return;
      }

      // success
      setName('');
      setParentId('');
      await new Promise((r) => setTimeout(r, 50));
      await loadCats(groupId);
    } catch (e: any) {
      setErr(e?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function setArchived(id: string, archived: boolean) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await loadCats(groupId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500">Manage by country group • create, archive, restore.</p>
        </div>
      </div>
      {err && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Pick group */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="border rounded px-3 py-2"
                value={groupId} onChange={e => setGroupId(e.target.value)}>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.currencyCode})</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showArchived}
                 onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      {/* Create */}
      <div className="rounded-lg border bg-white p-4 space-y-3 max-w-4xl">
        <div className="font-medium">Create Category in: <span className="text-gray-600">
          {groups.find(g => g.id === groupId)?.name ?? '—'}
        </span></div>
        <form onSubmit={createCategory} className="grid grid-cols-4 gap-3">
          <input className="border p-2 rounded col-span-2" placeholder="Category name"
                 value={name} onChange={(e) => setName(e.target.value)} required />

          <select className="border p-2 rounded"
                  value={type} onChange={(e) => setType(e.target.value as any)}
                  disabled={!!parentId}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="saving">Saving</option>
            <option value="liability">Liability</option>
            <option value="transfer_special">Transfer (special)</option>
          </select>

          <select className="border p-2 rounded"
                  value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">— No Parent —</option>
            {cats.filter(c => c.groupId === groupId && !asArchivedBool(c.archived)).map(c => (
              <option key={c.id} value={c.id}>
                {'— '.repeat(Math.max(0, (c.depth ?? 2) - 2))}{c.name} ({c.type})
              </option>
            ))}
          </select>

          <div className="col-span-4 flex justify-end">
            <button className="border px-4 py-2 rounded" disabled={creating || !groupId}>
              {creating ? 'Creating…' : 'Add Category'}
            </button>
          </div>

          {err && <div className="col-span-4 text-red-600 text-sm">{err}</div>}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-medium">Categories in this group</div>
        <div className="p-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Depth</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleCats.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">
                      {'— '.repeat(Math.max(0, (c.depth ?? 2) - 2))}
                      {c.name}
                    </td>
                    <td className="py-2">{c.type}</td>
                    <td className="py-2">{c.depth ?? ''}</td>
                    <td className="py-2">{asArchivedBool(c.archived) ? 'Archived' : 'Active'}</td>
                    <td className="py-2">
                      {c.archived ? (
                        <button className="text-xs underline"
                                onClick={() => setArchived(c.id, false)}>
                          Restore
                        </button>
                      ) : (
                        <button className="text-xs underline text-red-600"
                                onClick={() => setArchived(c.id, true)}>
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleCats.length === 0 && (
                  <tr><td className="py-4 text-sm text-gray-500" colSpan={5}>
                    No categories to show.
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}