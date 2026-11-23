-- =====================================================
-- ALL-IN-ONE DATABASE SETUP SCRIPT FOR MYSQL WORKBENCH
-- Generated for: college_timetable_db
-- Run this entire script in MySQL Workbench (Ctrl+Shift+Enter or Execute lightning bolt)
-- =====================================================


-- =====================================================
-- SECTION: 01_create_database.sql
-- =====================================================

-- =====================================================
-- SMART COLLEGE TIMETABLE MANAGEMENT SYSTEM
-- Database: college_timetable_db
-- =====================================================

DROP DATABASE IF EXISTS college_timetable_db;
CREATE DATABASE college_timetable_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_timetable_db;

-- Department table
CREATE TABLE Departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Teacher table
CREATE TABLE Teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department_id INT NOT NULL,
    designation VARCHAR(50) DEFAULT 'Lecturer',
    status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Course table
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Classroom table
CREATE TABLE Classrooms (
    classroom_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    building VARCHAR(50) DEFAULT 'Main',
    capacity INT DEFAULT 60,
    room_type ENUM('Lecture Hall', 'Laboratory', 'Seminar Room', 'Tutorial Room') DEFAULT 'Lecture Hall',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room (room_number, building)
) ENGINE=InnoDB;

-- Time_Slots table
CREATE TABLE Time_Slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slot (day_of_week, start_time, end_time)
) ENGINE=InnoDB;

-- Teacher_Courses (Many-to-Many: Teacher qualifications)
CREATE TABLE Teacher_Courses (
    teacher_course_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_course (teacher_id, course_id)
) ENGINE=InnoDB;

