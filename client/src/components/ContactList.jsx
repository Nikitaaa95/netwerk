import { useState, useEffect, useRef } from 'react';
import TouchpointHistory from './TouchpointHistory';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function parseCategories(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  return Math.floor((today - then) / (1000 * 60 * 60 * 24));
}

function touchBadge(contact) {
  if (contact.last_touch_date) {
    const diff = daysAgo(contact.last_touch_date);
    if (diff === 0) return { label: 'Last touch: Today', variant: 'green' };
    if (diff === 1) return { label: 'Last touch: Yesterday', variant: 'green' };
    if (diff >= 30) return { label: `Last touch: ${diff} days ago`, variant: 'urgent' };
    return { label: `Last touch: ${diff} days ago`, variant: 'green' };
  }
  // No touchpoints — check if recently met
  const metDiff = daysAgo(contact.met_date);
  if (metDiff !== null && metDiff <= 7) {
    return { label: 'Recently met', variant: 'new' };
  }
  return { label: 'Never touched', variant: 'never' };
}

export default function ContactList({ contacts, onEdit, onDelete, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const expandedRef = useRef(null);

  useEffect(() => {
    if (!expandedId) return;
    function handleClickOutside(e) {
      if (expandedRef.current && !expandedRef.current.contains(e.target)) {
        setExpandedId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedId]);

  function toggleHistory(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  if (contacts.length === 0) {
    return <p className="empty">No contacts found. Add one to get started.</p>;
  }

  return (
    <ul className="contact-list">
      {contacts.map(contact => {
        const categories = parseCategories(contact.categories);
        const badge = touchBadge(contact);
        const isExpanded = expandedId === contact.id;

        return (
          <li key={contact.id} className="contact-card" ref={isExpanded ? expandedRef : null}>
            <div className="contact-main">
              <div className="contact-info">
                <div className="contact-header">
                  <h2>{contact.first_name} {contact.last_name}</h2>
                  {categories.length > 0 && (
                    <div className="category-tags">
                      {categories.map(cat => (
                        <span key={cat} className="category-tag">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>

                {(contact.role || contact.company) && (
                  <p>{contact.role}{contact.role && contact.company ? ' at ' : ''}{contact.company}</p>
                )}

                <div className="contact-meta">
                  {contact.where_met && <span>Met at {contact.where_met}</span>}
                  {contact.met_date && (
                    <span>{contact.where_met ? ' · ' : ''}{formatDate(contact.met_date)}</span>
                  )}
                </div>

                <div className="contact-methods">
                  {contact.contact_value && (
                    <span className="contact-method">
                      {contact.contact_method === 'email' ? '✉' : '✆'} {contact.contact_value}
                    </span>
                  )}
                  {contact.contact_value_2 && (
                    <span className="contact-method">
                      {contact.contact_method_2 === 'email' ? '✉' : '✆'} {contact.contact_value_2}
                    </span>
                  )}
                </div>

                {contact.notes && <p className="notes">{contact.notes}</p>}
              </div>

              <div className="contact-actions">
                <button onClick={() => onEdit(contact)}>Edit</button>
                <button className="danger" onClick={() => onDelete(contact.id)}>Delete</button>
              </div>
            </div>

            {/* Touch footer */}
            <div className="touch-footer">
              <div className="touch-status">
                <span className={`touch-badge ${badge.variant}`}>{badge.label}</span>
                {contact.touch_count > 0 && (
                  <span className="touch-count">{contact.touch_count} touch{contact.touch_count !== 1 ? 'es' : ''}</span>
                )}
              </div>
              <button
                type="button"
                className={`history-toggle ${isExpanded ? 'active' : ''}`}
                onClick={() => toggleHistory(contact.id)}
              >
                {isExpanded ? 'Hide History' : 'History'}
              </button>
            </div>

            {isExpanded && (
              <TouchpointHistory
                contactId={contact.id}
                onTouchSaved={onRefresh}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
