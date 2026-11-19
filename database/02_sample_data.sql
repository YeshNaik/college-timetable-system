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