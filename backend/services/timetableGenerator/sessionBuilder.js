/**
 * Session Builder - Creates teaching sessions from subject requirements
 */
const pool = require('../../db');

class SessionBuilder {
  constructor(config) {
    this.config = config;
  }

  /**
   * Build all required sessions for the given scope
   */
  async buildSessions({ departmentId, academicSession, academicYearId, semester, sectionId, generationScope }) {
    let query = `
      SELECT 
        sr.*,
        c.course_id,
        c.course_name,
        c.course_code,
        c.department_id,
        ay.year_number,
        ay.year_name,
        s.section_id,
        s.section_name,
        s.section_code,
        s.student_count
      FROM Subject_Requirements sr
      JOIN Courses c ON sr.course_id = c.course_id
      JOIN Academic_Years ay ON sr.academic_year_id = ay.academic_year_id
      JOIN Sections s ON ay.academic_year_id = s.academic_year_id
      WHERE c.department_id = ?
        AND sr.is_active = TRUE
        AND s.is_active = TRUE
        AND ay.is_active = TRUE
    `;
    const params = [departmentId];

    if (academicYearId) {
      query += ' AND sr.academic_year_id = ?';
      params.push(academicYearId);
    }
    if (semester) {
      query += ' AND sr.semester = ?';
      params.push(semester);
    }
    if (sectionId) {
      query += ' AND s.section_id = ?';
      params.push(sectionId);
    }

    query += ' ORDER BY ay.year_number, s.section_name, c.course_code';

    const [requirements] = await pool.query(query, params);

    const sessions = [];

    for (const req of requirements) {
      // Create lecture sessions
      for (let i = 1; i <= req.weekly_lectures; i++) {
        sessions.push({
          course_id: req.course_id,
          course_name: req.course_name,
          course_code: req.course_code,
          academic_year_id: req.academic_year_id,
          year_number: req.year_number,
          year_name: req.year_name,
          semester: req.semester,
          section_id: req.section_id,
          section_name: req.section_name,
          section_code: req.section_code,
          student_count: req.student_count,
          session_type: 'lecture',
          session_number: i,
          is_practical: false,
          duration_minutes: req.lecture_duration_minutes,
          required_room_type: req.required_room_type === 'Laboratory' ? 'Lecture Hall' : (req.required_room_type || 'Lecture Hall'),
          min_room_capacity: req.student_count,
          priority: this.calculatePriority(req, 'lecture', i)
        });
      }

      // Create practical sessions
      for (let i = 1; i <= req.weekly_practicals; i++) {
        sessions.push({
          course_id: req.course_id,
          course_name: req.course_name,
          course_code: req.course_code,
          academic_year_id: req.academic_year_id,
          year_number: req.year_number,
          year_name: req.year_name,
          semester: req.semester,
          section_id: req.section_id,
          section_name: req.section_name,
          section_code: req.section_code,
          student_count: req.student_count,
          session_type: 'practical',
          session_number: i,
          is_practical: true,
          duration_minutes: req.practical_duration_minutes,
          required_room_type: req.required_room_type === 'Lecture Hall' ? 'Laboratory' : (req.required_room_type || 'Laboratory'),
          min_room_capacity: req.required_room_type === 'Lecture Hall' ? 40 : (req.min_room_capacity || 40),
          consecutive_slots: req.practical_consecutive_slots,
          priority: this.calculatePriority(req, 'practical', i)
        });
      }
    }

    // Sort by priority (higher priority first - more constrained sessions first)
    sessions.sort((a, b) => b.priority - a.priority);

    return sessions;
  }

  /**
   * Calculate scheduling priority for a session
   * Higher priority = more constrained = schedule first
   */
  calculatePriority(req, type, sessionNumber) {
    let priority = 0;

    // Practical sessions are harder to schedule (need consecutive slots, specific rooms)
    if (type === 'practical') {
      priority += 100;
    }

    // Fewer qualified teachers = higher priority
    // This would require a query to Teacher_Courses, simplified here
    priority += 50;

    // Larger student count = higher priority (bigger rooms harder to find)
    priority += Math.min(req.student_count / 10, 30);

    // Earlier session numbers get slight priority
    priority += (10 - sessionNumber);

    return priority;
  }
}

module.exports = SessionBuilder;