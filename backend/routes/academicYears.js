const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/academic-years
router.get('/academic-years', async (req, res) => {
  const { department_id } = req.query;
  
  let query = 
    `SELECT ay.*, d.department_name
     FROM Academic_Years ay
     JOIN Departments d ON ay.department_id = d.department_id
     WHERE ay.is_active = TRUE`;
  const params = [];

  if (department_id) {
    query += ' AND ay.department_id = ?';
    params.push(department_id);
  }

  query += ' ORDER BY d.department_name, ay.year_number';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching academic years:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/academic-years
router.post('/academic-years', async (req, res) => {
  const { department_id, year_name, year_number } = req.body;
  
  if (!department_id || !year_name || !year_number) {
    return res.status(400).json({ message: 'department_id, year_name, and year_number are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Academic_Years (department_id, year_name, year_number) VALUES (?, ?, ?)',
      [department_id, year_name, year_number]
    );
    res.status(201).json({ academic_year_id: result.insertId, department_id, year_name, year_number });
  } catch (err) {
    console.error('Error creating academic year:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Academic year already exists for this department' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/academic-years/:id
router.get('/academic-years/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT ay.*, d.department_name FROM Academic_Years ay
       JOIN Departments d ON ay.department_id = d.department_id
       WHERE ay.academic_year_id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Academic year not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching academic year:', err); res.status(500).json({ message: 'Database error' }); }
});

// PUT /api/academic-years/:id
router.put('/academic-years/:id', async (req, res) => {
  const { id } = req.params;
  const { year_name, year_number, is_active } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE Academic_Years SET year_name = ?, year_number = ?, is_active = ? WHERE academic_year_id = ?',
      [year_name, year_number, is_active, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Academic year not found' });
    res.json({ message: 'Academic year updated' });
  } catch (err) { console.error('Error updating academic year:', err); if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Duplicate academic year' }); res.status(500).json({ message: 'Database error' }); }
});

// DELETE /api/academic-years/:id
router.delete('/academic-years/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Academic_Years WHERE academic_year_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Academic year not found' });
    res.json({ message: 'Academic year deleted' });
  } catch (err) { console.error('Error deleting academic year:', err); if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Cannot delete - referenced by sections or requirements' }); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
