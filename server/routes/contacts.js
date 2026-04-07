const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const contacts = db.prepare(`
    SELECT c.*,
      (SELECT MAX(t.touched_at) FROM touchpoints t WHERE t.contact_id = c.id AND t.user_id = c.user_id) AS last_touch_date,
      (SELECT COUNT(*) FROM touchpoints t WHERE t.contact_id = c.id AND t.user_id = c.user_id) AS touch_count
    FROM contacts c
    WHERE c.user_id = ?
  `).all(req.userId);
  res.json(contacts);
});

router.get('/:id', (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

router.post('/', (req, res) => {
  const {
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value, contact_method_2, contact_value_2,
    categories, notes,
  } = req.body;
  if (!first_name) return res.status(400).json({ error: 'First name is required' });
  if (!contact_method) return res.status(400).json({ error: 'Contact method is required' });
  if (!contact_value) return res.status(400).json({ error: 'Contact value is required' });

  const result = db.prepare(`
    INSERT INTO contacts
      (user_id, first_name, last_name, company, role, where_met, met_date,
       contact_method, contact_value, contact_method_2, contact_value_2, categories, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value,
    contact_method_2 || null, contact_value_2 || null,
    categories || '[]', notes,
  );

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(contact);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const {
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value, contact_method_2, contact_value_2,
    categories, notes,
  } = req.body;

  db.prepare(`
    UPDATE contacts SET
      first_name = ?, last_name = ?, company = ?, role = ?, where_met = ?, met_date = ?,
      contact_method = ?, contact_value = ?, contact_method_2 = ?, contact_value_2 = ?,
      categories = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `).run(
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value,
    contact_method_2 || null, contact_value_2 || null,
    categories || '[]', notes,
    req.params.id, req.userId,
  );

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json(contact);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });
  db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).send();
});

module.exports = router;
