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