'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Star, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const response = await fetch('/api/feedback');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load feedback.');
        setFeedback(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, []);

  const deleteFeedback = async (item) => {
    if (!window.confirm(`Delete feedback from ${item.name}? This cannot be undone.`)) return;

    setActionId(item._id);
    setActionMessage('');
    try {
      const response = await fetch(`/api/feedback/${item._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete feedback.');
      setFeedback((current) => current.filter((feedbackItem) => feedbackItem._id !== item._id));
      setActionMessage('Feedback deleted.');
    } catch (requestError) {
      setActionMessage(requestError.message);
    } finally {
      setActionId('');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Guest Feedback</h1>
            <p className="text-sm text-gray-600">Private feedback submitted by guests and visitors.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {actionMessage && <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-700" role="status">{actionMessage}</div>}
          {loading ? <div className="p-8 text-center text-gray-500">Loading feedback...</div> : error ? <div className="p-8 text-center text-red-600">{error}</div> : feedback.length === 0 ? <div className="p-8 text-center text-gray-500">No feedback has been submitted yet.</div> : (
            <div className="divide-y divide-gray-200">
              {feedback.map((item) => (
                <article key={item._id} className="p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">{item.name}</h2>
                      {item.email && <a className="text-sm text-purple-600 hover:underline" href={`mailto:${item.email}`}>{item.email}</a>}
                    </div>
                    <div className="flex items-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                      <span className="ml-2 text-sm text-gray-500">{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-gray-700">{item.experience}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => deleteFeedback(item)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={Boolean(actionId)}>
                      <Trash2 className="h-4 w-4" /> {actionId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