-- Timetable table
CREATE TABLE Timetable (
    timetable_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    classroom_id INT NOT NULL,
    slot_id INT NOT NULL,
    section VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL DEFAULT '1',
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE RESTRICT,
    FOREIGN KEY (classroom_id) REFERENCES Classrooms(classroom_id) ON DELETE RESTRICT,
    FOREIGN KEY (slot_id) REFERENCES Time_Slots(slot_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_teacher_slot (teacher_id, slot_id, academic_year),
    UNIQUE KEY unique_classroom_slot (classroom_id, slot_id, academic_year),
    UNIQUE KEY unique_section_slot (section, course_id, slot_id, semester, academic_year)
) ENGINE=InnoDB;

-- Teacher_Leaves table
CREATE TABLE Teacher_Leaves (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    leave_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE CASCADE,
    CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- Substitutions table
CREATE TABLE Substitutions (
    substitution_id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT NOT NULL,
    absent_teacher_id INT NOT NULL,
    substitute_teacher_id INT,
    substitution_date DATE NOT NULL,
    status ENUM('Assigned', 'Confirmed', 'Cancelled') DEFAULT 'Assigned',
    remarks TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (timetable_id) REFERENCES Timetable(timetable_id) ON DELETE CASCADE,
    FOREIGN KEY (absent_teacher_id) REFERENCES Teachers(teacher_id) ON DELETE RESTRICT,
    FOREIGN KEY (substitute_teacher_id) REFERENCES Teachers(teacher_id) ON DELETE SET NULL,
    UNIQUE KEY unique_substitution (timetable_id, substitution_date)
) ENGINE=InnoDB;

-- Substitution_Audit table
CREATE TABLE Substitution_Audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    substitution_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    FOREIGN KEY (substitution_id) REFERENCES Substitutions(substitution_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Substitutions_Archive table
CREATE TABLE Substitutions_Archive (
    archive_id INT AUTO_INCREMENT PRIMARY KEY,
    original_substitution_id INT NOT NULL,
    timetable_id INT NOT NULL,
    absent_teacher_id INT NOT NULL,
    substitute_teacher_id INT,
    substitution_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (absent_teacher_id) REFERENCES Teachers(teacher_id),
    FOREIGN KEY (substitute_teacher_id) REFERENCES Teachers(teacher_id)
) ENGINE=InnoDB;


-- =====================================================
-- SECTION: 02_sample_data.sql
-- =====================================================

-- =====================================================
-- SAMPLE DATA FOR COLLEGE TIMETABLE SYSTEM
-- =====================================================
USE college_timetable_db;

-- Departments
INSERT INTO Departments (department_name, department_code) VALUES
('Computer Science Engineering', 'CSE'),
('Electronics and Communication', 'ECE'),
('Mechanical Engineering', 'MECH'),
('Electrical Engineering', 'EEE'),
('Civil Engineering', 'CIVIL');

-- Teachers
INSERT INTO Teachers (teacher_name, email, phone, department_id, designation, status) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@college.edu', '9876543210', 1, 'Professor', 'Active'),
('Prof. Anita Sharma', 'anita.sharma@college.edu', '9876543211', 1, 'Associate Professor', 'Active'),
('Dr. Vikram Singh', 'vikram.singh@college.edu', '9876543212', 1, 'Assistant Professor', 'Active'),
('Prof. Priya Patel', 'priya.patel@college.edu', '9876543213', 2, 'Professor', 'Active'),
('Dr. Arjun Reddy', 'arjun.reddy@college.edu', '9876543214', 2, 'Associate Professor', 'Active'),
('Prof. Sneha Gupta', 'sneha.gupta@college.edu', '9876543215', 2, 'Assistant Professor', 'Active'),
('Dr. Ravi Verma', 'ravi.verma@college.edu', '9876543216', 3, 'Professor', 'Active'),
('Prof. Kavita Nair', 'kavita.nair@college.edu', '9876543217', 3, 'Associate Professor', 'Active'),
('Dr. Manoj Tiwari', 'manoj.tiwari@college.edu', '9876543218', 4, 'Professor', 'Active'),
('Prof. Deepa Krishnan', 'deepa.krishnan@college.edu', '9876543219', 4, 'Assistant Professor', 'Active');

-- Courses
INSERT INTO Courses (course_name, course_code, department_id, credits) VALUES
('Data Structures', 'CS101', 1, 4),
('Database Management Systems', 'CS201', 1, 4),
('Operating Systems', 'CS301', 1, 3),
('Computer Networks', 'CS401', 1, 3),
('Digital Electronics', 'EC101', 2, 4),
('Signals and Systems', 'EC201', 2, 3),
('Thermodynamics', 'ME101', 3, 4),
('Circuit Theory', 'EE101', 4, 3);

-- Classrooms
INSERT INTO Classrooms (room_number, building, capacity, room_type) VALUES
('101', 'Main', 60, 'Lecture Hall'),
('102', 'Main', 60, 'Lecture Hall'),
('201', 'Main', 40, 'Laboratory'),
('202', 'Main', 40, 'Laboratory'),
('301', 'Main', 30, 'Seminar Room'),
('302', 'Main', 30, 'Tutorial Room'),
('L101', 'Lab Block', 30, 'Laboratory'),
('L102', 'Lab Block', 30, 'Laboratory');


-- =====================================================
-- SECTION: 03_more_sample_data.sql
-- =====================================================

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


-- =====================================================
-- SECTION: 04_timetable_leaves_subs.sql
-- =====================================================

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


-- =====================================================
-- SECTION: 05_views.sql
-- =====================================================

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


-- =====================================================
-- SECTION: 06_procedures.sql
-- =====================================================

-- =====================================================
-- STORED PROCEDURES
-- =====================================================
USE college_timetable_db;
DELIMITER //

-- Procedure: Assign Substitute Teacher
CREATE PROCEDURE sp_AssignSubstitute(
    IN p_absent_teacher_id INT,
    IN p_substitution_date DATE,
    OUT p_result JSON
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_timetable_id INT;
    DECLARE v_course_id INT;
    DECLARE v_slot_id INT;
    DECLARE v_day_of_week VARCHAR(20);
    DECLARE v_substitute_id INT;
    DECLARE v_sub_count INT DEFAULT 0;
    DECLARE v_error_msg TEXT;
    
    DECLARE cur_timetable CURSOR FOR
        SELECT tt.timetable_id, tt.course_id, tt.slot_id, ts.day_of_week
        FROM Timetable tt
        JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
        WHERE tt.teacher_id = p_absent_teacher_id
        AND ts.day_of_week = DAYNAME(p_substitution_date);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_error_msg = MESSAGE_TEXT;
        SET p_result = JSON_OBJECT('success', FALSE, 'message', v_error_msg);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    OPEN cur_timetable;
    
    read_loop: LOOP
        FETCH cur_timetable INTO v_timetable_id, v_course_id, v_slot_id, v_day_of_week;
        IF done THEN LEAVE read_loop; END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM Substitutions 
            WHERE timetable_id = v_timetable_id AND substitution_date = p_substitution_date
        ) THEN
            SELECT tc.teacher_id INTO v_substitute_id
            FROM Teacher_Courses tc
            JOIN Teachers t ON tc.teacher_id = t.teacher_id
            WHERE tc.course_id = v_course_id
            AND tc.teacher_id != p_absent_teacher_id
            AND t.status = 'Active'
            AND NOT EXISTS (
                SELECT 1 FROM Timetable tt2
                WHERE tt2.teacher_id = tc.teacher_id AND tt2.slot_id = v_slot_id
            )
            AND NOT EXISTS (
                SELECT 1 FROM Teacher_Leaves tl
                WHERE tl.teacher_id = tc.teacher_id
                AND tl.leave_status = 'Approved'
                AND p_substitution_date BETWEEN tl.start_date AND tl.end_date
            )
            AND NOT EXISTS (
                SELECT 1 FROM Substitutions s
                WHERE s.substitute_teacher_id = tc.teacher_id
                AND s.substitution_date = p_substitution_date
                AND s.status IN ('Assigned', 'Confirmed')
            )
            LIMIT 1;
            
            IF v_substitute_id IS NOT NULL THEN
                INSERT INTO Substitutions (timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status, remarks)
                VALUES (v_timetable_id, p_absent_teacher_id, v_substitute_id, p_substitution_date, 'Assigned', 
                       CONCAT('Auto-assigned for ', DATE_FORMAT(p_substitution_date, '%Y-%m-%d')));
                
                INSERT INTO Substitution_Audit (substitution_id, action, description, changed_by)
                VALUES (LAST_INSERT_ID(), 'ASSIGNED', 
                       CONCAT('Auto-assigned substitute for teacher ', p_absent_teacher_id, ' on ', DATE_FORMAT(p_substitution_date, '%Y-%m-%d')), 
                       'System');
                
                SET v_sub_count = v_sub_count + 1;
                SET v_substitute_id = NULL;
            END IF;
        END IF;
    END LOOP;
    
    CLOSE cur_timetable;
    COMMIT;
    
    SET p_result = JSON_OBJECT(
        'success', TRUE,
        'message', CONCAT('Processed ', v_sub_count, ' substitution(s) for teacher ', p_absent_teacher_id),
        'substitutions_created', v_sub_count
    );
END //

DELIMITER ;


-- =====================================================
-- SECTION: 07_more_procedures.sql
-- =====================================================

-- =====================================================
-- MORE STORED PROCEDURES
-- =====================================================
USE college_timetable_db;
DELIMITER //

-- Procedure: Get Eligible Substitute Candidates
CREATE PROCEDURE sp_GetEligibleCandidates(
    IN p_timetable_id INT,
    IN p_substitution_date DATE,
    OUT p_candidates JSON
)
BEGIN
    DECLARE v_course_id INT;
    DECLARE v_slot_id INT;
    DECLARE v_absent_teacher_id INT;
    DECLARE v_day_of_week VARCHAR(20);
    
    SELECT tt.course_id, tt.slot_id, tt.teacher_id, ts.day_of_week
    INTO v_course_id, v_slot_id, v_absent_teacher_id, v_day_of_week
    FROM Timetable tt
    JOIN Time_Slots ts ON tt.slot_id = ts.slot_id
    WHERE tt.timetable_id = p_timetable_id;
    
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
        'teacher_id', t.teacher_id,
        'teacher_name', t.teacher_name,
        'department_name', d.department_name,
        'qualified_course', c.course_code,
        'is_available', IF(tt_conflict.timetable_id IS NULL, TRUE, FALSE),
        'existing_classes', COALESCE(existing.count, 0),
        'is_eligible', 
            CASE 
                WHEN tt_conflict.timetable_id IS NOT NULL THEN FALSE
                WHEN leave_check.leave_id IS NOT NULL THEN FALSE
                WHEN sub_conflict.substitution_id IS NOT NULL THEN FALSE
                ELSE TRUE
            END,
        'reason',
            CASE 
                WHEN tt_conflict.timetable_id IS NOT NULL THEN 'Has a class at this time'
                WHEN leave_check.leave_id IS NOT NULL THEN 'On approved leave'
                WHEN sub_conflict.substitution_id IS NOT NULL THEN 'Already assigned as substitute'
                ELSE 'Eligible'
            END
    )) INTO p_candidates
    FROM Teacher_Courses tc
    JOIN Teachers t ON tc.teacher_id = t.teacher_id
    JOIN Departments d ON t.department_id = d.department_id
    JOIN Courses c ON tc.course_id = c.course_id
    LEFT JOIN Timetable tt_conflict ON t.teacher_id = tt_conflict.teacher_id AND tt_conflict.slot_id = v_slot_id
    LEFT JOIN (
        SELECT teacher_id, COUNT(*) as count FROM Timetable GROUP BY teacher_id
    ) existing ON t.teacher_id = existing.teacher_id
    LEFT JOIN Teacher_Leaves leave_check ON t.teacher_id = leave_check.teacher_id
        AND leave_check.leave_status = 'Approved'
        AND p_substitution_date BETWEEN leave_check.start_date AND leave_check.end_date
    LEFT JOIN Substitutions sub_conflict ON t.teacher_id = sub_conflict.substitute_teacher_id
        AND sub_conflict.substitution_date = p_substitution_date
        AND sub_conflict.status IN ('Assigned', 'Confirmed')
    WHERE tc.course_id = v_course_id
    AND t.teacher_id != v_absent_teacher_id
    AND t.status = 'Active'
    ORDER BY t.teacher_name;
END //

-- Procedure: Archive Old Substitutions
CREATE PROCEDURE sp_ArchiveSubstitutions(
    IN p_retention_days INT
)
BEGIN
    DECLARE v_archived_count INT DEFAULT 0;
    DECLARE v_cutoff_date DATE;
    
    SET v_cutoff_date = DATE_SUB(CURDATE(), INTERVAL p_retention_days DAY);
    
    START TRANSACTION;
    
    INSERT INTO Substitutions_Archive (original_substitution_id, timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status)
    SELECT substitution_id, timetable_id, absent_teacher_id, substitute_teacher_id, substitution_date, status
    FROM Substitutions s
    WHERE s.substitution_date < v_cutoff_date
    AND s.status IN ('Confirmed', 'Cancelled')
    AND NOT EXISTS (
        SELECT 1 FROM Substitutions_Archive sa 
        WHERE sa.original_substitution_id = s.substitution_id
    );
    
    SET v_archived_count = ROW_COUNT();
    
    DELETE FROM Substitutions 
    WHERE substitution_date < v_cutoff_date
    AND status IN ('Confirmed', 'Cancelled')
    AND NOT EXISTS (
        SELECT 1 FROM Substitutions_Archive sa 
        WHERE sa.original_substitution_id = Substitutions.substitution_id
    );
    
    COMMIT;
    
    SELECT v_archived_count AS archived_count;
END //

DELIMITER ;


-- =====================================================
-- SECTION: 08_triggers.sql
-- =====================================================

-- =====================================================
-- DATABASE TRIGGERS
-- =====================================================
USE college_timetable_db;
DELIMITER //

-- Trigger: Audit log on Substitution INSERT
CREATE TRIGGER trg_substitution_insert_audit
AFTER INSERT ON Substitutions
FOR EACH ROW
BEGIN
    INSERT INTO Substitution_Audit (substitution_id, action, description, changed_by)
    VALUES (NEW.substitution_id, 'ASSIGNED', 
           CONCAT('Substitution assigned: ', 
                  (SELECT teacher_name FROM Teachers WHERE teacher_id = NEW.absent_teacher_id), 
                  ' -> ', 
                  COALESCE((SELECT teacher_name FROM Teachers WHERE teacher_id = NEW.substitute_teacher_id), 'Unassigned')),
           'System');
END //

-- Trigger: Audit log on Substitution UPDATE (status changes)
CREATE TRIGGER trg_substitution_update_audit
AFTER UPDATE ON Substitutions
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO Substitution_Audit (substitution_id, action, description, changed_by)
        VALUES (NEW.substitution_id, CONCAT('STATUS_', NEW.status), 
               CONCAT('Status changed from ', OLD.status, ' to ', NEW.status), 
               'System');
    END IF;
    
    IF OLD.substitute_teacher_id != NEW.substitute_teacher_id THEN
        INSERT INTO Substitution_Audit (substitution_id, action, description, changed_by)
        VALUES (NEW.substitution_id, 'REASSIGNED', 
               CONCAT('Substitute changed from ', 
                      COALESCE((SELECT teacher_name FROM Teachers WHERE teacher_id = OLD.substitute_teacher_id), 'None'), 
                      ' to ', 
                      COALESCE((SELECT teacher_name FROM Teachers WHERE teacher_id = NEW.substitute_teacher_id), 'None')),
               'System');
    END IF;
END //

-- Trigger: Prevent invalid substitution (teacher already booked)
CREATE TRIGGER trg_substitution_validate_before_insert
BEFORE INSERT ON Substitutions
FOR EACH ROW
BEGIN
    DECLARE v_slot_id INT;
    DECLARE v_academic_year VARCHAR(20);
    DECLARE v_conflict INT DEFAULT 0;
    
    -- Get slot_id from timetable
    SELECT slot_id, academic_year INTO v_slot_id, v_academic_year FROM Timetable WHERE timetable_id = NEW.timetable_id;
    
    -- Check if substitute teacher has a class at same time
    IF NEW.substitute_teacher_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_conflict
        FROM Timetable tt
        WHERE tt.teacher_id = NEW.substitute_teacher_id
        AND tt.slot_id = v_slot_id
        AND (v_academic_year IS NULL OR tt.academic_year = v_academic_year);
        
        IF v_conflict > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Substitute teacher already has a class at this time slot';
        END IF;
        
        -- Check if substitute is on approved leave
        SELECT COUNT(*) INTO v_conflict
        FROM Teacher_Leaves tl
        WHERE tl.teacher_id = NEW.substitute_teacher_id
        AND tl.leave_status = 'Approved'
        AND NEW.substitution_date BETWEEN tl.start_date AND tl.end_date;
        
        IF v_conflict > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Substitute teacher is on approved leave on this date';
        END IF;
        
        -- Check if substitute already has another substitution at same time
        SELECT COUNT(*) INTO v_conflict
        FROM Substitutions s
        JOIN Timetable tt ON s.timetable_id = tt.timetable_id
        WHERE s.substitute_teacher_id = NEW.substitute_teacher_id
        AND s.substitution_date = NEW.substitution_date
        AND tt.slot_id = v_slot_id
        AND s.status IN ('Assigned', 'Confirmed');
        
        IF v_conflict > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Substitute teacher already assigned to another class at this time';
        END IF;
    END IF;
END //

-- Trigger: Validate Teacher_Leaves dates
CREATE TRIGGER trg_teacher_leaves_validate_dates
BEFORE INSERT ON Teacher_Leaves
FOR EACH ROW
BEGIN
    IF NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date must be >= start date';
    END IF;
END //

CREATE TRIGGER trg_teacher_leaves_validate_dates_update
BEFORE UPDATE ON Teacher_Leaves
FOR EACH ROW
BEGIN
    IF NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'End date must be >= start date';
    END IF;
END //

DELIMITER ;


-- =====================================================
-- SECTION: 09_events.sql
-- =====================================================

-- =====================================================
-- MYSQL EVENT SCHEDULER
-- =====================================================
USE college_timetable_db;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Event: Archive old substitutions daily at 2 AM
-- Archives substitutions older than 90 days that are Confirmed or Cancelled
DROP EVENT IF EXISTS evt_archive_substitutions;
CREATE EVENT evt_archive_substitutions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 2 HOUR
DO CALL sp_ArchiveSubstitutions(90);

-- Event: Clean up old pending leaves (optional - mark as expired)
-- Marks pending leaves older than 30 days as Rejected automatically
DROP EVENT IF EXISTS evt_cleanup_old_pending_leaves;
CREATE EVENT evt_cleanup_old_pending_leaves
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 3 HOUR
DO UPDATE Teacher_Leaves
    SET leave_status = 'Rejected',
        updated_at = CURRENT_TIMESTAMP
    WHERE leave_status = 'Pending'
    AND end_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);


