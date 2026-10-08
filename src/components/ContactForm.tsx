import { useState, type FormEvent } from 'react';
import type { Dictionary } from '../i18n/translations';

interface Props {
  dict: Dictionary['contactPage'];
  /** "dark" renders on the brand-950 callback card. */
  variant?: 'light' | 'dark';
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

const STYLES = {
  light: {
    success: 'rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center',
    successTitle: 'text-xl font-bold text-brand-900',
    successBody: 'mt-2 text-brand-700',
    label: 'block text-sm font-semibold text-brand-900',
    input:
      'mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-950 placeholder:text-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
    error: 'text-sm text-red-600',
  },
  dark: {
    success: 'rounded-2xl border border-brand-700 bg-brand-900 p-8 text-center',
    successTitle: 'text-xl font-bold text-white',
    successBody: 'mt-2 text-brand-200',
    label: 'block text-sm font-semibold text-brand-100',
    input:
      'mt-1.5 w-full rounded-xl border border-brand-600 bg-brand-900 px-4 py-3 text-white placeholder:text-brand-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30',
    error: 'text-sm text-red-300',
  },
} as const;

export default function ContactForm({ dict, variant = 'light' }: Props) {
  const css = STYLES[variant];
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
      <div className={css.success}>
        <h3 className={css.successTitle}>{dict.successTitle}</h3>
        <p className={css.successBody}>{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div>
        <label htmlFor="name" className={css.label}>
          {dict.nameLabel}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={dict.namePlaceholder}
          maxLength={120}
          className={css.input}
        />
      </div>

      <div>
        <label htmlFor="phone" className={css.label}>
          {dict.phoneLabel} <span className="text-accent-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={dict.phonePlaceholder}
          required
          aria-invalid={Boolean(fieldError)}
          className={css.input}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="time" className={css.label}>
          {dict.timeLabel}
        </label>
        <select
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={css.input}
        >
          <option value="any">{dict.timeOptions.any}</option>
          <option value="morning">{dict.timeOptions.morning}</option>
          <option value="afternoon">{dict.timeOptions.afternoon}</option>
          <option value="evening">{dict.timeOptions.evening}</option>
        </select>
      </div>

      {fieldError && <p className={`${css.error} sm:col-span-2`}>{fieldError}</p>}
      {status === 'error' && <p className={`${css.error} sm:col-span-2`}>{dict.errorBody}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-xl bg-accent-500 px-6 py-4 text-base font-extrabold text-brand-950 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
      >
        {status === 'submitting' ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
