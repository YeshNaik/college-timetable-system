/**
 * Constraint Validator - Validates hard and soft constraints
 */
const pool = require('../../db');

class ConstraintValidator {
  constructor(config) {
    this.config = config;
  }

  async checkHardConstraints(assignment, existingAssignments) {
    const conflicts = [];

    // 1. Teacher conflict
    const teacherConflict = existingAssignments.find(a => 
      a.teacher_id === assignment.teacher_id && a.slot_id === assignment.slot_id
    );
    if (teacherConflict) conflicts.push({ type: 'TEACHER_CONFLICT', message: `Teacher already assigned`, details: { existing_session: teacherConflict } });

    // 2. Classroom conflict
    const roomConflict = existingAssignments.find(a => 
      a.classroom_id === assignment.classroom_id && a.slot_id === assignment.slot_id
    );
    if (roomConflict) conflicts.push({ type: 'ROOM_CONFLICT', message: `Classroom already booked`, details: { existing_session: roomConflict } });

    // 3. Section conflict
    const sectionConflict = existingAssignments.find(a => 
      a.section_id === assignment.section_id && a.slot_id === assignment.slot_id
    );
    if (sectionConflict) conflicts.push({ type: 'SECTION_CONFLICT', message: `Section already has class`, details: { existing_session: sectionConflict } });

    // 4. Teacher qualification
    const [qualification] = await pool.query(
      'SELECT 1 FROM Teacher_Courses WHERE teacher_id = ? AND course_id = ?',
      [assignment.teacher_id, assignment.course_id]
    );
    if (qualification.length === 0) conflicts.push({ type: 'TEACHER_NOT_QUALIFIED', message: `Teacher not qualified`, details: { teacher_id: assignment.teacher_id, course_id: assignment.course_id } });

    // 5. Teacher availability
    const [availability] = await pool.query(
      `SELECT is_available, preference_level FROM Teacher_Availability WHERE teacher_id = ? AND slot_id = ?`,
      [assignment.teacher_id, assignment.slot_id]
    );
    if (availability.length > 0 && (!availability[0].is_available || availability[0].preference_level === 'Unavailable')) {
      conflicts.push({ type: 'TEACHER_UNAVAILABLE', message: `Teacher unavailable`, details: { teacher_id: assignment.teacher_id, slot_id: assignment.slot_id } });
    }

    // 6. Approved leave
    const [leave] = await pool.query(
      `SELECT 1 FROM Teacher_Leaves WHERE teacher_id = ? AND leave_status = 'Approved' AND ? BETWEEN start_date AND end_date`,
      [assignment.teacher_id, assignment.assignment_date]
    );
    if (leave.length > 0) conflicts.push({ type: 'TEACHER_ON_LEAVE', message: `Teacher on leave`, details: { teacher_id: assignment.teacher_id, date: assignment.assignment_date } });

    // 7. Room capacity and type
    const [room] = await pool.query('SELECT capacity, room_type FROM Classrooms WHERE classroom_id = ?', [assignment.classroom_id]);
    if (room.length > 0) {
      const requiredCapacity = assignment.is_practical 
        ? (assignment.min_room_capacity || Math.ceil(assignment.student_count / 2))
        : assignment.student_count;
      if (room[0].capacity < requiredCapacity) conflicts.push({ type: 'ROOM_CAPACITY', message: `Room capacity ${room[0].capacity} < ${requiredCapacity}`, details: { room_capacity: room[0].capacity, student_count: requiredCapacity } });
      if (assignment.required_room_type !== 'Any' && room[0].room_type !== assignment.required_room_type) conflicts.push({ type: 'ROOM_TYPE_MISMATCH', message: `Room type mismatch`, details: { room_type: room[0].room_type, required_type: assignment.required_room_type } });
    }

    // 8. Consecutive slots for practicals
    if (assignment.is_practical && assignment.consecutive_slots > 1) {
      const consecutiveConflict = await this.checkConsecutiveSlots(assignment, existingAssignments);
      if (consecutiveConflict) conflicts.push({ type: 'CONSECUTIVE_SLOTS', message: `Cannot find consecutive slots`, details: consecutiveConflict });
    }

    // 9. Max daily periods for teacher
    const teacherDailyCount = existingAssignments.filter(a => a.teacher_id === assignment.teacher_id && this.getDayOfWeek(a.slot_id) === this.getDayOfWeek(assignment.slot_id)).length;
    if (teacherDailyCount >= this.config.max_teacher_daily_hours) conflicts.push({ type: 'TEACHER_DAILY_LIMIT', message: `Teacher exceeds max daily hours`, details: { current_daily: teacherDailyCount, max: this.config.max_teacher_daily_hours } });

    // 10. Max daily for students
    const sectionDailyCount = existingAssignments.filter(a => a.section_id === assignment.section_id && this.getDayOfWeek(a.slot_id) === this.getDayOfWeek(assignment.slot_id)).length;
    if (sectionDailyCount >= this.config.max_student_daily_hours) conflicts.push({ type: 'SECTION_DAILY_LIMIT', message: `Section exceeds max daily`, details: { current_daily: sectionDailyCount, max: this.config.max_student_daily_hours } });

    return { valid: conflicts.length === 0, conflicts };
  }

