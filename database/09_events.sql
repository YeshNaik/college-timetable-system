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