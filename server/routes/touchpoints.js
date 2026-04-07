const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');

async function getContact(contactId, userId) {
  const { rows } = await pool.query(
    'SELECT id FROM contacts WHERE id = $1 AND user_id = $2',
    [contactId, userId]
  );
  return rows[0];
}

router.get('/', async (req, res) => {
  if (!await getContact(req.params.contactId, req.userId)) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const { rows } = await pool.query(
    'SELECT * FROM touchpoints WHERE contact_id = $1 AND user_id = $2 ORDER BY touched_at DESC',
    [req.params.contactId, req.userId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  if (!await getContact(req.params.contactId, req.userId)) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const { note, touched_at } = req.body;
  if (!touched_at) return res.status(400).json({ error: 'touched_at date is required' });

  const { rows } = await pool.query(
    'INSERT INTO touchpoints (contact_id, user_id, note, touched_at) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.params.contactId, req.userId, note || null, touched_at]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id FROM touchpoints WHERE id = $1 AND contact_id = $2 AND user_id = $3',
    [req.params.id, req.params.contactId, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Touchpoint not found' });
  await pool.query('DELETE FROM touchpoints WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
