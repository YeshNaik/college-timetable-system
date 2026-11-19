const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/audit', async (req, res) => {
  const { action } = req.query;
  let whereClause = '';
  const params = [];
  if (action) { whereClause = 'WHERE action = ?'; params.push(action); }
  try {
    const [rows] = await pool.query(`
      SELECT audit_id, substitution_id, action, description AS action_description, performed_at, changed_by
      FROM Substitution_Audit
      ${whereClause}
      ORDER BY performed_at DESC
    `, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching audit logs:', err); res.status(500).json({ message: 'Database error' }); }
});

router.get('/audit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT audit_id, substitution_id, action, description AS action_description, performed_at, changed_by FROM Substitution_Audit WHERE audit_id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Audit record not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching audit record:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
