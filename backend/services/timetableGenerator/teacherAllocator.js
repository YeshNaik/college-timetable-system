/**
 * Teacher Allocator - Finds best teacher for a session
 */
const pool = require('../../db');

class TeacherAllocator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Find eligible teachers for a session and optional target slot
   */
  async findEligibleTeachers(session, existingAssignments, assignmentDate, slotId = null) {
    const targetSlotId = slotId || session.slot_id;

    // Get teachers qualified for this course
    const [qualified] = await pool.query(
      `SELECT t.teacher_id, t.teacher_name, t.designation, 
              COUNT(tc.course_id) as qualification_count
       FROM Teachers t
       JOIN Teacher_Courses tc ON t.teacher_id = tc.teacher_id
       WHERE tc.course_id = ? AND t.status = 'Active'
       GROUP BY t.teacher_id, t.teacher_name, t.designation
       ORDER BY qualification_count DESC`,
      [session.course_id]
    );

    const eligible = [];

    for (const teacher of qualified) {
      // Check if teacher is available on this date (not on leave)
      if (assignmentDate) {
        const [leave] = await pool.query(
          `SELECT 1 FROM Teacher_Leaves 
           WHERE teacher_id = ? AND leave_status = 'Approved'
           AND ? BETWEEN start_date AND end_date`,
          [teacher.teacher_id, assignmentDate]
        );
        if (leave.length > 0) continue;
      }

      // Check teacher's weekly load
      const sessionFilter = this.config.academic_session ? ' AND academic_year = ?' : '';
      const sessionParams = this.config.academic_session ? [teacher.teacher_id, this.config.academic_session] : [teacher.teacher_id];

      const [weeklyLoad] = await pool.query(
        `SELECT COUNT(*) as weekly_load FROM Timetable WHERE teacher_id = ?${sessionFilter}`,
        sessionParams
      );
      const inMemoryWeekly = existingAssignments.filter(a => a.teacher_id === teacher.teacher_id && !a.timetable_id).length;
      const currentWeekly = (weeklyLoad[0]?.weekly_load || 0) + inMemoryWeekly;
      if (currentWeekly >= this.config.max_teacher_weekly_hours) continue;

      let availabilityPreference = 'Available';

      // Check slot-specific constraints if a slot is specified
      if (targetSlotId) {
        const [slot] = await pool.query('SELECT day_of_week FROM Time_Slots WHERE slot_id = ?', [targetSlotId]);
        if (slot.length > 0) {
          const dailyParams = this.config.academic_session 
            ? [teacher.teacher_id, slot[0].day_of_week, this.config.academic_session]
            : [teacher.teacher_id, slot[0].day_of_week];
          const [dailyLoad] = await pool.query(
            `SELECT COUNT(*) as daily_load FROM Timetable t
             JOIN Time_Slots ts ON t.slot_id = ts.slot_id
             WHERE t.teacher_id = ? AND ts.day_of_week = ?${this.config.academic_session ? ' AND t.academic_year = ?' : ''}`,
            dailyParams
          );
          const inMemoryDaily = existingAssignments.filter(a => 
            a.teacher_id === teacher.teacher_id && 
            a.day_of_week === slot[0].day_of_week && 
            !a.timetable_id
          ).length;
          const currentDaily = (dailyLoad[0]?.daily_load || 0) + inMemoryDaily;
          if (currentDaily >= this.config.max_teacher_daily_hours) continue;
        }

        // Check if teacher already has a class at this slot (in database)
        const slotDbQuery = this.config.academic_session
          ? 'SELECT 1 FROM Timetable WHERE teacher_id = ? AND slot_id = ? AND academic_year = ?'
          : 'SELECT 1 FROM Timetable WHERE teacher_id = ? AND slot_id = ?';
        const slotDbParams = this.config.academic_session
          ? [teacher.teacher_id, targetSlotId, this.config.academic_session]
          : [teacher.teacher_id, targetSlotId];
        const [existingAtSlot] = await pool.query(slotDbQuery, slotDbParams);
        if (existingAtSlot.length > 0) continue;

        // Check if teacher already assigned at this slot in current generation
        const assignedAtSlot = existingAssignments.some(a => 
          a.teacher_id === teacher.teacher_id && a.slot_id === targetSlotId
        );
        if (assignedAtSlot) continue;

        // Check teacher availability preference
        const [availability] = await pool.query(
          `SELECT is_available, preference_level FROM Teacher_Availability 
           WHERE teacher_id = ? AND slot_id = ?`,
          [teacher.teacher_id, targetSlotId]
        );
        if (availability.length > 0) {
          if (!availability[0].is_available || availability[0].preference_level === 'Unavailable') {
            continue;
          }
          availabilityPreference = availability[0].preference_level;
        }
      }

      // Calculate teacher score (higher = better)
      let score = 0;
      if (availabilityPreference === 'Preferred') score += 10;
      score += (this.config.max_teacher_weekly_hours - currentWeekly); // Prefer less loaded teachers

      eligible.push({
        teacher_id: teacher.teacher_id,
        teacher_name: teacher.teacher_name,
        designation: teacher.designation,
        score,
        weekly_load: currentWeekly
      });
    }

    // Sort by score descending
    eligible.sort((a, b) => b.score - a.score);
    return eligible;
  }
}

module.exports = TeacherAllocator;
