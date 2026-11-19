const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/dashboard/summary', async (req, res) => {
  try {
    const [teachers] = await pool.query('SELECT COUNT(*) AS count FROM Teachers WHERE status = "Active"');
    const [departments] = await pool.query('SELECT COUNT(*) AS count FROM Departments');
    const [courses] = await pool.query('SELECT COUNT(*) AS count FROM Courses');
    const [classrooms] = await pool.query('SELECT COUNT(*) AS count FROM Classrooms');
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
    const [todayClasses] = await pool.query(`
      SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
             t.section, t.semester, t.academic_year,
             c.course_name, c.course_code, te.teacher_name, cr.room_number,
             ts.start_time, ts.end_time, ts.day_of_week, d.department_name
      FROM Timetable t
      JOIN Courses c ON t.course_id = c.course_id
      JOIN Teachers te ON t.teacher_id = te.teacher_id
      JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      JOIN Departments d ON c.department_id = d.department_id
      WHERE ts.day_of_week = ?
    `, [todayName]);
    
    const [leavesResult] = await pool.query(`
      SELECT l.leave_id, l.teacher_id, l.start_date, l.end_date, l.reason, l.leave_status AS status, l.created_at,
             t.teacher_name, d.department_name
      FROM Teacher_Leaves l
      JOIN Teachers t ON l.teacher_id = t.teacher_id
      JOIN Departments d ON t.department_id = d.department_id
      WHERE l.leave_status = 'Approved' AND ? BETWEEN l.start_date AND l.end_date
    `, [todayStr]);
    
    const [substitutionsResult] = await pool.query(
      `SELECT s.substitution_id, s.timetable_id, s.substitution_date AS class_date, s.status, s.assigned_at,
              t1.teacher_name AS absent_teacher_name, t2.teacher_name AS substitute_teacher_name,
              c.course_name, c.course_code, cr.room_number, ts.start_time, ts.end_time, ts.day_of_week
       FROM Substitutions s
       JOIN Timetable tt ON s.timetable_id = tt.timetable_id
       JOIN Teachers t1 ON s.absent_teacher_id = t1.teacher_id
       LEFT JOIN Teachers t2 ON s.substitute_teacher_id = t2.teacher_id
       JOIN Courses c ON tt.course_id = c.course_id
       JOIN Classrooms cr ON tt.classroom_id = cr.classroom_id
       JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
       WHERE s.status IN ('Assigned', 'Confirmed')
       ORDER BY s.assigned_at DESC
       LIMIT 10`
    );
    
    const [pendingLeaves] = await pool.query(`
      SELECT l.leave_id, l.teacher_id, l.start_date, l.end_date, l.reason, l.leave_status AS status, l.created_at,
             t.teacher_name
      FROM Teacher_Leaves l
      JOIN Teachers t ON l.teacher_id = t.teacher_id
      WHERE l.leave_status = 'Pending'
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    const [weeklyDist] = await pool.query(`
      SELECT ts.day_of_week AS day, COUNT(*) AS count
      FROM Timetable t
      JOIN Time_Slots ts ON t.slot_id = ts.slot_id
      GROUP BY ts.day_of_week
      ORDER BY FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
    `);
    
    const [deptDist] = await pool.query(`
      SELECT d.department_name, COUNT(t.teacher_id) AS teacher_count
      FROM Departments d
      LEFT JOIN Teachers t ON d.department_id = t.department_id AND t.status = 'Active'
      GROUP BY d.department_id, d.department_name
      ORDER BY d.department_name
    `);
    
    const todayTimetable = todayClasses.map(e => ({
      timetable_id: e.timetable_id, teacher_id: e.teacher_id, course_id: e.course_id,
      classroom_id: e.classroom_id, slot_id: e.slot_id, day_of_week: e.day_of_week,
      start_time: e.start_time, end_time: e.end_time, course_name: e.course_name,
      course_code: e.course_code, teacher_name: e.teacher_name, room_number: e.room_number,
      department_id: null, department_name: e.department_name,
      section: e.section, semester: e.semester, academic_year: e.academic_year
    }));
    
    res.json({
      stats: {
        total_teachers: teachers[0].count,
        total_departments: departments[0].count,
        total_courses: courses[0].count,
        total_classrooms: classrooms[0].count,
        todays_classes: todayClasses.length,
        teachers_on_leave: leavesResult.length,
        substitutions_assigned: substitutionsResult.length,
        pending_leaves: pendingLeaves.length
      },
      today_timetable: todayTimetable,
      teachers_on_leave: leavesResult,
      recent_substitutions: substitutionsResult,
      pending_leaves: pendingLeaves,
      weekly_distribution: weeklyDist,
      department_distribution: deptDist
    });
  } catch (err) { console.error('Dashboard error:', err); res.status(500).json({ message: 'Database error' }); }
});

module.exports = router;
