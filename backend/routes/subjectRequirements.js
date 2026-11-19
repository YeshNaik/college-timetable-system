const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/subject-requirements
router.get('/subject-requirements', async (req, res) => {
  const { department_id, academic_year_id, semester } = req.query;
  
  let query = 
    `SELECT sr.*, c.course_name, c.course_code, c.credits, ay.year_name, ay.year_number
     FROM Subject_Requirements sr
     JOIN Courses c ON sr.course_id = c.course_id
     JOIN Academic_Years ay ON sr.academic_year_id = ay.academic_year_id
     WHERE sr.is_active = TRUE`;
  const params = [];

  if (department_id) {
    query += ' AND c.department_id = ?';
    params.push(department_id);
  }
  if (academic_year_id) {
    query += ' AND sr.academic_year_id = ?';
    params.push(academic_year_id);
  }
  if (semester) {
    query += ' AND sr.semester = ?';
    params.push(semester);
  }

  query += ' ORDER BY ay.year_number, sr.semester, c.course_code';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching subject requirements:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/subject-requirements
router.post('/subject-requirements', async (req, res) => {
  const { course_id, academic_year_id, semester, weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity } = req.body;
  if (!course_id || !academic_year_id || !semester) return res.status(400).json({ message: 'course_id, academic_year_id, and semester are required' });

  try {
    const [result] = await pool.query(
      `INSERT INTO Subject_Requirements 
       (course_id, academic_year_id, semester, weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, academic_year_id, semester, weekly_lectures || 0, weekly_practicals || 0, lecture_duration_minutes || 60, practical_duration_minutes || 120, practical_consecutive_slots || 2, required_room_type || 'Any', min_room_capacity || 30]
    );
    res.status(201).json({ requirement_id: result.insertId, course_id, academic_year_id, semester });
  } catch (err) { console.error('Error creating subject requirement:', err); if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Requirement already exists for this course/year/semester' }); res.status(500).json({ message: 'Database error' }); }
});

// GET /api/subject-requirements/:id
router.get('/subject-requirements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT sr.*, c.course_name, c.course_code, c.credits, ay.year_name, ay.year_number
       FROM Subject_Requirements sr
       JOIN Courses c ON sr.course_id = c.course_id
       JOIN Academic_Years ay ON sr.academic_year_id = ay.academic_year_id
       WHERE sr.requirement_id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Subject requirement not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching subject requirement:', err); res.status(500).json({ message: 'Database error' }); }
});

// PUT /api/subject-requirements/:id
router.put('/subject-requirements/:id', async (req, res) => {
  const { id } = req.params;
  const { weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity, is_active } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Subject_Requirements SET weekly_lectures = ?, weekly_practicals = ?, lecture_duration_minutes = ?, practical_duration_minutes = ?, practical_consecutive_slots = ?, required_room_type = ?, min_room_capacity = ?, is_active = ?, updated_at = NOW() WHERE requirement_id = ?`,
      [weekly_lectures || 0, weekly_practicals || 0, lecture_duration_minutes || 60, practical_duration_minutes || 120, practical_consecutive_slots || 2, required_room_type || 'Any', min_room_capacity || 30, is_active, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Subject requirement not found' });
    res.json({ message: 'Subject requirement updated' });
  } catch (err) { console.error('Error updating subject requirement:', err); res.status(500).json({ message: 'Database error' }); }
});

// DELETE /api/subject-requirements/:id
router.delete('/subject-requirements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Subject_Requirements WHERE requirement_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Subject requirement not found' });
    res.json({ message: 'Subject requirement deleted' });
  } catch (err) { console.error('Error deleting subject requirement:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
