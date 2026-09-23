'use client';

import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';

export default function FeedbackFormPage() {
  const [form, setForm] = useState({ name: '', email: '', rating: 5, experience: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Unable to submit feedback.');

      setStatus({ type: 'success', message: data.message });
      setForm({ name: '', email: '', rating: 5, experience: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-white px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Share your experience</h1>
          <p className="mt-2 text-gray-600">Your feedback is private and is reviewed only by the Saphire Apartments team.</p>
        </div>

        <form onSubmit={submitFeedback} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
            <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email <span className="font-normal text-gray-500">(optional)</span></label>
            <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">How would you rate your experience?</legend>
            <div className="flex gap-2" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => setForm({ ...form, rating })} className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label={`${rating} star${rating > 1 ? 's' : ''}`}>
                  <Star className={`h-8 w-8 ${rating <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="experience" className="mb-1 block text-sm font-medium text-gray-700">Tell us about your experience</label>
            <textarea id="experience" required maxLength={2000} rows={6} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="What did you enjoy, and how can we improve?" className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          {status.message && <p role="status" className={`rounded-lg p-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.message}</p>}
          <button disabled={submitting} className="w-full rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Sending feedback...' : 'Send feedback'}
          </button>
        </form>
      </section>
    </main>
  );
}
