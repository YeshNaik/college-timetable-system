const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/courses
router.get('/courses', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.department_id, d.department_name, c.credits,
             (SELECT COUNT(*) FROM Teacher_Courses tc WHERE tc.course_id = c.course_id) AS teacher_count
      FROM Courses c
      JOIN Departments d ON c.department_id = d.department_id
      ORDER BY c.course_code
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/courses
router.post('/courses', async (req, res) => {
  const { course_name, course_code, department_id, credits } = req.body;
  
  if (!course_name || !course_code || !department_id) {
    return res.status(400).json({ message: 'course_name, course_code, and department_id are required' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO Courses (course_name, course_code, department_id, credits) VALUES (?, ?, ?, ?)',
      [course_name, course_code, department_id, credits || 3]
    );
    res.status(201).json({
      course_id: result.insertId,
      course_name,
      course_code,
      department_id
    });
  } catch (err) {
    console.error('Error creating course:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/courses/:id
router.get('/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.course_id, c.course_name, c.course_code, c.department_id, c.credits, d.department_name
       FROM Courses c
       JOIN Departments d ON c.department_id = d.department_id
       WHERE c.course_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// PUT /api/courses/:id
router.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { course_name, course_code, department_id, credits } = req.body;
  
  try {
    const [result] = await pool.query(
      'UPDATE Courses SET course_name = ?, course_code = ?, department_id = ?, credits = ? WHERE course_id = ?',
      [course_name, course_code, department_id, credits || 3, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ course_id: parseInt(id), course_name, course_code, department_id });
  } catch (err) {
    console.error('Error updating course:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE /api/courses/:id
router.delete('/courses/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM Teacher_Courses WHERE course_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM Courses WHERE course_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/courses/:id/teachers
router.get('/courses/:id/teachers', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.teacher_id, t.teacher_name, t.email, d.department_name
      FROM Teachers t
      JOIN Departments d ON t.department_id = d.department_id
      WHERE t.teacher_id IN (SELECT teacher_id FROM Teacher_Courses WHERE course_id = ?)
      AND t.status = 'Active'
      ORDER BY t.teacher_name
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching qualified teachers:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
