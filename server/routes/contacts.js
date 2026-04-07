const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*,
      (SELECT MAX(t.touched_at) FROM touchpoints t WHERE t.contact_id = c.id AND t.user_id = c.user_id) AS last_touch_date,
      (SELECT COUNT(*) FROM touchpoints t WHERE t.contact_id = c.id AND t.user_id = c.user_id)::int AS touch_count
    FROM contacts c
    WHERE c.user_id = $1
  `, [req.userId]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Contact not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const {
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value, contact_method_2, contact_value_2,
    categories, notes,
  } = req.body;
  if (!first_name) return res.status(400).json({ error: 'First name is required' });
  if (!contact_method) return res.status(400).json({ error: 'Contact method is required' });
  if (!contact_value) return res.status(400).json({ error: 'Contact value is required' });

  const { rows } = await pool.query(`
    INSERT INTO contacts
      (user_id, first_name, last_name, company, role, where_met, met_date,
       contact_method, contact_value, contact_method_2, contact_value_2, categories, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `, [
    req.userId, first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value,
    contact_method_2 || null, contact_value_2 || null,
    categories || '[]', notes,
  ]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const existing = await pool.query(
    'SELECT id FROM contacts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!existing.rows[0]) return res.status(404).json({ error: 'Contact not found' });

  const {
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value, contact_method_2, contact_value_2,
    categories, notes,
  } = req.body;

  const { rows } = await pool.query(`
    UPDATE contacts SET
      first_name=$1, last_name=$2, company=$3, role=$4, where_met=$5, met_date=$6,
      contact_method=$7, contact_value=$8, contact_method_2=$9, contact_value_2=$10,
      categories=$11, notes=$12
    WHERE id=$13 AND user_id=$14
    RETURNING *
  `, [
    first_name, last_name, company, role, where_met, met_date,
    contact_method, contact_value,
    contact_method_2 || null, contact_value_2 || null,
    categories || '[]', notes,
    req.params.id, req.userId,
  ]);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const existing = await pool.query(
    'SELECT id FROM contacts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!existing.rows[0]) return res.status(404).json({ error: 'Contact not found' });
  await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

module.exports = router;
