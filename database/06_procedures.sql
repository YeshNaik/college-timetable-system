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