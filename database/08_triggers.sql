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