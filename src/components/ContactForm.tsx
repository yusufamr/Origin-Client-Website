import { useState, type FormEvent } from 'react';
import type { Dictionary } from '../i18n/translations';

interface Props {
  dict: Dictionary['contactPage'];
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

export default function ContactForm({ dict }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('any');
  const [status, setStatus] = useState<Status>('idle');
  const [fieldError, setFieldError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError('');

    if (!phone.trim()) {
      setFieldError(dict.requiredError);
      return;
    }
    if (!PHONE_PATTERN.test(phone.trim())) {
      setFieldError(dict.phoneInvalidError);
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, time }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
      setName('');
      setPhone('');
      setTime('any');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <h3 className="text-xl font-bold text-brand-800">{dict.successTitle}</h3>
        <p className="mt-2 text-brand-700">{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          {dict.nameLabel}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.namePlaceholder}
          maxLength={120}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          {dict.phoneLabel} <span className="text-red-600">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={dict.phonePlaceholder}
          required
          aria-invalid={Boolean(fieldError)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-slate-700">
          {dict.timeLabel}
        </label>
        <select
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="any">{dict.timeOptions.any}</option>
          <option value="morning">{dict.timeOptions.morning}</option>
          <option value="afternoon">{dict.timeOptions.afternoon}</option>
          <option value="evening">{dict.timeOptions.evening}</option>
        </select>
      </div>

      {fieldError && <p className="text-sm text-red-600">{fieldError}</p>}
      {status === 'error' && <p className="text-sm text-red-600">{dict.errorBody}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
