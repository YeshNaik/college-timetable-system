const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/sections
router.get('/sections', async (req, res) => {
  const { academic_year_id } = req.query;
  
  let query = 
    `SELECT s.*, ay.year_name, ay.year_number, d.department_name
     FROM Sections s
     JOIN Academic_Years ay ON s.academic_year_id = ay.academic_year_id
     JOIN Departments d ON ay.department_id = d.department_id
     WHERE s.is_active = TRUE`;
  const params = [];

  if (academic_year_id) {
    query += ' AND s.academic_year_id = ?';
    params.push(academic_year_id);
  }

  query += ' ORDER BY ay.year_number, s.section_name';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching sections:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/sections
router.post('/sections', async (req, res) => {
  const { academic_year_id, section_name, student_count } = req.body;
  if (!academic_year_id || !section_name) return res.status(400).json({ message: 'academic_year_id and section_name are required' });

  try {
    const [ay] = await pool.query('SELECT year_number FROM Academic_Years WHERE academic_year_id = ?', [academic_year_id]);
    if (ay.length === 0) return res.status(404).json({ message: 'Academic year not found' });
    
    const section_code = `SEC-${ay[0].year_number}-${section_name}`;
    const [result] = await pool.query(
      'INSERT INTO Sections (academic_year_id, section_name, section_code, student_count) VALUES (?, ?, ?, ?)',
      [academic_year_id, section_name, section_code, student_count || 60]
    );
    res.status(201).json({ section_id: result.insertId, academic_year_id, section_name, section_code, student_count: student_count || 60 });
  } catch (err) { console.error('Error creating section:', err); if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Section already exists for this academic year' }); res.status(500).json({ message: 'Database error' }); }
});

// GET /api/sections/:id
router.get('/sections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.*, ay.year_name, ay.year_number, d.department_name
       FROM Sections s
       JOIN Academic_Years ay ON s.academic_year_id = ay.academic_year_id
       JOIN Departments d ON ay.department_id = d.department_id
       WHERE s.section_id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Section not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching section:', err); res.status(500).json({ message: 'Database error' }); }
});

// PUT /api/sections/:id
router.put('/sections/:id', async (req, res) => {
  const { id } = req.params;
  const { section_name, student_count, is_active } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE Sections SET section_name = ?, student_count = ?, is_active = ? WHERE section_id = ?',
      [section_name, student_count || 60, is_active, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section updated' });
  } catch (err) { console.error('Error updating section:', err); res.status(500).json({ message: 'Database error' }); }
});

// DELETE /api/sections/:id
router.delete('/sections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Sections WHERE section_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section deleted' });
  } catch (err) { console.error('Error deleting section:', err); if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Cannot delete - referenced by timetable entries' }); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