-- =====================================================
-- SECTION: 10_auto_generation.sql
-- =====================================================

-- =====================================================
-- AUTOMATIC TIMETABLE GENERATION - SCHEMA EXTENSIONS
-- =====================================================
USE college_timetable_db;

-- Academic Years table
CREATE TABLE IF NOT EXISTS Academic_Years (
    academic_year_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    year_name VARCHAR(50) NOT NULL,
    year_number INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dept_year (department_id, year_number)
) ENGINE=InnoDB;

-- Sections table
CREATE TABLE IF NOT EXISTS Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    academic_year_id INT NOT NULL,
    section_name VARCHAR(20) NOT NULL,
    section_code VARCHAR(30) NOT NULL,
    student_count INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES Academic_Years(academic_year_id) ON DELETE CASCADE,
    UNIQUE KEY unique_year_section (academic_year_id, section_name)
) ENGINE=InnoDB;

-- Subject Requirements table
CREATE TABLE IF NOT EXISTS Subject_Requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester INT NOT NULL,
    weekly_lectures INT DEFAULT 0,
    weekly_practicals INT DEFAULT 0,
    lecture_duration_minutes INT DEFAULT 60,
    practical_duration_minutes INT DEFAULT 120,
    practical_consecutive_slots INT DEFAULT 2,
    required_room_type ENUM('Lecture Hall', 'Laboratory', 'Seminar Room', 'Tutorial Room', 'Any') DEFAULT 'Any',
    min_room_capacity INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES Academic_Years(academic_year_id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_year_sem (course_id, academic_year_id, semester)
) ENGINE=InnoDB;

