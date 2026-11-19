const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/archive', async (req, res) => {
  const { status } = req.query;
  let whereClause = '';
  const params = [];
  if (status && ['Completed', 'Cancelled'].includes(status)) { whereClause = 'WHERE sa.status = ?'; params.push(status); }
  try {
    const [rows] = await pool.query(`
      SELECT sa.archive_id, sa.original_substitution_id AS substitution_id, sa.timetable_id,
             sa.absent_teacher_id, sa.substitute_teacher_id, sa.substitution_date,
             sa.status, sa.archived_at,
             t1.teacher_name AS absent_teacher_name, t2.teacher_name AS substitute_teacher_name
      FROM Substitutions_Archive sa
      JOIN Teachers t1 ON sa.absent_teacher_id = t1.teacher_id
      LEFT JOIN Teachers t2 ON sa.substitute_teacher_id = t2.teacher_id
      ${whereClause}
      ORDER BY sa.archived_at DESC
    `, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching archive:', err); res.status(500).json({ message: 'Database error' }); }
});

router.get('/archive/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT sa.archive_id, sa.original_substitution_id AS substitution_id, sa.timetable_id,
             sa.absent_teacher_id, sa.substitute_teacher_id, sa.substitution_date,
             sa.status, sa.archived_at,
             t1.teacher_name AS absent_teacher_name, t2.teacher_name AS substitute_teacher_name
      FROM Substitutions_Archive sa
      JOIN Teachers t1 ON sa.absent_teacher_id = t1.teacher_id
      LEFT JOIN Teachers t2 ON sa.substitute_teacher_id = t2.teacher_id
      WHERE sa.archive_id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Archive record not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching archive record:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
