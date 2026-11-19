const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/time-slots', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT slot_id, day_of_week, start_time, end_time
      FROM Time_Slots
      ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), start_time
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching time slots:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

router.post('/time-slots', async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  if (!day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: 'day_of_week, start_time, and end_time are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO Time_Slots (day_of_week, start_time, end_time) VALUES (?, ?, ?)',
      [day_of_week, start_time, end_time]
    );
    res.status(201).json({ slot_id: result.insertId, day_of_week, start_time, end_time });
  } catch (err) {
    console.error('Error creating time slot:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Time slot already exists' });
    res.status(500).json({ message: 'Database error' });
  }
});

router.get('/time-slots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT slot_id, day_of_week, start_time, end_time FROM Time_Slots WHERE slot_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Time slot not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching time slot:', err); res.status(500).json({ message: 'Database error' }); }
});

router.put('/time-slots/:id', async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;
  try {
    const [result] = await pool.query('UPDATE Time_Slots SET day_of_week = ?, start_time = ?, end_time = ? WHERE slot_id = ?', [day_of_week, start_time, end_time, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Time slot not found' });
    res.json({ slot_id: parseInt(id), day_of_week, start_time, end_time });
  } catch (err) { console.error('Error updating time slot:', err); if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Time slot already exists' }); res.status(500).json({ message: 'Database error' }); }
});

router.delete('/time-slots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Time_Slots WHERE slot_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Time slot not found' });
    res.json({ message: 'Time slot deleted' });
  } catch (err) { console.error('Error deleting time slot:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
