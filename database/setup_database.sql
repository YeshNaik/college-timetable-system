-- =====================================================
-- MASTER DATABASE SETUP SCRIPT
-- Run this file to create the complete database
-- =====================================================

SOURCE 01_create_database.sql;
SOURCE 02_sample_data.sql;
SOURCE 03_more_sample_data.sql;
SOURCE 04_timetable_leaves_subs.sql;
SOURCE 05_views.sql;
SOURCE 06_procedures.sql;
SOURCE 07_more_procedures.sql;
SOURCE 08_triggers.sql;
SOURCE 09_events.sql;
SOURCE 10_auto_generation.sql;
SOURCE 11_auto_generation_part2.sql;
SOURCE 12_auto_generation_sample_data.sql;
SOURCE 13_auto_generation_sample_data2.sql;

-- Verify setup
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
