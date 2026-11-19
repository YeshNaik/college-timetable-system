-- Subject Requirements for CSE Second Year (academic_year_id = 2, semester = 3)
-- Course IDs: CS101=1, CS201=2, CS301=3, CS401=4
INSERT INTO Subject_Requirements (course_id, academic_year_id, semester, weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity) VALUES
(1, 2, 3, 3, 1, 60, 120, 2, 'Lecture Hall', 60),
(2, 2, 3, 3, 1, 60, 120, 2, 'Laboratory', 40),
(3, 2, 3, 3, 1, 60, 120, 2, 'Laboratory', 40),
(4, 2, 3, 3, 1, 60, 120, 2, 'Laboratory', 40);

-- Subject Requirements for CSE Third Year (academic_year_id = 3, semester = 5)
INSERT INTO Subject_Requirements (course_id, academic_year_id, semester, weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity) VALUES
(1, 3, 5, 3, 0, 60, 120, 2, 'Lecture Hall', 60),
(2, 3, 5, 3, 0, 60, 120, 2, 'Lecture Hall', 60),
(3, 3, 5, 3, 0, 60, 120, 2, 'Lecture Hall', 60);

-- Subject Requirements for ECE Second Year (academic_year_id = 6, semester = 3)
-- Course IDs: EC101=5, EC201=6
INSERT INTO Subject_Requirements (course_id, academic_year_id, semester, weekly_lectures, weekly_practicals, lecture_duration_minutes, practical_duration_minutes, practical_consecutive_slots, required_room_type, min_room_capacity) VALUES
(5, 6, 3, 3, 1, 60, 120, 2, 'Laboratory', 40),
(6, 6, 3, 3, 1, 60, 120, 2, 'Laboratory', 40);

-- Timetable Configuration for CSE (department_id = 1)
INSERT INTO Timetable_Configuration (department_id, academic_session, college_start_time, college_end_time, working_days, period_duration_minutes, short_break_after_period, short_break_duration_minutes, lunch_break_start, lunch_break_end, max_daily_periods, max_teacher_daily_hours, max_teacher_weekly_hours, max_student_daily_hours, allow_saturday) VALUES
(1, '2025-26', '09:00:00', '17:00:00', '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]', 60, 2, 10, '13:00:00', '14:00:00', 8, 6, 20, 7, TRUE);

-- Timetable Configuration for ECE (department_id = 2)
INSERT INTO Timetable_Configuration (department_id, academic_session, college_start_time, college_end_time, working_days, period_duration_minutes, short_break_after_period, short_break_duration_minutes, lunch_break_start, lunch_break_end, max_daily_periods, max_teacher_daily_hours, max_teacher_weekly_hours, max_student_daily_hours, allow_saturday) VALUES
(2, '2025-26', '09:00:00', '17:00:00', '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]', 60, 2, 10, '13:00:00', '14:00:00', 8, 6, 20, 7, TRUE);

-- Teacher Availability - All teachers available by default
-- Dr. Rajesh Kumar (teacher_id = 1)
INSERT INTO Teacher_Availability (teacher_id, day_of_week, slot_id, is_available, preference_level) VALUES
(1, 'Monday', 1, TRUE, 'Preferred'),
(1, 'Monday', 2, TRUE, 'Preferred'),
(1, 'Monday', 3, TRUE, 'Available'),
(1, 'Monday', 5, TRUE, 'Available'),
(1, 'Tuesday', 1, TRUE, 'Preferred'),
(1, 'Tuesday', 2, TRUE, 'Preferred'),
(1, 'Wednesday', 1, TRUE, 'Available'),
(1, 'Wednesday', 2, TRUE, 'Available'),
(1, 'Thursday', 1, TRUE, 'Preferred'),
(1, 'Friday', 1, TRUE, 'Available');

-- Prof. Anita Sharma (teacher_id = 2)
INSERT INTO Teacher_Availability (teacher_id, day_of_week, slot_id, is_available, preference_level) VALUES
(2, 'Monday', 2, TRUE, 'Preferred'),
(2, 'Tuesday', 1, TRUE, 'Preferred'),
(2, 'Wednesday', 2, TRUE, 'Available'),
(2, 'Thursday', 2, TRUE, 'Preferred'),
(2, 'Friday', 2, TRUE, 'Available');

-- Dr. Vikram Singh (teacher_id = 3)
INSERT INTO Teacher_Availability (teacher_id, day_of_week, slot_id, is_available, preference_level) VALUES
(3, 'Monday', 3, TRUE, 'Preferred'),
(3, 'Tuesday', 2, TRUE, 'Preferred'),
(3, 'Wednesday', 3, TRUE, 'Available'),
(3, 'Thursday', 3, TRUE, 'Preferred'),
(3, 'Friday', 3, TRUE, 'Available');