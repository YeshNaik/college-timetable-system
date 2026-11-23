const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/substitutions
router.get('/substitutions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.substitution_id, s.timetable_id, s.substitution_date, s.status, s.assigned_at,
             t1.teacher_name AS absent_teacher_name, t2.teacher_name AS substitute_teacher_name,
             c.course_code, c.course_name, cr.room_number, 
             ts.start_time, ts.end_time, ts.day_of_week
      FROM Substitutions s
      JOIN Timetable tt ON s.timetable_id = tt.timetable_id
      JOIN Teachers t1 ON s.absent_teacher_id = t1.teacher_id
      LEFT JOIN Teachers t2 ON s.substitute_teacher_id = t2.teacher_id
      JOIN Courses c ON tt.course_id = c.course_id
      JOIN Classrooms cr ON tt.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
      ORDER BY s.assigned_at DESC
    `);
    res.json(rows);
  } catch (err) { console.error('Error fetching substitutions:', err); res.status(500).json({ message: 'Database error' }); }
});

// GET /api/substitutions/affected
router.get('/substitutions/affected', async (req, res) => {
  const { teacher_id, date } = req.query;
  if (!teacher_id || !date) return res.status(400).json({ message: 'teacher_id and date are required' });
  try {
    const [rows] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code, cr.room_number, ts.start_time, ts.end_time, ts.day_of_week
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      WHERE t.teacher_id = ?
        AND ts.day_of_week = DAYNAME(?)
        AND NOT EXISTS (
          SELECT 1 FROM Substitutions s
          WHERE s.timetable_id = t.timetable_id
            AND s.substitution_date = ?
            AND s.status IN ('Assigned', 'Confirmed')
        )
      ORDER BY ts.start_time
    `, [teacher_id, date, date]);
    res.json(rows);
  } catch (err) { console.error('Error fetching affected entries:', err); res.status(500).json({ message: 'Database error' }); }
});

