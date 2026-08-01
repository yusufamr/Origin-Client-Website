import { useEffect, useState } from 'react';
import type { CallRequest } from '../../lib/dataStore';
import { paginate } from '../../lib/pagination';

const TIME_LABELS: Record<string, string> = {
  any: 'Any time',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword('');
      await loadRequests();
    } else {
      setLoginError('Incorrect password.');
    }
  }

  async function toggleContacted(id: string, contacted: boolean) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, contacted } : r)));
    await fetch('/api/admin/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, contacted }),
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this call request?')) return;
    await fetch('/api/admin/requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadRequests();
  }

  if (checkingSession) {
    return <p className="text-slate-500">Loading...</p>;
  }

  if (!authenticated) {
    return (
      <form onSubmit={handleLogin} className="max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
            Admin Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {loginError && <p className="text-sm text-red-600">{loginError}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Unlock
        </button>
      </form>
    );
  }

  const { items: pageRequests, currentPage, totalPages } = paginate(requests, page);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{requests.length} total requests</p>
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="text-slate-500">No call requests yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-start text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">Name</th>
                  <th className="px-4 py-3 text-start">Phone</th>
                  <th className="px-4 py-3 text-start">Preferred Time</th>
                  <th className="px-4 py-3 text-start">Submitted</th>
                  <th className="px-4 py-3 text-start">Contacted</th>
                  <th className="px-4 py-3 text-start">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRequests.map((r) => (
                  <tr key={r.id} className={r.contacted ? 'bg-slate-50/60' : ''}>
                    <td className="px-4 py-3">{r.name || '—'}</td>
                    <td className="px-4 py-3 font-medium">{r.phone}</td>
                    <td className="px-4 py-3">{TIME_LABELS[r.time] ?? r.time}</td>
                    <td className="px-4 py-3 text-slate-500">{formatTimestamp(r.timestamp)}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={r.contacted}
                          onChange={(e) => toggleContacted(r.id, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>{r.contacted ? 'Contacted' : 'Mark contacted'}</span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-brand-600 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    p === currentPage
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 text-slate-600 hover:border-brand-600 hover:text-brand-700'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-brand-600 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
