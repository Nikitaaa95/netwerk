const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getContacts: () => request('/contacts'),
  createContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
  getTouchpoints: (contactId) => request(`/contacts/${contactId}/touchpoints`),
  addTouchpoint: (contactId, data) => request(`/contacts/${contactId}/touchpoints`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTouchpoint: (contactId, id) => request(`/contacts/${contactId}/touchpoints/${id}`, { method: 'DELETE' }),
};
