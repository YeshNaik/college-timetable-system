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