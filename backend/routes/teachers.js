const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/teachers
router.get('/teachers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.teacher_id, t.teacher_name, t.email, t.phone, t.department_id, 
             d.department_name, t.designation, t.status
      FROM Teachers t
      JOIN Departments d ON t.department_id = d.department_id
      WHERE t.status = 'Active'
      ORDER BY t.teacher_name
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/teachers/availability - Get all active teachers with availability for a given date
// NOTE: Must be registered before /teachers/:id so Express does not match :id = 'availability'
router.get('/teachers/availability', async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: 'date parameter is required (YYYY-MM-DD)' });
  }
  
  try {
    const [dayResult] = await pool.query('SELECT DAYNAME(?) as day_of_week', [date]);
    const dayOfWeek = dayResult[0]?.day_of_week;
    
    const [rows] = await pool.query(`
      SELECT t.teacher_id, t.teacher_name, d.department_name,
             GROUP_CONCAT(DISTINCT c.course_code ORDER BY c.course_code) AS qualified_courses,
             (
               SELECT COUNT(*) FROM Timetable tt
               JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
               WHERE tt.teacher_id = t.teacher_id AND ts.day_of_week = ?
             ) AS scheduled_classes,
             CASE 
               WHEN EXISTS (
                 SELECT 1 FROM Teacher_Leaves tl 
                 WHERE tl.teacher_id = t.teacher_id 
                 AND tl.leave_status = 'Approved' 
                 AND ? BETWEEN tl.start_date AND tl.end_date
               ) THEN 1 ELSE 0 
             END AS on_leave,
             (
               SELECT GROUP_CONCAT(CONCAT(DATE_FORMAT(ts.start_time, '%H:%i'), '-', DATE_FORMAT(ts.end_time, '%H:%i')) ORDER BY ts.start_time)
               FROM Time_Slots ts
               WHERE ts.day_of_week = ?
                 AND NOT EXISTS (
                   SELECT 1 FROM Timetable tt WHERE tt.teacher_id = t.teacher_id AND tt.slot_id = ts.slot_id
                 )
                 AND NOT EXISTS (
                   SELECT 1 FROM Substitutions sub
                   JOIN Timetable tt2 ON sub.timetable_id = tt2.timetable_id
                   WHERE sub.substitute_teacher_id = t.teacher_id AND sub.substitution_date = ?
                     AND tt2.slot_id = ts.slot_id AND sub.status IN ('Assigned', 'Confirmed')
                 )
             ) AS available_slots
      FROM Teachers t
      JOIN Departments d ON t.department_id = d.department_id
      LEFT JOIN Teacher_Courses tc ON t.teacher_id = tc.teacher_id
      LEFT JOIN Courses c ON tc.course_id = c.course_id
      WHERE t.status = 'Active'
      GROUP BY t.teacher_id, t.teacher_name, d.department_name
      ORDER BY t.teacher_name
    `, [dayOfWeek, date, dayOfWeek, date]);
    
    const result = rows.map(row => ({
      ...row,
      qualified_courses: row.qualified_courses ? row.qualified_courses.split(',') : [],
      available_slots: row.on_leave ? [] : (row.available_slots ? row.available_slots.split(',') : []),
      on_leave: Boolean(row.on_leave)
    }));
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching teacher availability:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// POST /api/teachers
router.post('/teachers', async (req, res) => {
  const { teacher_name, email, phone, department_id, designation, status } = req.body;
  
  if (!teacher_name || !email || !department_id) {
    return res.status(400).json({ message: 'teacher_name, email, and department_id are required' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO Teachers (teacher_name, email, phone, department_id, designation, status) VALUES (?, ?, ?, ?, ?, ?)',
      [teacher_name, email, phone || null, department_id, designation || 'Lecturer', status || 'Active']
    );
    res.status(201).json({
      teacher_id: result.insertId,
      teacher_name,
      email,
      department_id
    });
  } catch (err) {
    console.error('Error creating teacher:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Teacher email already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/teachers/:id
router.get('/teachers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT t.teacher_id, t.teacher_name, t.email, t.phone, t.department_id, 
              d.department_name, t.designation, t.status
       FROM Teachers t
       JOIN Departments d ON t.department_id = d.department_id
       WHERE t.teacher_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching teacher:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// PUT /api/teachers/:id
router.put('/teachers/:id', async (req, res) => {
  const { id } = req.params;
  const { teacher_name, email, phone, department_id, designation, status } = req.body;
  
  try {
    const [result] = await pool.query(
      'UPDATE Teachers SET teacher_name = ?, email = ?, phone = ?, department_id = ?, designation = ?, status = ? WHERE teacher_id = ?',
      [teacher_name, email, phone || null, department_id, designation || 'Lecturer', status || 'Active', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ teacher_id: parseInt(id), teacher_name, email, department_id });
  } catch (err) {
    console.error('Error updating teacher:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Teacher email already exists' });
    }
    res.status(500).json({ message: 'Database error' });
  }
});

// DELETE /api/teachers/:id
router.delete('/teachers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE Teachers SET status = "Inactive" WHERE teacher_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deactivated' });
  } catch (err) {
    console.error('Error deactivating teacher:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/teachers/:id/courses - Get teacher's qualified courses
router.get('/teachers/:id/courses', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.credits
      FROM Courses c
      JOIN Teacher_Courses tc ON c.course_id = tc.course_id
      WHERE tc.teacher_id = ?
      ORDER BY c.course_code
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teacher courses:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// PUT /api/teachers/:id/courses - Replace teacher's qualified courses
router.put('/teachers/:id/courses', async (req, res) => {
  const { id } = req.params;
  const { course_ids } = req.body;
  
  if (!Array.isArray(course_ids)) {
    return res.status(400).json({ message: 'course_ids must be an array' });
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    await connection.query('DELETE FROM Teacher_Courses WHERE teacher_id = ?', [id]);
    
    if (course_ids.length > 0) {
      const values = course_ids.map(course_id => [id, course_id]);
      await connection.query('INSERT INTO Teacher_Courses (teacher_id, course_id) VALUES ?', [values]);
    }
    
    await connection.commit();
    res.json({ message: 'Teacher courses updated', teacher_id: parseInt(id), course_count: course_ids.length });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating teacher courses:', err);
    res.status(500).json({ message: 'Database error' });
  } finally {
    connection.release();
  }
});

// GET /api/teachers/:id/timetable - Teacher's timetable (with Time_Slots JOIN)
router.get('/teachers/:id/timetable', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code,
             cr.room_number, cr.building,
             ts.day_of_week, ts.start_time, ts.end_time,
             d.department_id, d.department_name
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      JOIN Departments d ON c.department_id = d.department_id
      WHERE t.teacher_id = ?
      ORDER BY FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ts.start_time
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teacher timetable:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/teachers/:id/leaves
router.get('/teachers/:id/leaves', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT leave_id, teacher_id, start_date, end_date, reason, leave_status AS status, created_at
      FROM Teacher_Leaves
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teacher leaves:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

// GET /api/teachers/:id/substitutions
router.get('/teachers/:id/substitutions', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT s.substitution_id, s.timetable_id, s.substitution_date, s.status, s.assigned_at,
             c.course_code, c.course_name, cr.room_number, ts.start_time, ts.end_time, ts.day_of_week
      FROM Substitutions s
      JOIN Timetable tt ON s.timetable_id = tt.timetable_id
      JOIN Courses c ON tt.course_id = c.course_id
      JOIN Classrooms cr ON tt.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
      WHERE s.absent_teacher_id = ? OR s.substitute_teacher_id = ?
      ORDER BY s.assigned_at DESC
    `, [id, id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching teacher substitutions:', err);
    res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
