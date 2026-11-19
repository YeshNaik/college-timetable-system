const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/timetable
router.get('/timetable', async (req, res) => {
  const { teacher_id, department_id, classroom_id, section, semester, academic_year, day_of_week } = req.query;
  let whereClause = '';
  const params = [];
  if (teacher_id) { whereClause += ' AND t.teacher_id = ?'; params.push(teacher_id); }
  if (department_id) { whereClause += ' AND c.department_id = ?'; params.push(department_id); }
  if (classroom_id) { whereClause += ' AND t.classroom_id = ?'; params.push(classroom_id); }
  if (section) { whereClause += ' AND t.section = ?'; params.push(section); }
  if (semester) { whereClause += ' AND t.semester = ?'; params.push(semester); }
  if (academic_year) { whereClause += ' AND t.academic_year = ?'; params.push(academic_year); }
  if (day_of_week) { whereClause += ' AND ts.day_of_week = ?'; params.push(day_of_week); }
  try {
    const [rows] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code, te.teacher_name, cr.room_number, 
             ts.start_time, ts.end_time, ts.day_of_week, d.department_id, d.department_name
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Teachers te ON t.teacher_id = te.teacher_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      JOIN Departments d ON c.department_id = d.department_id
      WHERE 1=1 ${whereClause}
      ORDER BY FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ts.start_time
    `, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching timetable:', err); res.status(500).json({ message: 'Database error' }); }
});

// POST /api/timetable
router.post('/timetable', async (req, res) => {
  const { teacher_id, course_id, classroom_id, slot_id, section, semester, academic_year } = req.body;
  if (!teacher_id || !course_id || !classroom_id || !slot_id || !section) {
    return res.status(400).json({ message: 'teacher_id, course_id, classroom_id, slot_id, and section are required' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check teacher conflict
    const [teacherCheck] = await connection.query(
      'SELECT 1 FROM Timetable WHERE teacher_id = ? AND slot_id = ?',
      [teacher_id, slot_id]
    );
    if (teacherCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Conflict: Teacher already scheduled for this time slot', conflicts: ['Teacher already booked for this slot'] });
    }
    
    // Check classroom conflict
    const [roomCheck] = await connection.query(
      'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ?',
      [classroom_id, slot_id]
    );
    if (roomCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Conflict: Classroom already booked for this time slot', conflicts: ['Classroom already booked for this slot'] });
    }
    
    // Check section conflict
    const [sectionCheck] = await connection.query(
      'SELECT 1 FROM Timetable WHERE section = ? AND slot_id = ? AND semester = ? AND academic_year = ?',
      [section, slot_id, semester || '1', academic_year || new Date().getFullYear().toString()]
    );
    if (sectionCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Conflict: Section already has a class at this time', conflicts: ['Section already booked for this slot'] });
    }
    
    const [slotRow] = await connection.query('SELECT day_of_week FROM Time_Slots WHERE slot_id = ?', [slot_id]);
    const day_of_week = req.body.day_of_week || slotRow[0]?.day_of_week || 'Monday';

    const [result] = await connection.query(
      'INSERT INTO Timetable (course_id, teacher_id, classroom_id, slot_id, day_of_week, section, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [course_id, teacher_id, classroom_id, slot_id, day_of_week, section, semester || '1', academic_year || new Date().getFullYear().toString()]
    );
    
    await connection.commit();
    res.status(201).json({ message: 'Timetable entry created', timetable_id: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating timetable entry:', err);
    res.status(500).json({ message: 'Database error' });
  } finally { connection.release(); }
});

// GET /api/timetable/:id
router.get('/timetable/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code, te.teacher_name, cr.room_number, 
             ts.start_time, ts.end_time, ts.day_of_week, d.department_id, d.department_name
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Teachers te ON t.teacher_id = te.teacher_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      JOIN Departments d ON c.department_id = d.department_id
      WHERE t.timetable_id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Timetable entry not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching timetable entry:', err); res.status(500).json({ message: 'Database error' }); }
});

// PUT /api/timetable/:id
router.put('/timetable/:id', async (req, res) => {
  const { id } = req.params;
  const { teacher_id, course_id, classroom_id, slot_id, section, semester, academic_year } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [teacherCheck] = await connection.query(
      'SELECT 1 FROM Timetable WHERE teacher_id = ? AND slot_id = ? AND timetable_id != ?',
      [teacher_id, slot_id, id]
    );
    if (teacherCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Conflict: Teacher already scheduled for this time slot', conflicts: ['Teacher already booked for this slot'] });
    }
    
    const [roomCheck] = await connection.query(
      'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ? AND timetable_id != ?',
      [classroom_id, slot_id, id]
    );
    if (roomCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Conflict: Classroom already booked for this time slot', conflicts: ['Classroom already booked for this slot'] });
    }
    
    const [slotRow] = await connection.query('SELECT day_of_week FROM Time_Slots WHERE slot_id = ?', [slot_id]);
    const day_of_week = req.body.day_of_week || slotRow[0]?.day_of_week || 'Monday';

    const [result] = await connection.query(
      'UPDATE Timetable SET teacher_id = ?, course_id = ?, classroom_id = ?, slot_id = ?, day_of_week = ?, section = ?, semester = ?, academic_year = ? WHERE timetable_id = ?',
      [teacher_id, course_id, classroom_id, slot_id, day_of_week, section || '', semester || '1', academic_year || new Date().getFullYear().toString(), id]
    );
    
    await connection.commit();
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Timetable entry not found' });
    res.json({ message: 'Timetable entry updated' });
  } catch (err) { await connection.rollback(); console.error('Error updating timetable entry:', err); res.status(500).json({ message: 'Database error' }); } finally { connection.release(); }
});

// DELETE /api/timetable/:id
router.delete('/timetable/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Timetable WHERE timetable_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Timetable entry not found' });
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) { console.error('Error deleting timetable entry:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
