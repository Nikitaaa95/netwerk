import { useState, useEffect, useMemo } from 'react';
import ContactList from './components/ContactList';
import ContactForm from './components/ContactForm';
import AuthForm from './components/AuthForm';
import { api } from './api';
import './App.css';

function parseCategories(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor((today - new Date(y, m - 1, d)) / (1000 * 60 * 60 * 24));
}

// The "effective" last touch: logged touchpoint date, falling back to met_date
function effectiveTouchDays(contact) {
  return daysAgo(contact.last_touch_date || contact.met_date);
}


export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('username'));
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState('first_name');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (username) fetchContacts();
  }, [username]);

  async function fetchContacts() {
    const data = await api.getContacts();
    if (Array.isArray(data)) setContacts(data);
  }

  async function handleSave(contact) {
    if (contact.id) {
      await api.updateContact(contact.id, contact);
    } else {
      await api.createContact(contact);
    }
    setShowForm(false);
    setSelected(null);
    fetchContacts();
  }

  async function handleDelete(id) {
    await api.deleteContact(id);
    fetchContacts();
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUsername(null);
    setContacts([]);
  }

  const allCategories = useMemo(() => {
    const cats = contacts.flatMap(c => parseCategories(c.categories));
    return [...new Set(cats)].sort();
  }, [contacts]);

  const displayedContacts = useMemo(() => {
    let list = [...contacts];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c => {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const where = (c.where_met || '').toLowerCase();
        const cats = parseCategories(c.categories).join(' ').toLowerCase();
        return name.includes(q) || where.includes(q) || cats.includes(q);
      });
    }

    if (categoryFilter) {
      list = list.filter(c => parseCategories(c.categories).includes(categoryFilter));
    }

    list.sort((a, b) => {
      if (sortBy === 'first_name') return (a.first_name || '').localeCompare(b.first_name || '');
      if (sortBy === 'last_name')  return (a.last_name  || '').localeCompare(b.last_name  || '');
      if (sortBy === 'met_date') {
        if (!a.met_date) return 1;
        if (!b.met_date) return -1;
        return new Date(a.met_date) - new Date(b.met_date);
      }
      if (sortBy === 'last_touch') {
        const aDays = effectiveTouchDays(a);
        const bDays = effectiveTouchDays(b);
        if (aDays === null) return 1;
        if (bDays === null) return -1;
        return aDays - bDays;
      }
      return 0;
    });

    return list;
  }, [contacts, sortBy, categoryFilter, searchQuery]);

  if (!username) return <AuthForm onAuth={setUsername} />;

  return (
    <div className="app">
      <header>
        <h1>NetWerk</h1>
        <div className="header-right">
          <span className="username">@{username}</span>
          {!showForm && (
            <button onClick={() => { setSelected(null); setShowForm(true); }}>+ Add Contact</button>
          )}
          <button className="secondary" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {showForm ? (
        <ContactForm
          contact={selected}
          existingCategories={allCategories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setSelected(null); }}
        />
      ) : (
        <>
          <div className="controls">
            <div className="search-control">
              <label>Search</label>
              <input
                className="search-bar"
                type="search"
                placeholder="Name, category, where met..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="controls-row">
              <div className="sort-control">
                <label>Sort by</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  <option value="met_date">Date Met</option>
                  <option value="last_touch">Last Touch</option>
                </select>
              </div>

              {allCategories.length > 0 && (
                <div className="filter-control">
                  <label>Category</label>
                  <div className="category-chips">
                    <button
                      className={`chip ${!categoryFilter ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('')}
                    >All</button>
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        className={`chip ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ContactList
            contacts={displayedContacts}
            onEdit={(c) => { setSelected(c); setShowForm(true); }}
            onDelete={handleDelete}
            onRefresh={fetchContacts}
          />
        </>
      )}
    </div>
  );
}
