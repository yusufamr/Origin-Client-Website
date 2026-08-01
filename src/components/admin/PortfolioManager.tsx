import { useRef, useState, useEffect } from 'react';
import type { PortfolioItem } from '../../lib/dataStore';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface PortfolioFormState {
  descriptionEn: string;
  descriptionAr: string;
  date: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formToData(form: PortfolioFormState): FormData {
  const data = new FormData();
  data.append('descriptionEn', form.descriptionEn.trim());
  data.append('descriptionAr', form.descriptionAr.trim());
  data.append('date', form.date);
  return data;
}

export default function PortfolioManager() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [addForm, setAddForm] = useState<PortfolioFormState>({ descriptionEn: '', descriptionAr: '', date: today() });
  const [addFileWarning, setAddFileWarning] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

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

  function handleAddFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const oversized = files.some((f) => f.size > MAX_SIZE_BYTES);
    setAddFileWarning(oversized ? 'One or more images exceed the 5MB limit.' : '');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddSuccess(false);

    const files = Array.from(addFileInputRef.current?.files ?? []);
    if (files.length === 0) {
      setAddError('Please select at least one photo.');
      return;
    }
    if (files.some((f) => f.size > MAX_SIZE_BYTES)) {
      setAddError('Each image must be under 5MB.');
      return;
    }
    if (!addForm.descriptionAr.trim() || !addForm.descriptionEn.trim()) {
      setAddError('Both Arabic and English descriptions are required.');
      return;
    }

    const data = formToData(addForm);
    files.forEach((f) => data.append('images', f));

    setAddSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/add', { method: 'POST', body: data });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed.');
      }
      setAddSuccess(true);
      setAddForm({ descriptionEn: '', descriptionAr: '', date: today() });
      setAddFileWarning('');
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      await loadItems();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setAddSubmitting(false);
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
            <label htmlFor="images" className="block text-sm font-medium text-slate-700">
              Photos (JPG, PNG, or WebP — max 5MB each, at least one required)
            </label>
            <input
              id="images"
              ref={addFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleAddFilesChange}
              required
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            {addFileWarning && <p className="mt-1 text-sm text-amber-600">{addFileWarning}</p>}
          </div>

          <div>
            <label htmlFor="descriptionAr" className="block text-sm font-medium text-slate-700">
              Description (Arabic)
            </label>
            <textarea
              id="descriptionAr"
              value={addForm.descriptionAr}
              onChange={(e) => setAddForm((f) => ({ ...f, descriptionAr: e.target.value }))}
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
              value={addForm.descriptionEn}
              onChange={(e) => setAddForm((f) => ({ ...f, descriptionEn: e.target.value }))}
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
              value={addForm.date}
              onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {addError && <p className="text-sm text-red-600">{addError}</p>}
          {addSuccess && <p className="text-sm text-green-700">Portfolio item added successfully.</p>}

          <button
            type="submit"
            disabled={addSubmitting}
            className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addSubmitting ? 'Uploading...' : 'Add Item'}
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
          <div className="mt-4 space-y-6">
            {items.map((item) => (
              <PortfolioItemEditor key={item.id} item={item} onSaved={loadItems} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface PortfolioItemEditorProps {
  item: PortfolioItem;
  onSaved: () => Promise<void>;
  onDelete: () => void;
}

function PortfolioItemEditor({ item, onSaved, onDelete }: PortfolioItemEditorProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PortfolioFormState>({
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    date: item.date,
  });
  const [removeImages, setRemoveImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const newFilesRef = useRef<HTMLInputElement>(null);

  function toggleRemoveImage(imagePath: string) {
    setRemoveImages((prev) => (prev.includes(imagePath) ? prev.filter((p) => p !== imagePath) : [...prev, imagePath]));
  }

  async function handleSave() {
    setSaveError('');
    if (!form.descriptionEn.trim() || !form.descriptionAr.trim() || !form.date) {
      setSaveError('Both descriptions and a date are required.');
      return;
    }

    const data = formToData(form);
    data.append('id', item.id);
    data.append('removeImages', JSON.stringify(removeImages));
    Array.from(newFilesRef.current?.files ?? []).forEach((f) => data.append('newImages', f));

    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/update', { method: 'POST', body: data });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save changes.');
      }
      setRemoveImages([]);
      if (newFilesRef.current) newFilesRef.current.value = '';
      setEditing(false);
      await onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-700">{item.descriptionEn}</p>
          <p className="mt-1 text-sm text-slate-500" dir="rtl">
            {item.descriptionAr}
          </p>
          <p className="mt-2 text-xs text-slate-400">{item.date}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button type="button" onClick={onDelete} className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-4">
        {item.images.map((img) => (
          <div key={img} className="relative overflow-hidden rounded-xl border border-slate-200">
            <img src={img} alt={item.descriptionEn} className="aspect-[4/3] w-full object-cover" />
            {editing && (
              <button
                type="button"
                onClick={() => toggleRemoveImage(img)}
                className={`absolute end-1 top-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  removeImages.includes(img) ? 'bg-red-600 text-white' : 'bg-white/90 text-red-600'
                }`}
              >
                {removeImages.includes(img) ? 'Removing' : 'Remove'}
              </button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (Arabic)</label>
            <textarea
              value={form.descriptionAr}
              onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
              dir="rtl"
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description (English)</label>
            <textarea
              value={form.descriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor={`new-images-${item.id}`} className="block text-sm font-medium text-slate-700">
              Add More Photos (optional)
            </label>
            <input
              id={`new-images-${item.id}`}
              ref={newFilesRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1.5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