  async checkConsecutiveSlots(assignment, existingAssignments) {
    const [slot] = await pool.query('SELECT slot_id, day_of_week, start_time FROM Time_Slots WHERE slot_id = ?', [assignment.slot_id]);
    if (slot.length === 0) return { reason: 'Slot not found' };
    const needed = assignment.consecutive_slots;
    let consecutive = 1;
    const [allSlots] = await pool.query(`SELECT slot_id, start_time FROM Time_Slots WHERE day_of_week = ? AND start_time > ? ORDER BY start_time`, [slot[0].day_of_week, slot[0].start_time]);
    for (const nextSlot of allSlots) {
      const teacherBusy = existingAssignments.some(a => a.teacher_id === assignment.teacher_id && a.slot_id === nextSlot.slot_id);
      const roomBusy = existingAssignments.some(a => a.classroom_id === assignment.classroom_id && a.slot_id === nextSlot.slot_id);
      const sectionBusy = existingAssignments.some(a => a.section_id === assignment.section_id && a.slot_id === nextSlot.slot_id);
      if (!teacherBusy && !roomBusy && !sectionBusy) { consecutive++; if (consecutive >= needed) return null; } else break;
    }
    if (consecutive < needed) return { reason: `Only ${consecutive} consecutive slots, need ${needed}` };
    return null;
  }

  checkSoftConstraints(assignment, existingAssignments) {
    const warnings = [];
    const sameSubjectSameDay = existingAssignments.filter(a => a.course_id === assignment.course_id && a.section_id === assignment.section_id && this.getDayOfWeek(a.slot_id) === this.getDayOfWeek(assignment.slot_id)).length;
    if (sameSubjectSameDay > 0) warnings.push({ type: 'SAME_SUBJECT_SAME_DAY', message: `Subject already on this day`, severity: 'medium' });
    const teacherConsecutive = this.countConsecutiveSlots(existingAssignments, assignment.teacher_id, assignment.slot_id);
    if (teacherConsecutive >= 3) warnings.push({ type: 'TEACHER_CONSECUTIVE_CLASSES', message: `Teacher has ${teacherConsecutive} consecutive`, severity: 'low' });
    const studentConsecutive = this.countConsecutiveSlots(existingAssignments, assignment.section_id, assignment.slot_id, 'section_id');
    if (studentConsecutive >= 4) warnings.push({ type: 'STUDENT_CONSECUTIVE_CLASSES', message: `Students have ${studentConsecutive} consecutive`, severity: 'medium' });
    const teacherWeekly = existingAssignments.filter(a => a.teacher_id === assignment.teacher_id).length;
    if (teacherWeekly >= this.config.max_teacher_weekly_hours * 0.8) warnings.push({ type: 'TEACHER_WORKLOAD_HIGH', message: `Teacher near weekly limit`, severity: 'low' });
    return warnings;
  }

  setSlotCache(cache) {
    this.slotCache = cache;
  }

  getDayOfWeek(slotId) {
    if (this.slotCache && this.slotCache.has(slotId)) {
      return this.slotCache.get(slotId).day_of_week;
    }
    const dayMap = { 1: 'Monday', 2: 'Monday', 3: 'Monday', 4: 'Monday', 5: 'Monday', 6: 'Monday', 7: 'Monday', 8: 'Monday', 9: 'Tuesday', 10: 'Tuesday', 11: 'Tuesday', 12: 'Tuesday', 13: 'Tuesday', 14: 'Tuesday', 15: 'Tuesday', 16: 'Tuesday', 17: 'Wednesday', 18: 'Wednesday', 19: 'Wednesday', 20: 'Wednesday', 21: 'Wednesday', 22: 'Wednesday', 23: 'Wednesday', 24: 'Wednesday', 25: 'Thursday', 26: 'Thursday', 27: 'Thursday', 28: 'Thursday', 29: 'Thursday', 30: 'Thursday', 31: 'Thursday', 32: 'Thursday', 33: 'Friday', 34: 'Friday', 35: 'Friday', 36: 'Friday', 37: 'Friday', 38: 'Friday', 39: 'Friday', 40: 'Friday', 41: 'Saturday', 42: 'Saturday', 43: 'Saturday', 44: 'Saturday' };
    return dayMap[slotId] || 'Monday';
  }

  countConsecutiveSlots(assignments, entityId, slotId, entityField = 'teacher_id') {
    const day = this.getDayOfWeek(slotId);
    const daySlots = assignments.filter(a => a[entityField] === entityId && this.getDayOfWeek(a.slot_id) === day).map(a => a.slot_id).sort((a, b) => a - b);
    if (daySlots.length === 0) return 0;
    let maxConsecutive = 1, current = 1;
    for (let i = 1; i < daySlots.length; i++) { if (daySlots[i] === daySlots[i - 1] + 1) { current++; maxConsecutive = Math.max(maxConsecutive, current); } else current = 1; }
    return maxConsecutive;
  }
}

module.exports = ConstraintValidator;
