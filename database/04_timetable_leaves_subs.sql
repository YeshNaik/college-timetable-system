-- =====================================================
-- TIMETABLE, LEAVES, SUBSTITUTIONS, AUDIT, ARCHIVE
-- =====================================================
USE college_timetable_db;

-- Timetable Entries (Sample weekly schedule for CSE Semester 3, Section A, 2024-25)
INSERT INTO Timetable (course_id, teacher_id, classroom_id, slot_id, section, semester, academic_year) VALUES
-- Monday
(1, 1, 1, 1, 'A', '3', '2024-25'),  -- CS101 DS by Rajesh, Room 101, Mon 8-9
(2, 2, 1, 2, 'A', '3', '2024-25'),  -- CS201 DBMS by Anita, Room 101, Mon 9-10
(3, 3, 3, 3, 'A', '3', '2024-25'),  -- CS301 OS by Vikram, Lab 201, Mon 10:15-11:15
(4, 1, 1, 5, 'A', '3', '2024-25'),  -- CS401 CN by Rajesh, Room 101, Mon 1-2
-- Tuesday
(1, 2, 2, 9, 'A', '3', '2024-25'),  -- CS101 DS by Anita, Room 102, Tue 8-9
(3, 3, 3, 10, 'A', '3', '2024-25'), -- CS301 OS by Vikram, Lab 201, Tue 9-10
(2, 1, 1, 11, 'A', '3', '2024-25'), -- CS201 DBMS by Rajesh, Room 101, Tue 10:15-11:15
(4, 3, 1, 13, 'A', '3', '2024-25'), -- CS401 CN by Vikram, Room 101, Tue 1-2
-- Wednesday
(2, 1, 1, 17, 'A', '3', '2024-25'), -- CS201 DBMS by Rajesh, Room 101, Wed 8-9
(1, 2, 2, 18, 'A', '3', '2024-25'), -- CS101 DS by Anita, Room 102, Wed 9-10
(3, 3, 3, 19, 'A', '3', '2024-25'), -- CS301 OS by Vikram, Lab 201, Wed 10:15-11:15
(4, 1, 1, 21, 'A', '3', '2024-25'), -- CS401 CN by Rajesh, Room 101, Wed 1-2
-- Thursday
(1, 1, 1, 25, 'A', '3', '2024-25'), -- CS101 DS by Rajesh, Room 101, Thu 8-9
(2, 2, 1, 26, 'A', '3', '2024-25'), -- CS201 DBMS by Anita, Room 101, Thu 9-10
(3, 3, 3, 27, 'A', '3', '2024-25'), -- CS301 OS by Vikram, Lab 201, Thu 10:15-11:15
(4, 1, 1, 29, 'A', '3', '2024-25'), -- CS401 CN by Rajesh, Room 101, Thu 1-2
-- Friday
(1, 2, 2, 33, 'A', '3', '2024-25'), -- CS101 DS by Anita, Room 102, Fri 8-9
(2, 1, 1, 34, 'A', '3', '2024-25'), -- CS201 DBMS by Rajesh, Room 101, Fri 9-10
(3, 3, 3, 35, 'A', '3', '2024-25'), -- CS301 OS by Vikram, Lab 201, Fri 10:15-11:15
(4, 3, 1, 37, 'A', '3', '2024-25');  -- CS401 CN by Vikram, Room 101, Fri 1-2

-- ECE Timetable (Semester 3, Section A)
INSERT INTO Timetable (course_id, teacher_id, classroom_id, slot_id, section, semester, academic_year) VALUES
(5, 4, 4, 1, 'A', '3', '2024-25'),  -- EC101 DE by Priya, Lab 202, Mon 8-9
(6, 5, 4, 2, 'A', '3', '2024-25'),  -- EC201 SS by Arjun, Lab 202, Mon 9-10
(5, 6, 4, 3, 'A', '3', '2024-25'),  -- EC101 DE by Sneha, Lab 202, Mon 10:15-11:15
(6, 4, 4, 5, 'A', '3', '2024-25');  -- EC201 SS by Priya, Lab 202, Mon 1-2

-- Teacher Leaves
INSERT INTO Teacher_Leaves (teacher_id, start_date, end_date, reason, leave_status) VALUES
(1, '2024-12-16', '2024-12-18', 'Medical leave', 'Approved'),
(3, '2024-12-17', '2024-12-17', 'Conference', 'Pending'),
(2, '2024-12-10', '2024-12-12', 'Family emergency', 'Approved'),
(5, '2024-12-20', '2024-12-22', 'Health checkup', 'Approved');

-- Substitutions (for approved leaves)
INSERT INTO Substitutions (timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status, remarks) VALUES
(1, 1, 2, '2024-12-16', 'Confirmed', 'Prof. Anita covering for Dr. Rajesh'),
(2, 1, 3, '2024-12-17', 'Assigned', 'Dr. Vikram covering DBMS'),
(5, 2, 1, '2024-12-10', 'Confirmed', 'Dr. Rajesh covering for Prof. Anita');

-- Substitution Audit
INSERT INTO Substitution_Audit (substitution_id, action, description, changed_by) VALUES
(1, 'ASSIGNED', 'Substitution assigned to Prof. Anita Sharma for CS101', 'System'),
(1, 'CONFIRMED', 'Substitution confirmed by admin', 'Admin'),
(2, 'ASSIGNED', 'Substitution assigned to Dr. Vikram Singh for CS201', 'System'),
(3, 'ASSIGNED', 'Substitution assigned to Dr. Rajesh Kumar for CS101', 'System'),
(3, 'CONFIRMED', 'Substitution confirmed by admin', 'Admin');

-- Archive (old completed substitutions)
INSERT INTO Substitutions_Archive (original_substitution_id, timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status) VALUES
(1, 1, 1, 2, '2024-10-15', 'Completed'),
(2, 5, 2, 1, '2024-10-20', 'Completed');