-- Timetable Configuration table
CREATE TABLE IF NOT EXISTS Timetable_Configuration (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    academic_session VARCHAR(20) NOT NULL,
    college_start_time TIME NOT NULL DEFAULT '09:00:00',
    college_end_time TIME NOT NULL DEFAULT '17:00:00',
    working_days JSON NOT NULL,
    period_duration_minutes INT NOT NULL DEFAULT 60,
    short_break_after_period INT DEFAULT 2,
    short_break_duration_minutes INT DEFAULT 10,
    lunch_break_start TIME NOT NULL DEFAULT '13:00:00',
    lunch_break_end TIME NOT NULL DEFAULT '14:00:00',
    max_daily_periods INT DEFAULT 8,
    max_teacher_daily_hours INT DEFAULT 6,
    max_teacher_weekly_hours INT DEFAULT 20,
    max_student_daily_hours INT DEFAULT 7,
    allow_saturday BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
    UNIQUE KEY unique_dept_session (department_id, academic_session)
) ENGINE=InnoDB;

-- Teacher Availability Preferences table
CREATE TABLE IF NOT EXISTS Teacher_Availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    slot_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    preference_level ENUM('Preferred', 'Available', 'Avoid', 'Unavailable') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES Time_Slots(slot_id) ON DELETE CASCADE,
    UNIQUE KEY unique_teacher_day_slot (teacher_id, day_of_week, slot_id)
) ENGINE=InnoDB;


