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