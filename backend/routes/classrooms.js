const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/classrooms', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT classroom_id, room_number, building, capacity, room_type
      FROM Classrooms
      ORDER BY room_number
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching classrooms:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

router.post('/classrooms', async (req, res) => {
  const { room_number, building, capacity, room_type } = req.body;
  if (!room_number) {
    return res.status(400).json({ message: 'room_number is required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO Classrooms (room_number, building, capacity, room_type) VALUES (?, ?, ?, ?)',
      [room_number, building || 'Main', capacity || 60, room_type || 'Lecture Hall']
    );
    res.status(201).json({ classroom_id: result.insertId, room_number, building });
  } catch (err) {
    console.error('Error creating classroom:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Classroom already exists in this building' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

router.get('/classrooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT classroom_id, room_number, building, capacity, room_type FROM Classrooms WHERE classroom_id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Classroom not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching classroom:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

router.put('/classrooms/:id', async (req, res) => {
  const { id } = req.params;
  const { room_number, building, capacity, room_type } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE Classrooms SET room_number = ?, building = ?, capacity = ?, room_type = ? WHERE classroom_id = ?',
      [room_number, building || 'Main', capacity || 60, room_type || 'Lecture Hall', id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Classroom not found' });
    res.json({ classroom_id: parseInt(id), room_number, building });
  } catch (err) {
    console.error('Error updating classroom:', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Classroom already exists in this building' });
    res.status(500).json({ message: 'Database error' });
  }
});

router.delete('/classrooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Classrooms WHERE classroom_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Classroom not found' });
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    console.error('Error deleting classroom:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