-- =====================================================
-- SECTION: 11_auto_generation_part2.sql
-- =====================================================

-- Generation Jobs table
CREATE TABLE IF NOT EXISTS Generation_Jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    academic_session VARCHAR(20) NOT NULL,
    academic_year_id INT,
    semester INT,
    section_id INT,
    generation_scope ENUM('department', 'year', 'section') NOT NULL DEFAULT 'department',
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    total_sessions_required INT DEFAULT 0,
    sessions_scheduled INT DEFAULT 0,
    sessions_failed INT DEFAULT 0,
    conflicts_detected JSON,
    warnings JSON,
    generation_duration_ms INT,
    algorithm_used VARCHAR(50) DEFAULT 'backtracking',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES Academic_Years(academic_year_id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Generation Results table
CREATE TABLE IF NOT EXISTS Generation_Results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    classroom_id INT NOT NULL,
    slot_id INT NOT NULL,
    section_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester INT NOT NULL,
    session_type ENUM('lecture', 'practical') NOT NULL,
    session_number INT NOT NULL,
    is_practical BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES Generation_Jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES Classrooms(classroom_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES Time_Slots(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES Academic_Years(academic_year_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_gen_jobs_dept_session ON Generation_Jobs(department_id, academic_session);
CREATE INDEX idx_gen_jobs_status ON Generation_Jobs(status);
CREATE INDEX idx_gen_results_job ON Generation_Results(job_id);
CREATE INDEX idx_gen_results_section ON Generation_Results(section_id);
CREATE INDEX idx_subj_req_course_year ON Subject_Requirements(course_id, academic_year_id);
CREATE INDEX idx_sections_academic_year ON Sections(academic_year_id);
CREATE INDEX idx_teacher_avail_teacher ON Teacher_Availability(teacher_id);
CREATE INDEX idx_timetable_config_dept ON Timetable_Configuration(department_id);


-- =====================================================
-- SECTION: 12_auto_generation_sample_data.sql
-- =====================================================

-- =====================================================
-- SAMPLE DATA FOR AUTOMATIC TIMETABLE GENERATION
-- =====================================================
USE college_timetable_db;

-- Academic Years for CSE (department_id = 1)
INSERT INTO Academic_Years (department_id, year_name, year_number, is_active) VALUES
(1, 'First Year', 1, TRUE),
(1, 'Second Year', 2, TRUE),
(1, 'Third Year', 3, TRUE),
(1, 'Fourth Year', 4, TRUE);

-- Academic Years for ECE (department_id = 2)
INSERT INTO Academic_Years (department_id, year_name, year_number, is_active) VALUES
(2, 'First Year', 1, TRUE),
(2, 'Second Year', 2, TRUE),
(2, 'Third Year', 3, TRUE),
(2, 'Fourth Year', 4, TRUE);

-- Academic Years for MECH (department_id = 3)
INSERT INTO Academic_Years (department_id, year_name, year_number, is_active) VALUES
(3, 'First Year', 1, TRUE),
(3, 'Second Year', 2, TRUE),
(3, 'Third Year', 3, TRUE),
(3, 'Fourth Year', 4, TRUE);

-- Academic Years for EEE (department_id = 4)
INSERT INTO Academic_Years (department_id, year_name, year_number, is_active) VALUES
(4, 'First Year', 1, TRUE),
(4, 'Second Year', 2, TRUE),
(4, 'Third Year', 3, TRUE),
(4, 'Fourth Year', 4, TRUE);

-- Academic Years for CIVIL (department_id = 5)
INSERT INTO Academic_Years (department_id, year_name, year_number, is_active) VALUES
(5, 'First Year', 1, TRUE),
(5, 'Second Year', 2, TRUE),
(5, 'Third Year', 3, TRUE),
(5, 'Fourth Year', 4, TRUE);

-- Sections for CSE First Year (academic_year_id = 1)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(1, 'A', 'CSE-1-A', 60, TRUE),
(1, 'B', 'CSE-1-B', 60, TRUE);

-- Sections for CSE Second Year (academic_year_id = 2)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(2, 'A', 'CSE-2-A', 60, TRUE),
(2, 'B', 'CSE-2-B', 55, TRUE);

-- Sections for CSE Third Year (academic_year_id = 3)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(3, 'A', 'CSE-3-A', 60, TRUE),
(3, 'B', 'CSE-3-B', 50, TRUE);

-- Sections for CSE Fourth Year (academic_year_id = 4)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(4, 'A', 'CSE-4-A', 55, TRUE);

-- Sections for ECE First Year (academic_year_id = 5)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(5, 'A', 'ECE-1-A', 60, TRUE);

-- Sections for ECE Second Year (academic_year_id = 6)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(6, 'A', 'ECE-2-A', 60, TRUE);

-- Sections for ECE Third Year (academic_year_id = 7)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(7, 'A', 'ECE-3-A', 55, TRUE);

-- Sections for ECE Fourth Year (academic_year_id = 8)
INSERT INTO Sections (academic_year_id, section_name, section_code, student_count, is_active) VALUES
(8, 'A', 'ECE-4-A', 50, TRUE);


-- =====================================================
-- SECTION: 13_auto_generation_sample_data2.sql
-- =====================================================

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

-- =====================================================
-- VERIFY DATABASE SETUP
-- =====================================================
SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS departments FROM Departments;
SELECT COUNT(*) AS teachers FROM Teachers;
SELECT COUNT(*) AS courses FROM Courses;
SELECT COUNT(*) AS classrooms FROM Classrooms;
SELECT COUNT(*) AS time_slots FROM Time_Slots;
SELECT COUNT(*) AS teacher_courses FROM Teacher_Courses;
SELECT COUNT(*) AS timetable_entries FROM Timetable;
SELECT COUNT(*) AS leaves FROM Teacher_Leaves;
SELECT COUNT(*) AS substitutions FROM Substitutions;
SELECT COUNT(*) AS audit_logs FROM Substitution_Audit;
SELECT COUNT(*) AS archive_records FROM Substitutions_Archive;
SELECT COUNT(*) AS academic_years FROM Academic_Years;
SELECT COUNT(*) AS sections FROM Sections;
SELECT COUNT(*) AS subject_requirements FROM Subject_Requirements;
SELECT COUNT(*) AS timetable_configs FROM Timetable_Configuration;
SELECT COUNT(*) AS teacher_availabilities FROM Teacher_Availability;
