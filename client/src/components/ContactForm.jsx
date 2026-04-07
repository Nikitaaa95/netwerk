import { useState, useRef, useEffect } from 'react';

function validateContactValue(method, value) {
  if (!value) return false;
  if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (method === 'phone') return /^\+?[\d\s()\-.]{7,}$/.test(value);
  return false;
}

function parseCategories(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

export default function ContactForm({ contact, existingCategories = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    id: contact?.id || null,
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    company: contact?.company || '',
    role: contact?.role || '',
    where_met: contact?.where_met || '',
    met_date: contact?.met_date || '',
    contact_method: contact?.contact_method || '',
    contact_value: contact?.contact_value || '',
    contact_method_2: contact?.contact_method_2 || '',
    contact_value_2: contact?.contact_value_2 || '',
    notes: contact?.notes || '',
  });

  const [tags, setTags] = useState(() => parseCategories(contact?.categories));
  const [catInput, setCatInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSecondMethod, setShowSecondMethod] = useState(!!(contact?.contact_method_2));
  const [errors, setErrors] = useState({});
  const catInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Compute autocomplete suggestions
  useEffect(() => {
    if (catInput.trim()) {
      const filtered = existingCategories.filter(
        cat => cat.toLowerCase().includes(catInput.toLowerCase()) && !tags.includes(cat)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [catInput, existingCategories, tags]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'contact_method') {
      setForm(prev => ({ ...prev, contact_method: value, contact_value: '' }));
    } else if (name === 'contact_method_2') {
      setForm(prev => ({ ...prev, contact_method_2: value, contact_value_2: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function addTag(value) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setCatInput('');
    setSuggestions([]);
  }

  function handleCatKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && catInput) {
        addTag(suggestions[0]);
      } else {
        addTag(catInput);
      }
    } else if (e.key === 'Backspace' && !catInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  }

  function removeTag(tag) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function removeSecondMethod() {
    setShowSecondMethod(false);
    setForm(prev => ({ ...prev, contact_method_2: '', contact_value_2: '' }));
    setErrors(prev => ({ ...prev, contact_value_2: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.contact_method) errs.contact_method = 'Contact method is required';
    else if (!validateContactValue(form.contact_method, form.contact_value)) {
      errs.contact_value = form.contact_method === 'email'
        ? 'Enter a valid email address'
        : 'Enter a valid phone number (min 7 digits)';
    }
    if (showSecondMethod && form.contact_method_2 && form.contact_value_2) {
      if (!validateContactValue(form.contact_method_2, form.contact_value_2)) {
        errs.contact_value_2 = form.contact_method_2 === 'email'
          ? 'Enter a valid email address'
          : 'Enter a valid phone number (min 7 digits)';
      }
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      ...form,
      contact_method_2: showSecondMethod ? form.contact_method_2 : '',
      contact_value_2: showSecondMethod ? form.contact_value_2 : '',
      categories: JSON.stringify(tags),
    });
  }

  const methodLabel = (m) => m === 'email' ? 'Email Address' : m === 'phone' ? 'Phone Number' : 'Contact Info';
  const availableMethod2Options = ['email', 'phone'].filter(m => m !== form.contact_method);

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <h2>{contact ? 'Edit Contact' : 'Add Contact'}</h2>

      <div className="form-row">
        <label>First Name *
          <input name="first_name" value={form.first_name} onChange={handleChange} />
          {errors.first_name && <span className="error">{errors.first_name}</span>}
        </label>
        <label>Last Name
          <input name="last_name" value={form.last_name} onChange={handleChange} />
        </label>
      </div>

      <div className="form-row">
        <label>Company
          <input name="company" value={form.company} onChange={handleChange} />
        </label>
        <label>Role
          <input name="role" value={form.role} onChange={handleChange} />
        </label>
      </div>

      <div className="form-row">
        <label>Where You Met
          <input name="where_met" value={form.where_met} onChange={handleChange} />
        </label>
        <label>When You Met
          <input type="date" name="met_date" value={form.met_date} onChange={handleChange} />
        </label>
      </div>

      {/* Primary contact method */}
      <div className="form-row">
        <label>Contact Method *
          <select name="contact_method" value={form.contact_method} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          {errors.contact_method && <span className="error">{errors.contact_method}</span>}
        </label>
        <label>{methodLabel(form.contact_method)}{form.contact_method ? ' *' : ''}
          <input
            name="contact_value"
            value={form.contact_value}
            onChange={handleChange}
            type={form.contact_method === 'email' ? 'email' : 'text'}
            placeholder={form.contact_method === 'phone' ? '+1 (555) 000-0000' : form.contact_method === 'email' ? 'name@example.com' : ''}
            disabled={!form.contact_method}
          />
          {errors.contact_value && <span className="error">{errors.contact_value}</span>}
        </label>
      </div>

      {/* Second contact method */}
      {showSecondMethod ? (
        <div className="form-row second-method">
          <label>Second Method
            <select name="contact_method_2" value={form.contact_method_2} onChange={handleChange}>
              <option value="">Select...</option>
              {availableMethod2Options.map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>
          <label>
            {methodLabel(form.contact_method_2)}
            <div className="input-with-remove">
              <input
                name="contact_value_2"
                value={form.contact_value_2}
                onChange={handleChange}
                type={form.contact_method_2 === 'email' ? 'email' : 'text'}
                placeholder={form.contact_method_2 === 'phone' ? '+1 (555) 000-0000' : form.contact_method_2 === 'email' ? 'name@example.com' : ''}
                disabled={!form.contact_method_2}
              />
              <button type="button" className="remove-btn" onClick={removeSecondMethod} title="Remove">×</button>
            </div>
            {errors.contact_value_2 && <span className="error">{errors.contact_value_2}</span>}
          </label>
        </div>
      ) : (
        <button type="button" className="link-btn add-method-btn" onClick={() => setShowSecondMethod(true)}>
          + Add another contact method
        </button>
      )}

      {/* Categories tag input */}
      <label>Categories
        <div className="tag-input-wrapper" onClick={() => catInputRef.current?.focus()}>
          {tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" className="tag-remove" onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>×</button>
            </span>
          ))}
          <div className="tag-input-container">
            <input
              ref={catInputRef}
              className="tag-input"
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              onKeyDown={handleCatKeyDown}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder={tags.length === 0 ? 'Type and press Enter to add...' : ''}
            />
            {suggestions.length > 0 && (
              <ul className="suggestions" ref={suggestionsRef}>
                {suggestions.map(s => (
                  <li key={s} onMouseDown={(e) => { e.preventDefault(); addTag(s); }}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </label>

      <label>Notes
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} />
      </label>

      <div className="form-actions">
        <button type="submit">{contact ? 'Save Changes' : 'Add Contact'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
