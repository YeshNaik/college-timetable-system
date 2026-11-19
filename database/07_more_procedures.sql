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