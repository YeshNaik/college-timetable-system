const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  const { from_date, to_date } = req.query;
  const today = new Date();
  const defaultFromDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const defaultToDate = today.toISOString().split('T')[0];
  const startDate = from_date || defaultFromDate;
  const endDate = to_date || defaultToDate;

  try {
    switch (key) {
      case 'workload':
        const [workload] = await pool.query(`
          SELECT t.teacher_id, t.teacher_name, d.department_name,
                 COUNT(tt.timetable_id) AS total_classes
          FROM Teachers t
          JOIN Departments d ON t.department_id = d.department_id
          LEFT JOIN Timetable tt ON t.teacher_id = tt.teacher_id
          WHERE t.status = 'Active'
          GROUP BY t.teacher_id, t.teacher_name, d.department_name
          ORDER BY total_classes DESC
        `);
        return res.json(workload);

      case 'department-timetable':
        const [deptTimetable] = await pool.query(`
          SELECT d.department_name, t.timetable_id, t.course_id, t.classroom_id, t.slot_id,
                 c.course_code, c.course_name, cr.room_number, ts.start_time, ts.end_time, ts.day_of_week
          FROM Timetable t
          JOIN Teachers te ON t.teacher_id = te.teacher_id
          JOIN Courses c ON t.course_id = c.course_id
          JOIN Departments d ON c.department_id = d.department_id
          JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
          JOIN Time_Slots ts ON t.slot_id = ts.slot_id
          ORDER BY d.department_name, ts.day_of_week, ts.start_time
        `);
        return res.json(deptTimetable);

      case 'leaves':
        const [leaves] = await pool.query(`
          SELECT l.leave_id, l.teacher_id, t.teacher_name, d.department_name,
                 l.start_date, l.end_date, l.reason, l.leave_status AS status, l.created_at
          FROM Teacher_Leaves l
          JOIN Teachers t ON l.teacher_id = t.teacher_id
          JOIN Departments d ON t.department_id = d.department_id
          WHERE l.start_date BETWEEN ? AND ?
          ORDER BY l.start_date DESC
        `, [startDate, endDate]);
        return res.json(leaves);

      case 'substitutions':
        const [substitutions] = await pool.query(`
          SELECT s.substitution_id, s.substitution_date, s.status, s.assigned_at,
                 t1.teacher_name AS absent_teacher, t2.teacher_name AS substitute_teacher,
                 c.course_code, c.course_name, cr.room_number
          FROM Substitutions s
          JOIN Timetable tt ON s.timetable_id = tt.timetable_id
          JOIN Teachers t1 ON s.absent_teacher_id = t1.teacher_id
          LEFT JOIN Teachers t2 ON s.substitute_teacher_id = t2.teacher_id
          JOIN Courses c ON tt.course_id = c.course_id
          JOIN Classrooms cr ON tt.classroom_id = cr.classroom_id
          WHERE s.substitution_date BETWEEN ? AND ?
          ORDER BY s.substitution_date DESC
        `, [startDate, endDate]);
        return res.json(substitutions);

      case 'frequent-substitutes':
        const [frequent] = await pool.query(`
          SELECT t.teacher_name, COUNT(s.substitution_id) AS substitution_count
          FROM Teachers t
          JOIN Substitutions s ON t.teacher_id = s.substitute_teacher_id
          WHERE s.status IN ('Assigned', 'Confirmed')
          GROUP BY t.teacher_id, t.teacher_name
          ORDER BY substitution_count DESC
        `);
        return res.json(frequent);

      case 'course-allocation':
        const [allocation] = await pool.query(`
          SELECT c.course_code, c.course_name, d.department_name,
                 t.teacher_name, COUNT(tt.timetable_id) AS allocated_classes
          FROM Courses c
          JOIN Departments d ON c.department_id = d.department_id
          LEFT JOIN Teacher_Courses tc ON c.course_id = tc.course_id
          LEFT JOIN Teachers t ON tc.teacher_id = t.teacher_id AND t.status = 'Active'
          LEFT JOIN Timetable tt ON c.course_id = tt.course_id
          GROUP BY c.course_id, c.course_code, c.course_name, d.department_name, t.teacher_name
          ORDER BY c.course_code, t.teacher_name
        `);
        return res.json(allocation);

      default:
        res.status(404).json({ message: 'Report not found' });
    }
  } catch (err) { console.error('Report error:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