// GET /api/substitutions/candidates
router.get('/substitutions/candidates', async (req, res) => {
  const { timetable_id, date } = req.query;
  if (!timetable_id || !date) return res.status(400).json({ message: 'timetable_id and date are required' });
  try {
    const [entry] = await pool.query(`
      SELECT tt.course_id, tt.teacher_id, tt.slot_id, tt.academic_year, ts.day_of_week
      FROM Timetable tt
      JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
      WHERE tt.timetable_id = ?
    `, [timetable_id]);
    if (entry.length === 0) return res.status(404).json({ message: 'Timetable entry not found' });
    
    const { course_id, teacher_id: absent_teacher_id, slot_id, academic_year } = entry[0];
    
    const [candidates] = await pool.query(`
      SELECT t.teacher_id, t.teacher_name, d.department_name,
             c.course_code AS qualified_course,
             CASE WHEN tt_conflict.timetable_id IS NULL THEN 1 ELSE 0 END AS is_available,
             COALESCE(existing.count, 0) AS existing_classes,
             CASE WHEN leave_check.leave_id IS NULL THEN 1 ELSE 0 END AS is_not_on_leave,
             CASE WHEN sub_conflict.substitution_id IS NULL THEN 1 ELSE 0 END AS is_not_substitute
      FROM Teacher_Courses tc
      JOIN Teachers t ON tc.teacher_id = t.teacher_id
      JOIN Departments d ON t.department_id = d.department_id
      JOIN Courses c ON tc.course_id = c.course_id
      LEFT JOIN Timetable tt_conflict ON t.teacher_id = tt_conflict.teacher_id AND tt_conflict.slot_id = ? AND (tt_conflict.academic_year = ? OR ? IS NULL)
      LEFT JOIN (SELECT teacher_id, COUNT(*) as count FROM Timetable WHERE academic_year = ? OR ? IS NULL GROUP BY teacher_id) existing ON t.teacher_id = existing.teacher_id
      LEFT JOIN Teacher_Leaves leave_check ON t.teacher_id = leave_check.teacher_id
        AND leave_check.leave_status = 'Approved'
        AND ? BETWEEN leave_check.start_date AND leave_check.end_date
      LEFT JOIN Substitutions sub_conflict ON t.teacher_id = sub_conflict.substitute_teacher_id
        AND sub_conflict.substitution_date = ?
        AND sub_conflict.status IN ('Assigned', 'Confirmed')
        AND EXISTS (
          SELECT 1 FROM Timetable sub_tt WHERE sub_tt.timetable_id = sub_conflict.timetable_id AND sub_tt.slot_id = ?
        )
      WHERE tc.course_id = ? AND t.teacher_id != ? AND t.status = 'Active'
      ORDER BY t.teacher_name
    `, [slot_id, academic_year, academic_year, academic_year, academic_year, date, date, slot_id, course_id, absent_teacher_id]);
    
    const result = candidates.map(c => {
      const isEligible = Boolean(c.is_available) && Boolean(c.is_not_on_leave) && Boolean(c.is_not_substitute);
      let reason = null;
      if (!c.is_available) reason = 'Has a class at this time';
      else if (!c.is_not_on_leave) reason = 'On approved leave';
      else if (!c.is_not_substitute) reason = 'Already assigned as substitute at this time';

      return {
        teacher_id: c.teacher_id,
        teacher_name: c.teacher_name,
        department_name: c.department_name,
        qualified_course: c.qualified_course,
        is_available: Boolean(c.is_available) && Boolean(c.is_not_substitute),
        existing_classes: parseInt(c.existing_classes),
        is_eligible: isEligible,
        reason
      };
    });
    res.json(result);
  } catch (err) { console.error('Error fetching candidates:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/substitutions
router.post('/substitutions', async (req, res) => {
  const { timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date } = req.body;
  if (!timetable_id || !absent_teacher_id || !substitution_date) {
    return res.status(400).json({ message: 'timetable_id, absent_teacher_id, and substitution_date are required' });
  }
  try {
    const [existing] = await pool.query('SELECT substitution_id FROM Substitutions WHERE timetable_id = ? AND substitution_date = ?', [timetable_id, substitution_date]);
    if (existing.length > 0) return res.status(409).json({ message: 'Substitution already exists for this entry' });
    
    // Validate substitute eligibility if provided
    if (substitute_teacher_id) {
      const [entry] = await pool.query('SELECT course_id, slot_id, academic_year FROM Timetable WHERE timetable_id = ?', [timetable_id]);
      if (entry.length === 0) return res.status(404).json({ message: 'Timetable entry not found' });
      
      const { course_id, slot_id, academic_year } = entry[0];
      
      // Check qualification
      const [qual] = await pool.query('SELECT 1 FROM Teacher_Courses WHERE teacher_id = ? AND course_id = ?', [substitute_teacher_id, course_id]);
      if (qual.length === 0) return res.status(400).json({ message: 'Substitute teacher is not qualified for this course' });
      
      // Check availability
      const [conflict] = await pool.query(
        'SELECT 1 FROM Timetable WHERE teacher_id = ? AND slot_id = ? AND (academic_year = ? OR ? IS NULL)',
        [substitute_teacher_id, slot_id, academic_year, academic_year]
      );
      if (conflict.length > 0) return res.status(409).json({ message: 'Substitute teacher already has a class at this time' });
      if (conflict.length > 0) return res.status(409).json({ message: 'Substitute teacher already has a class at this time' });
      
      // Check leave
      const [leave] = await pool.query('SELECT 1 FROM Teacher_Leaves WHERE teacher_id = ? AND leave_status = "Approved" AND ? BETWEEN start_date AND end_date', [substitute_teacher_id, substitution_date]);
      if (leave.length > 0) return res.status(409).json({ message: 'Substitute teacher is on approved leave on this date' });
      
      // Check existing substitution at the same slot
      const [subConflict] = await pool.query(
        `SELECT 1 FROM Substitutions s
         JOIN Timetable tt ON s.timetable_id = tt.timetable_id
         WHERE s.substitute_teacher_id = ? AND s.substitution_date = ? AND tt.slot_id = ?
         AND s.status IN ("Assigned", "Confirmed")`,
        [substitute_teacher_id, substitution_date, slot_id]
      );
      if (subConflict.length > 0) return res.status(409).json({ message: 'Substitute teacher already assigned to another class at this time' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO Substitutions (timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status) VALUES (?, ?, ?, ?, "Assigned")',
      [timetable_id, absent_teacher_id, substitute_teacher_id || null, substitution_date]
    );
    
    // Audit log will be created by trigger
    res.status(201).json({ message: 'Substitution assigned', substitution_id: result.insertId });
  } catch (err) { console.error('Error creating substitution:', err); res.status(500).json({ message: 'Database error' }); }
});

// PATCH /api/substitutions/:id/confirm
router.patch('/substitutions/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE Substitutions SET status = "Confirmed" WHERE substitution_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Substitution not found' });
    res.json({ message: 'Substitution confirmed' });
  } catch (err) { console.error('Error confirming substitution:', err); res.status(500).json({ message: 'Database error' }); }
});

// PATCH /api/substitutions/:id/cancel
router.patch('/substitutions/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE Substitutions SET status = "Cancelled" WHERE substitution_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Substitution not found' });
    res.json({ message: 'Substitution cancelled' });
  } catch (err) { console.error('Error cancelling substitution:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
