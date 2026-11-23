/**
 * Scheduler - Main backtracking algorithm for timetable generation
 */
const pool = require('../../db');

class Scheduler {
  constructor(config, constraintValidator, teacherAllocator, classroomAllocator) {
    this.config = config;
    this.validator = constraintValidator;
    this.teacherAllocator = teacherAllocator;
    this.classroomAllocator = classroomAllocator;
    this.maxBacktracks = 1000;
    this.backtrackCount = 0;
    this.slotCache = new Map();
  }

  async loadSlotCache() {
    const [slots] = await pool.query('SELECT slot_id, day_of_week, start_time, end_time FROM Time_Slots');
    this.slotCache = new Map(slots.map(s => [s.slot_id, s]));
    if (this.validator && this.validator.setSlotCache) {
      this.validator.setSlotCache(this.slotCache);
    }
  }

  /**
   * Main scheduling algorithm using backtracking
   */
  async schedule(sessions, existingAssignments, assignmentDate) {
    this.backtrackCount = 0;
    await this.loadSlotCache();

    const assignments = [...existingAssignments];
    const unassigned = [];
    const warnings = [];
    const conflicts = [];

    // Sort sessions by priority (already done by SessionBuilder)
    for (const session of sessions) {
      const assigned = await this.assignSession(session, assignments, assignmentDate);
      if (assigned) {
        const list = Array.isArray(assigned) ? assigned : [assigned];
        assignments.push(...list);
        for (const a of list) {
          if (a.warnings && Array.isArray(a.warnings)) {
            warnings.push(...a.warnings);
          }
        }
      } else {
        const conflictItem = {
          session,
          reason: 'No conflict-free time slot, qualified teacher, or suitable classroom could be found'
        };
        unassigned.push(conflictItem);
        conflicts.push(conflictItem);
      }
    }

    return {
      assignments,
      unassigned,
      warnings: [...new Set(warnings.map(w => JSON.stringify(w)))].map(w => JSON.parse(w)),
      conflicts,
      stats: {
        total: sessions.length,
        scheduled: assignments.length - existingAssignments.length,
        unassigned: unassigned.length,
        backtracks: this.backtrackCount
      }
    };
  }

  findConsecutiveSlots(startSlot, count) {
    if (count <= 1) return [startSlot];
    const daySlots = [...this.slotCache.values()]
      .filter(s => s.day_of_week === startSlot.day_of_week)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const startIndex = daySlots.findIndex(s => s.slot_id === startSlot.slot_id);
    if (startIndex === -1 || startIndex + count > daySlots.length) return null;
    
    const chain = [startSlot];
    for (let i = 1; i < count; i++) {
      const prev = chain[i - 1];
      const next = daySlots[startIndex + i];
      if (next.start_time === prev.end_time) {
        chain.push(next);
      } else {
        return null;
      }
    }
    return chain;
  }

  /**
   * Try to assign a single session using backtracking
   */
  async assignSession(session, assignments, assignmentDate) {
    let sessionBacktracks = 0;
    // Get available time slots for this session first
    const availableSlots = await this.getAvailableSlots(session, assignments);
    if (availableSlots.length === 0) {
      return null;
    }

    // Try each time slot candidate
    for (const slot of availableSlots) {
      let slotChain = [slot];
      if (session.is_practical && session.consecutive_slots > 1) {
        slotChain = this.findConsecutiveSlots(slot, session.consecutive_slots);
        if (!slotChain) continue;
      }

      // Find eligible teachers for this course and slot
      const teachers = await this.teacherAllocator.findEligibleTeachers(session, assignments, assignmentDate, slot.slot_id);
      if (teachers.length === 0) continue;

      // Find eligible classrooms for this session and slot
      const classrooms = await this.classroomAllocator.findEligibleClassrooms(session, assignments, slot.slot_id);
      if (classrooms.length === 0) continue;

      for (const teacher of teachers) {
        for (const classroom of classrooms) {
          const assignment = {
            ...session,
            teacher_id: teacher.teacher_id,
            teacher_name: teacher.teacher_name,
            classroom_id: classroom.classroom_id,
            room_number: classroom.room_number,
            building: classroom.building,
            slot_id: slot.slot_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            assignment_date: assignmentDate
          };

          // Check hard constraints
          const hardCheck = await this.validator.checkHardConstraints(assignment, assignments);
          if (!hardCheck.valid) {
            this.backtrackCount++;
            sessionBacktracks++;
            if (sessionBacktracks > this.maxBacktracks) {
              return null;
            }
            continue;
          }

          // If practical with multiple slots, ensure companions are conflict-free
          let chainConflict = false;
          if (slotChain.length > 1) {
            for (let i = 1; i < slotChain.length; i++) {
              const nextSlot = slotChain[i];
              const tBusy = assignments.some(a => a.teacher_id === teacher.teacher_id && a.slot_id === nextSlot.slot_id);
              const rBusy = assignments.some(a => a.classroom_id === classroom.classroom_id && a.slot_id === nextSlot.slot_id);
              const sBusy = assignments.some(a => a.section_id === session.section_id && a.slot_id === nextSlot.slot_id);
              if (tBusy || rBusy || sBusy) {
                chainConflict = true;
                break;
              }
            }
          }
          if (chainConflict) continue;

          // Check soft constraints
          const warnings = this.validator.checkSoftConstraints(assignment, assignments);

          // Valid assignment found! Return full chain of slots
          const result = [{
            ...assignment,
            warnings,
            teacher_score: teacher.score,
            classroom_score: classroom.score
          }];

          for (let i = 1; i < slotChain.length; i++) {
            const nextSlot = slotChain[i];
            result.push({
              ...session,
              teacher_id: teacher.teacher_id,
              teacher_name: teacher.teacher_name,
              classroom_id: classroom.classroom_id,
              room_number: classroom.room_number,
              building: classroom.building,
              slot_id: nextSlot.slot_id,
              day_of_week: nextSlot.day_of_week,
              start_time: nextSlot.start_time,
              end_time: nextSlot.end_time,
              assignment_date: assignmentDate,
              is_consecutive_part: true
            });
          }

          return result;
        }
      }
    }

    return null;
  }

