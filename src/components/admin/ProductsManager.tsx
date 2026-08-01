import { useEffect, useRef, useState } from 'react';
import type { Product } from '../../lib/dataStore';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface ProductFormState {
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;
  articleEn: string;
  articleAr: string;
  videoUrl: string;
}

const emptyForm: ProductFormState = {
  titleEn: '',
  titleAr: '',
  taglineEn: '',
  taglineAr: '',
  articleEn: '',
  articleAr: '',
  videoUrl: '',
};

function formToData(form: ProductFormState): FormData {
  const data = new FormData();
  data.append('titleEn', form.titleEn.trim());
  data.append('titleAr', form.titleAr.trim());
  data.append('taglineEn', form.taglineEn.trim());
  data.append('taglineAr', form.taglineAr.trim());
  data.append('articleEn', form.articleEn.trim());
  data.append('articleAr', form.articleAr.trim());
  data.append('videoUrl', form.videoUrl.trim());
  return data;
}

export default function ProductsManager() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [addForm, setAddForm] = useState<ProductFormState>(emptyForm);
  const [addFileWarning, setAddFileWarning] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products/list');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items);
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
    loadProducts();
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
      await loadProducts();
    } else {
      setLoginError('Incorrect password.');
    }
  }

  function handleAddFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const oversized = files.some((f) => f.size > MAX_SIZE_BYTES);
    setAddFileWarning(oversized ? 'One or more images exceed the 5MB limit.' : '');
  }

  async function handleAddSubmit(e: React.FormEvent) {
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
    if (
      !addForm.titleEn.trim() ||
      !addForm.titleAr.trim() ||
      !addForm.taglineEn.trim() ||
      !addForm.taglineAr.trim() ||
      !addForm.articleEn.trim() ||
      !addForm.articleAr.trim()
    ) {
      setAddError('Title, tagline, and article are required in both languages.');
      return;
    }

    const data = formToData(addForm);
    files.forEach((f) => data.append('images', f));

    setAddSubmitting(true);
    try {
      const res = await fetch('/api/products/add', { method: 'POST', body: data });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add product.');
      }
      setAddSuccess(true);
      setAddForm(emptyForm);
      setAddFileWarning('');
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      await loadProducts();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add product.');
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    await fetch('/api/products/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadProducts();
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    await fetch('/api/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    });
    await loadProducts();
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
        <h2 className="text-lg font-bold text-slate-900">Add New Product</h2>
        <form onSubmit={handleAddSubmit} className="mt-4 max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title (English)" value={addForm.titleEn} onChange={(v) => setAddForm((f) => ({ ...f, titleEn: v }))} />
            <TextField label="Title (Arabic)" value={addForm.titleAr} onChange={(v) => setAddForm((f) => ({ ...f, titleAr: v }))} dir="rtl" />
            <TextField label="Tagline (English)" value={addForm.taglineEn} onChange={(v) => setAddForm((f) => ({ ...f, taglineEn: v }))} />
            <TextField label="Tagline (Arabic)" value={addForm.taglineAr} onChange={(v) => setAddForm((f) => ({ ...f, taglineAr: v }))} dir="rtl" />
          </div>

          <TextArea label="Article (English)" value={addForm.articleEn} onChange={(v) => setAddForm((f) => ({ ...f, articleEn: v }))} rows={8} />
          <TextArea label="Article (Arabic)" value={addForm.articleAr} onChange={(v) => setAddForm((f) => ({ ...f, articleAr: v }))} rows={8} dir="rtl" />

          <TextField
            label="Video URL (optional)"
            type="url"
            value={addForm.videoUrl}
            onChange={(v) => setAddForm((f) => ({ ...f, videoUrl: v }))}
            required={false}
          />

          <div>
            <label htmlFor="add-images" className="block text-sm font-medium text-slate-700">
              Photos (JPG, PNG, or WebP — max 5MB each, at least one required)
            </label>
            <input
              id="add-images"
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

          {addError && <p className="text-sm text-red-600">{addError}</p>}
          {addSuccess && <p className="text-sm text-green-700">Product added successfully.</p>}

          <button
            type="submit"
            disabled={addSubmitting}
            className="w-full rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addSubmitting ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Manage Existing Products ({products.length})</h2>
          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {products.length === 0 ? (
          <p className="mt-4 text-slate-500">No products yet.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {products.map((product, index) => (
              <ProductEditor
                key={product.id}
                product={product}
                isFirst={index === 0}
                isLast={index === products.length - 1}
                onSaved={loadProducts}
                onDelete={() => handleDelete(product.id)}
                onReorder={(direction) => handleReorder(product.id, direction)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface ProductEditorProps {
  product: Product;
  isFirst: boolean;
  isLast: boolean;
  onSaved: () => Promise<void>;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
}

function ProductEditor({ product, isFirst, isLast, onSaved, onDelete, onReorder }: ProductEditorProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProductFormState>({
    titleEn: product.titleEn,
    titleAr: product.titleAr,
    taglineEn: product.taglineEn,
    taglineAr: product.taglineAr,
    articleEn: product.articleEn,
    articleAr: product.articleAr,
    videoUrl: product.videoUrl,
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
    if (!form.titleEn.trim() || !form.titleAr.trim() || !form.taglineEn.trim() || !form.taglineAr.trim() || !form.articleEn.trim() || !form.articleAr.trim()) {
      setSaveError('Title, tagline, and article are required in both languages.');
      return;
    }

    const data = formToData(form);
    data.append('id', product.id);
    data.append('removeImages', JSON.stringify(removeImages));
    Array.from(newFilesRef.current?.files ?? []).forEach((f) => data.append('newImages', f));

    setSaving(true);
    try {
      const res = await fetch('/api/products/update', { method: 'POST', body: data });
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
          <p className="font-bold text-slate-900">{product.titleEn} / {product.titleAr}</p>
          <p className="mt-1 text-sm text-slate-500">/products/{product.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onReorder('up')} disabled={isFirst} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:opacity-40">
            ↑ Move Up
          </button>
          <button type="button" onClick={() => onReorder('down')} disabled={isLast} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700 disabled:opacity-40">
            ↓ Move Down
          </button>
          <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button type="button" onClick={onDelete} className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-4">
        {product.images.map((img) => (
          <div key={img} className="relative overflow-hidden rounded-xl border border-slate-200">
            <img src={img} alt={product.titleEn} className="aspect-[4/3] w-full object-cover" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title (English)" value={form.titleEn} onChange={(v) => setForm((f) => ({ ...f, titleEn: v }))} />
            <TextField label="Title (Arabic)" value={form.titleAr} onChange={(v) => setForm((f) => ({ ...f, titleAr: v }))} dir="rtl" />
            <TextField label="Tagline (English)" value={form.taglineEn} onChange={(v) => setForm((f) => ({ ...f, taglineEn: v }))} />
            <TextField label="Tagline (Arabic)" value={form.taglineAr} onChange={(v) => setForm((f) => ({ ...f, taglineAr: v }))} dir="rtl" />
          </div>

          <TextArea label="Article (English)" value={form.articleEn} onChange={(v) => setForm((f) => ({ ...f, articleEn: v }))} rows={8} />
          <TextArea label="Article (Arabic)" value={form.articleAr} onChange={(v) => setForm((f) => ({ ...f, articleAr: v }))} rows={8} dir="rtl" />

          <TextField label="Video URL (optional)" type="url" value={form.videoUrl} onChange={(v) => setForm((f) => ({ ...f, videoUrl: v }))} required={false} />

          <div>
            <label htmlFor={`new-images-${product.id}`} className="block text-sm font-medium text-slate-700">
              Add More Photos (optional)
            </label>
            <input
              id={`new-images-${product.id}`}
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

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  type?: string;
  required?: boolean;
}

function TextField({ label, value, onChange, dir, type = 'text', required = true }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  dir?: 'rtl' | 'ltr';
}

function TextArea({ label, value, onChange, rows, dir }: TextAreaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        rows={rows}
        required
        className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
