/**
 * Classroom Allocator - Finds best classroom for a session
 */
const pool = require('../../db');

class ClassroomAllocator {
  constructor(config) {
    this.config = config;
  }

  async findEligibleClassrooms(session, existingAssignments, slotId = null) {
    const targetSlotId = slotId || session.slot_id;

    const requiredCapacity = session.is_practical 
      ? (session.min_room_capacity || Math.ceil(session.student_count / 2))
      : session.student_count;

    let query = 
      `SELECT c.classroom_id, c.room_number, c.building, c.capacity, c.room_type
       FROM Classrooms c
       WHERE c.capacity >= ?`;
    const params = [requiredCapacity];

    if (session.required_room_type !== 'Any') {
      query += ' AND c.room_type = ?';
      params.push(session.required_room_type);
    }

    query += ' ORDER BY c.capacity ASC';

    const [classrooms] = await pool.query(query, params);

    const eligible = [];

    for (const room of classrooms) {
      if (targetSlotId) {
        // Check if room is already booked at this slot in existing timetable
        const roomDbQuery = this.config.academic_session
          ? 'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ? AND academic_year = ?'
          : 'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ?';
        const roomDbParams = this.config.academic_session
          ? [room.classroom_id, targetSlotId, this.config.academic_session]
          : [room.classroom_id, targetSlotId];
        const [existingAtSlot] = await pool.query(roomDbQuery, roomDbParams);
        if (existingAtSlot.length > 0) continue;

        // Check if room already assigned at this slot in current generation
        const assignedAtSlot = existingAssignments.some(a => 
          a.classroom_id === room.classroom_id && a.slot_id === targetSlotId
        );
        if (assignedAtSlot) continue;

        // Check if room is booked for consecutive slots (for practicals)
        if (session.is_practical && session.consecutive_slots > 1) {
          const roomFree = await this.checkRoomConsecutiveFree(room.classroom_id, targetSlotId, session.consecutive_slots, existingAssignments);
          if (!roomFree) continue;
        }
      }

      // Score: prefer smaller rooms that fit (better utilization)
      let score = 100 - (room.capacity - session.student_count);
      // Prefer correct room type
      if (session.required_room_type !== 'Any' && room.room_type === session.required_room_type) {
        score += 50;
      }

      eligible.push({
        classroom_id: room.classroom_id,
        room_number: room.room_number,
        building: room.building,
        capacity: room.capacity,
        room_type: room.room_type,
        score
      });
    }

    eligible.sort((a, b) => b.score - a.score);
    return eligible;
  }

  async checkRoomConsecutiveFree(classroomId, slotId, needed, existingAssignments) {
    const [slot] = await pool.query('SELECT day_of_week, start_time FROM Time_Slots WHERE slot_id = ?', [slotId]);
    if (slot.length === 0) return false;
    
    const [allSlots] = await pool.query(
      `SELECT slot_id FROM Time_Slots WHERE day_of_week = ? AND start_time > ? ORDER BY start_time`,
      [slot[0].day_of_week, slot[0].start_time]
    );

    let consecutive = 1;
    if (consecutive >= needed) return true;

    for (const nextSlot of allSlots) {
      const roomDbQuery = this.config.academic_session
        ? 'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ? AND academic_year = ?'
        : 'SELECT 1 FROM Timetable WHERE classroom_id = ? AND slot_id = ?';
      const roomDbParams = this.config.academic_session
        ? [classroomId, nextSlot.slot_id, this.config.academic_session]
        : [classroomId, nextSlot.slot_id];
      const roomDbBusy = await pool.query(roomDbQuery, roomDbParams);
      if (roomDbBusy[0].length > 0) break;

      const roomBusy = existingAssignments.some(a => a.classroom_id === classroomId && a.slot_id === nextSlot.slot_id);
      if (!roomBusy) {
        consecutive++;
        if (consecutive >= needed) return true;
      } else {
        break;
      }
    }
    return false;
  }
}

module.exports = ClassroomAllocator;