  /**
   * Get available time slots for a session
   */
  async getAvailableSlots(session, assignments) {
    // Get all slots
    let query = 
      `SELECT ts.slot_id, ts.day_of_week, ts.start_time, ts.end_time
       FROM Time_Slots ts
       ORDER BY FIELD(ts.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ts.start_time`;

    const [slots] = await pool.query(query);

    // Filter out slots already used by this section
    const available = slots.filter(slot => {
      const sectionBusy = assignments.some(a => a.section_id === session.section_id && a.slot_id === slot.slot_id);
      if (sectionBusy) return false;
      return true;
    });

    // Sort slots to spread across days
    return this.sortSlotsForDistribution(available, session, assignments);
  }

  /**
   * Sort slots to achieve good distribution across days
   */
  sortSlotsForDistribution(slots, session, assignments) {
    // Count sessions per day for this section
    const dayCounts = {};
    for (const a of assignments) {
      if (a.section_id === session.section_id) {
        const day = a.day_of_week || this.getDayOfWeek(a.slot_id);
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }

    // Sort slots by day (prefer days with fewer sessions)
    return slots.sort((a, b) => {
      const dayA = a.day_of_week || this.getDayOfWeek(a.slot_id);
      const dayB = b.day_of_week || this.getDayOfWeek(b.slot_id);
      const countA = dayCounts[dayA] || 0;
      const countB = dayCounts[dayB] || 0;
      return countA - countB;
    });
  }

  getDayOfWeek(slotId) {
    if (this.slotCache && this.slotCache.has(slotId)) {
      return this.slotCache.get(slotId).day_of_week;
    }
    const dayMap = {
      1: 'Monday', 2: 'Monday', 3: 'Monday', 4: 'Monday', 5: 'Monday', 6: 'Monday', 7: 'Monday', 8: 'Monday',
      9: 'Tuesday', 10: 'Tuesday', 11: 'Tuesday', 12: 'Tuesday', 13: 'Tuesday', 14: 'Tuesday', 15: 'Tuesday', 16: 'Tuesday',
      17: 'Wednesday', 18: 'Wednesday', 19: 'Wednesday', 20: 'Wednesday', 21: 'Wednesday', 22: 'Wednesday', 23: 'Wednesday', 24: 'Wednesday',
      25: 'Thursday', 26: 'Thursday', 27: 'Thursday', 28: 'Thursday', 29: 'Thursday', 30: 'Thursday', 31: 'Thursday', 32: 'Thursday',
      33: 'Friday', 34: 'Friday', 35: 'Friday', 36: 'Friday', 37: 'Friday', 38: 'Friday', 39: 'Friday', 40: 'Friday',
      41: 'Saturday', 42: 'Saturday', 43: 'Saturday', 44: 'Saturday'
    };
    return dayMap[slotId] || 'Monday';
  }
}

module.exports = Scheduler;
