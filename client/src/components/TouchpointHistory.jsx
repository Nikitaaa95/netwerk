import { useState, useEffect } from 'react';
import { api } from '../api';

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function TouchpointHistory({ contactId, onTouchSaved }) {
  const [touchpoints, setTouchpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTouchpoints();
  }, [contactId]);

  async function fetchTouchpoints() {
    setLoading(true);
    const data = await api.getTouchpoints(contactId);
    if (Array.isArray(data)) setTouchpoints(data);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    await api.addTouchpoint(contactId, { touched_at: date, note });
    setNote('');
    setDate(today());
    setShowForm(false);
    setSaving(false);
    await fetchTouchpoints();
    onTouchSaved();
  }

  async function handleDelete(id) {
    await api.deleteTouchpoint(contactId, id);
    await fetchTouchpoints();
    onTouchSaved();
  }

  return (
    <div className="touchpoint-history">
      <div className="touchpoint-header">
        <span className="touchpoint-title">Touch History</span>
        {!showForm && (
          <button type="button" className="link-btn" onClick={() => setShowForm(true)}>+ Log Touch</button>
        )}
      </div>

      {showForm && (
        <form className="touchpoint-form" onSubmit={handleAdd}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (optional)"
          />
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      {loading ? (
        <p className="tp-empty">Loading...</p>
      ) : touchpoints.length === 0 ? (
        <p className="tp-empty">No touches logged yet.</p>
      ) : (
        <>
          <ul className="touchpoint-list">
            {(showAll ? touchpoints : touchpoints.slice(0, 1)).map(tp => (
              <li key={tp.id} className="touchpoint-item">
                <div className="tp-content">
                  <span className="tp-date">{formatDate(tp.touched_at)}</span>
                  {tp.note && <span className="tp-note">{tp.note}</span>}
                </div>
                <button
                  type="button"
                  className="tp-delete"
                  onClick={() => handleDelete(tp.id)}
                  title="Remove"
                >×</button>
              </li>
            ))}
          </ul>
          {touchpoints.length > 1 && (
            <button type="button" className="link-btn tp-toggle" onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Show less' : `Full history (${touchpoints.length - 1} more)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
