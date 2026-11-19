const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/teacher-availability
router.get('/teacher-availability', async (req, res) => {
  const { teacher_id, day_of_week } = req.query;
  
  let query = 
    `SELECT ta.*, t.teacher_name, ts.day_of_week, ts.start_time, ts.end_time
     FROM Teacher_Availability ta
     JOIN Teachers t ON ta.teacher_id = t.teacher_id
     JOIN Time_Slots ts ON ta.slot_id = ts.slot_id
     WHERE 1=1`;
  const params = [];

  if (teacher_id) { query += ' AND ta.teacher_id = ?'; params.push(teacher_id); }
  if (day_of_week) { query += ' AND ts.day_of_week = ?'; params.push(day_of_week); }

  query += ' ORDER BY t.teacher_name, ts.day_of_week, ts.start_time';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching teacher availability:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/teacher-availability
router.post('/teacher-availability', async (req, res) => {
  const { teacher_id, day_of_week, slot_id, is_available, preference_level } = req.body;
  if (!teacher_id || !day_of_week || !slot_id) return res.status(400).json({ message: 'teacher_id, day_of_week, and slot_id are required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO Teacher_Availability (teacher_id, day_of_week, slot_id, is_available, preference_level) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), preference_level = VALUES(preference_level)',
      [teacher_id, day_of_week, slot_id, is_available !== false, preference_level || 'Available']
    );
    res.status(201).json({ message: 'Availability saved', availability_id: result.insertId });
  } catch (err) { console.error('Error saving teacher availability:', err); res.status(500).json({ message: 'Database error' }); }
});

// PUT /api/teacher-availability/:id
router.put('/teacher-availability/:id', async (req, res) => {
  const { id } = req.params;
  const { is_available, preference_level } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE Teacher_Availability SET is_available = ?, preference_level = ? WHERE availability_id = ?',
      [is_available, preference_level || 'Available', id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Availability record not found' });
    res.json({ message: 'Availability updated' });
  } catch (err) { console.error('Error updating teacher availability:', err); res.status(500).json({ message: 'Database error' }); }
});

// DELETE /api/teacher-availability/:id
router.delete('/teacher-availability/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Teacher_Availability WHERE availability_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Availability record not found' });
    res.json({ message: 'Availability deleted' });
  } catch (err) { console.error('Error deleting teacher availability:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/teacher-availability/bulk - Bulk update availability for a teacher
router.post('/teacher-availability/bulk', async (req, res) => {
  const { teacher_id, availabilities } = req.body;
  if (!teacher_id || !Array.isArray(availabilities)) return res.status(400).json({ message: 'teacher_id and availabilities array are required' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Delete existing availability for this teacher
    await connection.query('DELETE FROM Teacher_Availability WHERE teacher_id = ?', [teacher_id]);

    // Insert new availabilities
    if (availabilities.length > 0) {
      const values = availabilities.map(a => [teacher_id, a.day_of_week, a.slot_id, a.is_available !== false, a.preference_level || 'Available']);
      await connection.query('INSERT INTO Teacher_Availability (teacher_id, day_of_week, slot_id, is_available, preference_level) VALUES ?', [values]);
    }

    await connection.commit();
    res.json({ message: 'Availability updated successfully' });
  } catch (err) { await connection.rollback(); console.error('Error bulk updating availability:', err); res.status(500).json({ message: 'Database error' }); } finally { connection.release(); }
});

module.exports = router;
