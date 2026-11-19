const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/departments
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.department_id, d.department_name, d.department_code,
             (SELECT COUNT(*) FROM Teachers t WHERE t.department_id = d.department_id AND t.status = 'Active') AS teacher_count,
             (SELECT COUNT(*) FROM Courses c WHERE c.department_id = d.department_id) AS course_count
      FROM Departments d
      ORDER BY d.department_name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/departments
router.post('/departments', async (req, res) => {
  const { department_name, department_code } = req.body;
  
  if (!department_name) {
    return res.status(400).json({ message: 'Department name is required' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO Departments (department_name, department_code) VALUES (?, ?)',
      [department_name, department_code || null]
    );
    res.status(201).json({
      department_id: result.insertId,
      department_name,
      department_code
    });
  } catch (err) {
    console.error('Error creating department:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department code already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/departments/:id
router.get('/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.department_id, d.department_name, d.department_code,
              (SELECT COUNT(*) FROM Teachers t WHERE t.department_id = d.department_id AND t.status = 'Active') AS teacher_count,
              (SELECT COUNT(*) FROM Courses c WHERE c.department_id = d.department_id) AS course_count
       FROM Departments d WHERE d.department_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// PUT /api/departments/:id
router.put('/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { department_name, department_code } = req.body;
  
  try {
    const [result] = await pool.query(
      'UPDATE Departments SET department_name = ?, department_code = ? WHERE department_id = ?',
      [department_name, department_code, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ department_id: parseInt(id), department_name, department_code });
  } catch (err) {
    console.error('Error updating department:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Department code already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE /api/departments/:id
router.delete('/departments/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.query('DELETE FROM Departments WHERE department_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error('Error deleting department:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Cannot delete department with associated teachers or courses' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;