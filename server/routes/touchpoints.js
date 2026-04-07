const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// Verify the contact belongs to the requesting user
function getContact(contactId, userId) {
  return db.prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?').get(contactId, userId);
}

// GET /api/contacts/:contactId/touchpoints
router.get('/', (req, res) => {
  if (!getContact(req.params.contactId, req.userId)) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const rows = db.prepare(
    'SELECT * FROM touchpoints WHERE contact_id = ? AND user_id = ? ORDER BY touched_at DESC'
  ).all(req.params.contactId, req.userId);
  res.json(rows);
});

// POST /api/contacts/:contactId/touchpoints
router.post('/', (req, res) => {
  if (!getContact(req.params.contactId, req.userId)) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const { note, touched_at } = req.body;
  if (!touched_at) return res.status(400).json({ error: 'touched_at date is required' });

  const result = db.prepare(
    'INSERT INTO touchpoints (contact_id, user_id, note, touched_at) VALUES (?, ?, ?, ?)'
  ).run(req.params.contactId, req.userId, note || null, touched_at);

  const row = db.prepare('SELECT * FROM touchpoints WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// DELETE /api/contacts/:contactId/touchpoints/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare(
    'SELECT id FROM touchpoints WHERE id = ? AND contact_id = ? AND user_id = ?'
  ).get(req.params.id, req.params.contactId, req.userId);
  if (!existing) return res.status(404).json({ error: 'Touchpoint not found' });

  db.prepare('DELETE FROM touchpoints WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
