const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/leaves', async (req, res) => {
  const { status } = req.query;
  let whereClause = '';
  const params = [];
  if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
    whereClause = 'WHERE l.leave_status = ?';
    params.push(status);
  }
  try {
    const [rows] = await pool.query(`
      SELECT l.leave_id, l.teacher_id, l.start_date, l.end_date, l.reason, l.leave_status AS status, l.created_at,
             t.teacher_name, d.department_name
      FROM Teacher_Leaves l
      JOIN Teachers t ON l.teacher_id = t.teacher_id
      JOIN Departments d ON t.department_id = d.department_id
      ${whereClause}
      ORDER BY l.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) { console.error('Error fetching leaves:', err); res.status(500).json({ message: 'Database error' }); }
});

router.post('/leaves', async (req, res) => {
  const { teacher_id, start_date, end_date, reason } = req.body;
  if (!teacher_id || !start_date || !end_date) {
    return res.status(400).json({ message: 'teacher_id, start_date, and end_date are required' });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ message: 'end_date must be >= start_date' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO Teacher_Leaves (teacher_id, start_date, end_date, reason, leave_status) VALUES (?, ?, ?, ?, "Pending")',
      [teacher_id, start_date, end_date, reason || null]
    );
    res.status(201).json({ message: 'Leave registered', leave_id: result.insertId });
  } catch (err) { console.error('Error creating leave:', err); res.status(500).json({ message: 'Database error' }); }
});

router.get('/leaves/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT l.leave_id, l.teacher_id, l.start_date, l.end_date, l.reason, l.leave_status AS status, l.created_at,
             t.teacher_name, d.department_name
      FROM Teacher_Leaves l
      JOIN Teachers t ON l.teacher_id = t.teacher_id
      JOIN Departments d ON t.department_id = d.department_id
      WHERE l.leave_id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Leave not found' });
    res.json(rows[0]);
  } catch (err) { console.error('Error fetching leave:', err); res.status(500).json({ message: 'Database error' }); }
});

router.patch('/leaves/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE Teacher_Leaves SET leave_status = "Approved", updated_at = NOW() WHERE leave_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Leave not found' });
    res.json({ message: 'Leave approved' });
  } catch (err) { console.error('Error approving leave:', err); res.status(500).json({ message: 'Database error' }); }
});

router.patch('/leaves/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE Teacher_Leaves SET leave_status = "Rejected", updated_at = NOW() WHERE leave_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Leave not found' });
    res.json({ message: 'Leave rejected' });
  } catch (err) { console.error('Error rejecting leave:', err); res.status(500).json({ message: 'Database error' }); }
});

router.get('/leaves/:id/affected-entries', async (req, res) => {
  const { id } = req.params;
  try {
    const [leave] = await pool.query('SELECT teacher_id, start_date, end_date FROM Teacher_Leaves WHERE leave_id = ? AND leave_status = "Approved"', [id]);
    if (leave.length === 0) return res.status(404).json({ message: 'Leave not found or not approved' });
    const { teacher_id, start_date, end_date } = leave[0];
    
    // Get all timetable entries for this teacher
    const [affected] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code, cr.room_number, ts.start_time, ts.end_time, ts.day_of_week
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      WHERE t.teacher_id = ?
      ORDER BY FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ts.start_time
    `, [teacher_id]);
    
    // Determine active days of the week in leave range
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDays = new Set();
    const diffDays = Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
    if (diffDays >= 6) {
      dayNames.forEach(d => activeDays.add(d));
    } else {
      const cur = new Date(startDateObj);
      while (cur <= endDateObj) {
        activeDays.add(dayNames[cur.getDay()]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    
    const filtered = affected.filter(entry => activeDays.has(entry.day_of_week));
    res.json(filtered);
  } catch (err) { console.error('Error fetching affected entries:', err); res.status(500).json({ message: 'Database error' }); }
});

const updateLeaveHandler = async (req, res) => {
  const { id } = req.params;
  const { teacher_id, start_date, end_date, reason, status } = req.body;
  if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE Teacher_Leaves SET teacher_id = ?, start_date = ?, end_date = ?, reason = ?, leave_status = ? WHERE leave_id = ?',
      [teacher_id, start_date, end_date, reason, status || 'Pending', id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Leave not found' });
    res.json({ message: 'Leave updated' });
  } catch (err) { console.error('Error updating leave:', err); res.status(500).json({ message: 'Database error' }); }
};

router.put('/leaves/:id', updateLeaveHandler);
router.patch('/leaves/:id', updateLeaveHandler);

router.delete('/leaves/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM Teacher_Leaves WHERE leave_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Leave not found' });
    res.json({ message: 'Leave deleted' });
  } catch (err) { console.error('Error deleting leave:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
