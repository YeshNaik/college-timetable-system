-- =====================================================
-- DATABASE VIEWS
-- =====================================================
USE college_timetable_db;

-- View: Teacher Timetable with full details
CREATE OR REPLACE VIEW vw_teacher_timetable AS
SELECT 
    t.timetable_id,
    t.course_id,
    t.teacher_id,
    t.classroom_id,
    t.slot_id,
    t.section,
    t.semester,
    t.academic_year,
    c.course_name,
    c.course_code,
    te.teacher_name,
    cr.room_number,
    cr.building,
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    d.department_id,
    d.department_name
FROM Timetable t
JOIN Courses c ON t.course_id = c.course_id
JOIN Teachers te ON t.teacher_id = te.teacher_id
JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
JOIN Time_Slots ts ON t.slot_id = ts.slot_id
JOIN Departments d ON c.department_id = d.department_id;

-- View: Department-wise Timetable
CREATE OR REPLACE VIEW vw_department_timetable AS
SELECT 
    d.department_name,
    t.timetable_id,
    t.course_id,
    t.teacher_id,
    t.classroom_id,
    t.slot_id,
    t.section,
    t.semester,
    t.academic_year,
    c.course_code,
    c.course_name,
    te.teacher_name,
    cr.room_number,
    ts.day_of_week,
    ts.start_time,
    ts.end_time
FROM Timetable t
JOIN Teachers te ON t.teacher_id = te.teacher_id
JOIN Courses c ON t.course_id = c.course_id
JOIN Departments d ON c.department_id = d.department_id
JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
JOIN Time_Slots ts ON t.slot_id = ts.slot_id
ORDER BY d.department_name, ts.day_of_week, ts.start_time;

-- View: Teacher Leave Summary
CREATE OR REPLACE VIEW vw_teacher_leave_summary AS
SELECT 
    tl.leave_id,
    tl.teacher_id,
    t.teacher_name,
    d.department_name,
    tl.start_date,
    tl.end_date,
    tl.reason,
    tl.leave_status,
    tl.created_at,
    DATEDIFF(tl.end_date, tl.start_date) + 1 AS leave_days,
    CASE 
        WHEN tl.leave_status = 'Approved' AND tl.end_date >= CURDATE() THEN 'Active'
        WHEN tl.leave_status = 'Approved' AND tl.end_date < CURDATE() THEN 'Completed'
        ELSE tl.leave_status
    END AS leave_state
FROM Teacher_Leaves tl
JOIN Teachers t ON tl.teacher_id = t.teacher_id
JOIN Departments d ON t.department_id = d.department_id;

-- View: Substitution Details
CREATE OR REPLACE VIEW vw_substitution_details AS
SELECT 
    s.substitution_id,
    s.timetable_id,
    s.absent_teacher_id,
    s.substitute_teacher_id,
    s.substitution_date,
    s.status,
    s.remarks,
    s.assigned_at,
    tt.section,
    tt.semester,
    tt.academic_year,
    c.course_code,
    c.course_name,
    cr.room_number,
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    at.teacher_name AS absent_teacher_name,
    st.teacher_name AS substitute_teacher_name,
    d.department_name
FROM Substitutions s
JOIN Timetable tt ON s.timetable_id = tt.timetable_id
JOIN Courses c ON tt.course_id = c.course_id
JOIN Classrooms cr ON tt.classroom_id = cr.classroom_id
JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
JOIN Departments d ON c.department_id = d.department_id
JOIN Teachers at ON s.absent_teacher_id = at.teacher_id
LEFT JOIN Teachers st ON s.substitute_teacher_id = st.teacher_id;

-- View: Available Teachers (for substitution eligibility)
CREATE OR REPLACE VIEW vw_available_teachers AS
SELECT 
    t.teacher_id,
    t.teacher_name,
    t.department_id,
    d.department_name,
    t.designation,
    t.status,
    GROUP_CONCAT(DISTINCT c.course_code ORDER BY c.course_code) AS qualified_courses,
    COUNT(DISTINCT tt.timetable_id) AS scheduled_classes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM Teacher_Leaves tl 
            WHERE tl.teacher_id = t.teacher_id 
            AND tl.leave_status = 'Approved' 
            AND CURDATE() BETWEEN tl.start_date AND tl.end_date
        ) THEN 1 ELSE 0 
    END AS on_leave_today
FROM Teachers t
JOIN Departments d ON t.department_id = d.department_id
LEFT JOIN Teacher_Courses tc ON t.teacher_id = tc.teacher_id
LEFT JOIN Courses c ON tc.course_id = c.course_id
LEFT JOIN Timetable tt ON t.teacher_id = tt.teacher_id
WHERE t.status = 'Active'
GROUP BY t.teacher_id, t.teacher_name, t.department_id, d.department_name, t.designation, t.status;

-- View: Today's Classes
CREATE OR REPLACE VIEW vw_todays_classes AS
SELECT 
    t.timetable_id,
    t.course_id,
    t.teacher_id,
    t.classroom_id,
    t.slot_id,
    t.section,
    t.semester,
    t.academic_year,
    c.course_name,
    c.course_code,
    te.teacher_name,
    cr.room_number,
    ts.day_of_week,
    ts.start_time,
    ts.end_time,
    d.department_name
FROM Timetable t
JOIN Courses c ON t.course_id = c.course_id
JOIN Teachers te ON t.teacher_id = te.teacher_id
JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
JOIN Time_Slots ts ON t.slot_id = ts.slot_id
JOIN Departments d ON c.department_id = d.department_id
WHERE ts.day_of_week = DAYNAME(CURDATE())
ORDER BY ts.start_time;