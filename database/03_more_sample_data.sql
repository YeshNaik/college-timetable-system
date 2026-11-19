-- =====================================================
-- MORE SAMPLE DATA (Time Slots, Teacher_Courses, Timetable, Leaves, Substitutions)
-- =====================================================
USE college_timetable_db;

-- Time Slots (Monday-Saturday, 8 slots per day)
INSERT INTO Time_Slots (day_of_week, start_time, end_time) VALUES
('Monday', '08:00:00', '09:00:00'),
('Monday', '09:00:00', '10:00:00'),
('Monday', '10:15:00', '11:15:00'),
('Monday', '11:15:00', '12:15:00'),
('Monday', '13:00:00', '14:00:00'),
('Monday', '14:00:00', '15:00:00'),
('Monday', '15:15:00', '16:15:00'),
('Monday', '16:15:00', '17:15:00'),
('Tuesday', '08:00:00', '09:00:00'),
('Tuesday', '09:00:00', '10:00:00'),
('Tuesday', '10:15:00', '11:15:00'),
('Tuesday', '11:15:00', '12:15:00'),
('Tuesday', '13:00:00', '14:00:00'),
('Tuesday', '14:00:00', '15:00:00'),
('Tuesday', '15:15:00', '16:15:00'),
('Tuesday', '16:15:00', '17:15:00'),
('Wednesday', '08:00:00', '09:00:00'),
('Wednesday', '09:00:00', '10:00:00'),
('Wednesday', '10:15:00', '11:15:00'),
('Wednesday', '11:15:00', '12:15:00'),
('Wednesday', '13:00:00', '14:00:00'),
('Wednesday', '14:00:00', '15:00:00'),
('Wednesday', '15:15:00', '16:15:00'),
('Wednesday', '16:15:00', '17:15:00'),
('Thursday', '08:00:00', '09:00:00'),
('Thursday', '09:00:00', '10:00:00'),
('Thursday', '10:15:00', '11:15:00'),
('Thursday', '11:15:00', '12:15:00'),
('Thursday', '13:00:00', '14:00:00'),
('Thursday', '14:00:00', '15:00:00'),
('Thursday', '15:15:00', '16:15:00'),
('Thursday', '16:15:00', '17:15:00'),
('Friday', '08:00:00', '09:00:00'),
('Friday', '09:00:00', '10:00:00'),
('Friday', '10:15:00', '11:15:00'),
('Friday', '11:15:00', '12:15:00'),
('Friday', '13:00:00', '14:00:00'),
('Friday', '14:00:00', '15:00:00'),
('Friday', '15:15:00', '16:15:00'),
('Friday', '16:15:00', '17:15:00'),
('Saturday', '08:00:00', '09:00:00'),
('Saturday', '09:00:00', '10:00:00'),
('Saturday', '10:15:00', '11:15:00'),
('Saturday', '11:15:00', '12:15:00');

-- Teacher-Course Assignments (Qualifications)
INSERT INTO Teacher_Courses (teacher_id, course_id) VALUES
(1, 1), (1, 2),  -- Dr. Rajesh: DS, DBMS
(2, 1), (2, 3),  -- Prof. Anita: DS, OS
(3, 2), (3, 4),  -- Dr. Vikram: DBMS, CN
(4, 5), (4, 6),  -- Prof. Priya: DE, SS
(5, 5), (5, 6),  -- Dr. Arjun: DE, SS
(6, 5), (6, 6),  -- Prof. Sneha: DE, SS
(7, 7),          -- Dr. Ravi: Thermodynamics
(8, 7),          -- Prof. Kavita: Thermodynamics
(9, 8),          -- Dr. Manoj: Circuit Theory
(10, 8);         -- Prof. Deepa: Circuit Theory