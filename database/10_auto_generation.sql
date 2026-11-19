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