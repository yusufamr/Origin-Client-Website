import { useEffect, useRef, useState } from 'react';
import type { PortfolioItem } from '../../lib/dataStore';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PortfolioManager() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [date, setDate] = useState(today());
  const [fileWarning, setFileWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/list');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
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
    loadItems();
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
      await loadItems();
    } else {
      setLoginError('Incorrect password.');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_SIZE_BYTES) {
      setFileWarning('Image exceeds the 5MB limit. Please choose a smaller file.');
    } else {
      setFileWarning('');
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setSubmitError('Please select an image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setSubmitError('Image exceeds the 5MB limit.');
      return;
    }
    if (!descriptionAr.trim() || !descriptionEn.trim()) {
      setSubmitError('Both Arabic and English descriptions are required.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('descriptionAr', descriptionAr.trim());
    formData.append('descriptionEn', descriptionEn.trim());
    formData.append('date', date);

    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/add', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed.');
      }
      setSubmitSuccess(true);
      setDescriptionAr('');
      setDescriptionEn('');
      setDate(today());
      setFileWarning('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadItems();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
    await fetch('/api/portfolio/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadItems();
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

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold text-slate-900">Add New Portfolio Item</h2>
        <form onSubmit={handleAdd} className="mt-4 max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-slate-700">
              Image (JPG, PNG, or WebP — max 5MB)
            </label>
            <input
              id="image"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              required
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            {fileWarning && <p className="mt-1 text-sm text-amber-600">{fileWarning}</p>}
          </div>

          <div>
            <label htmlFor="descriptionAr" className="block text-sm font-medium text-slate-700">
              Description (Arabic)
            </label>
            <textarea
              id="descriptionAr"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              dir="rtl"
              required
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="descriptionEn" className="block text-sm font-medium text-slate-700">
              Description (English)
            </label>
            <textarea
              id="descriptionEn"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              required
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          {submitSuccess && <p className="text-sm text-green-700">Portfolio item added successfully.</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Uploading...' : 'Add Item'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Manage Existing Items ({items.length})</h2>
          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-slate-500">No portfolio items yet.</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={item.imagePath} alt={item.descriptionEn} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-700">{item.descriptionEn}</p>
                  <p className="mt-1 text-sm text-slate-500" dir="rtl">
                    {item.descriptionAr}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{item.date}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="mt-3 w-full rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
