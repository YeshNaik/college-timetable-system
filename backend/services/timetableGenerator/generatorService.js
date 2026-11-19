/**
 * Generator Service - Main entry point for timetable generation
 */
const pool = require('../../db');
const SessionBuilder = require('./sessionBuilder');
const ConstraintValidator = require('./constraintValidator');
const TeacherAllocator = require('./teacherAllocator');
const ClassroomAllocator = require('./classroomAllocator');
const Scheduler = require('./scheduler');

class GeneratorService {
  constructor() {
    this.config = null;
    this.sessionBuilder = null;
    this.validator = null;
    this.teacherAllocator = null;
    this.classroomAllocator = null;
    this.scheduler = null;
  }

  /**
   * Initialize the generator with configuration
   */
  async initialize(departmentId, academicSession) {
    // Load timetable configuration
    const [config] = await pool.query(
      'SELECT * FROM Timetable_Configuration WHERE department_id = ? AND academic_session = ?',
      [departmentId, academicSession]
    );

    if (config.length === 0) {
      throw new Error('Timetable configuration not found for this department and session');
    }

    this.config = config[0];
    
    // Parse working days
    try {
      this.config.working_days = typeof this.config.working_days === 'string'
        ? JSON.parse(this.config.working_days || '[]')
        : this.config.working_days;
    } catch (e) {
      this.config.working_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }

    // Initialize components
    this.sessionBuilder = new SessionBuilder(this.config);
    this.validator = new ConstraintValidator(this.config);
    this.teacherAllocator = new TeacherAllocator(this.config);
    this.classroomAllocator = new ClassroomAllocator(this.config);
    this.scheduler = new Scheduler(this.config, this.validator, this.teacherAllocator, this.classroomAllocator);

    return this.config;
  }

  /**
   * Generate timetable for given scope
   */
  async generate(options) {
    const {
      departmentId,
      academicSession,
      academicYearId,
      semester,
      sectionId,
      generationScope,
      assignmentDate
    } = options;

    // Initialize configuration for the requested department and session
    await this.initialize(departmentId, academicSession);

    // Build sessions
    const sessions = await this.sessionBuilder.buildSessions({
      departmentId,
      academicSession,
      academicYearId,
      semester,
      sectionId,
      generationScope
    });

    if (sessions.length === 0) {
      return {
        success: false,
        message: 'No sessions to schedule. Check subject requirements configuration.',
        sessions: []
      };
    }

    // Get existing timetable entries (locked entries that cannot be moved)
    const existingAssignments = await this.getExistingAssignments({
      departmentId,
      academicSession,
      academicYearId,
      semester,
      sectionId
    });

    // Run scheduler
    const result = await this.scheduler.schedule(sessions, existingAssignments, assignmentDate);

    return {
      success: result.unassigned.length === 0,
      message: result.unassigned.length === 0 
        ? 'Timetable generated successfully'
        : `Generated with ${result.unassigned.length} unassigned sessions`,
      sessions: result.assignments.filter(a => !existingAssignments.includes(a)),
      unassigned: result.unassigned,
      warnings: result.warnings,
      conflicts: result.conflicts,
      stats: result.stats
    };
  }

  /**
   * Get existing timetable assignments that should be preserved
   */
  async getExistingAssignments(options) {
    const { departmentId, academicSession, academicYearId, semester, sectionId } = options;
    
    let query = 
      `SELECT t.timetable_id, t.course_id, t.teacher_id, t.classroom_id, t.slot_id,
              t.section, t.semester, t.academic_year,
              c.course_name, c.course_code, te.teacher_name, cr.room_number, cr.building,
              ts.day_of_week, ts.start_time, ts.end_time,
              s.section_id, s.section_name, s.student_count,
              ay.academic_year_id, ay.year_number
       FROM Timetable t
       JOIN Courses c ON t.course_id = c.course_id
       JOIN Teachers te ON t.teacher_id = te.teacher_id
       JOIN Classrooms cr ON t.classroom_id = cr.classroom_id
       JOIN Time_Slots ts ON t.slot_id = ts.slot_id
       JOIN Academic_Years ay ON c.department_id = ay.department_id
       JOIN Sections s ON t.section = s.section_name AND s.academic_year_id = ay.academic_year_id
       WHERE c.department_id = ?`;
    const params = [departmentId];

    if (academicSession) {
      query += ' AND t.academic_year = ?';
      params.push(academicSession);
    }

    if (academicYearId) {
      query += ' AND ay.academic_year_id = ?';
      params.push(academicYearId);
    }
    if (semester) {
      query += ' AND t.semester = ?';
      params.push(semester);
    }
    if (sectionId) {
      query += ' AND s.section_id = ?';
      params.push(sectionId);
    }

    const [rows] = await pool.query(query, params);

    // Convert to assignment format
    return rows.map(r => ({
      timetable_id: r.timetable_id,
      course_id: r.course_id,
      course_name: r.course_name,
      course_code: r.course_code,
      teacher_id: r.teacher_id,
      teacher_name: r.teacher_name,
      classroom_id: r.classroom_id,
      room_number: r.room_number,
      building: r.building,
      slot_id: r.slot_id,
      day_of_week: r.day_of_week,
      start_time: r.start_time,
      end_time: r.end_time,
      section_id: r.section_id,
      section_name: r.section_name,
      student_count: r.student_count,
      academic_year_id: r.academic_year_id,
      year_number: r.year_number,
      semester: r.semester,
      is_practical: false, // Would need to determine from session type
      locked: true // Existing entries are locked
    }));
  }

  /**
   * Save generated timetable to database
   */
  async saveTimetable(generatedSessions, options) {
    const { departmentId, academicSession, academicYearId, semester, createdBy } = options;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create generation job record
      const [jobResult] = await connection.query(
        `INSERT INTO Generation_Jobs 
         (department_id, academic_session, academic_year_id, semester, generation_scope, 
          status, total_sessions_required, sessions_scheduled, algorithm_used, started_at, completed_at, created_by)
         VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, 'backtracking', NOW(), NOW(), ?)`,
        [departmentId, academicSession, academicYearId, semester, 'department', 
         generatedSessions.length, generatedSessions.length, createdBy]
      );
      const jobId = jobResult.insertId;

      // Save generation results
      for (const session of generatedSessions) {
        await connection.query(
          `INSERT INTO Generation_Results
           (job_id, course_id, teacher_id, classroom_id, slot_id, section_id, academic_year_id, semester, session_type, session_number, is_practical)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [jobId, session.course_id, session.teacher_id, session.classroom_id, session.slot_id,
           session.section_id, session.academic_year_id, session.semester, 
           session.session_type, session.session_number, session.is_practical || false]
        );

        // Also create actual Timetable entries
        await connection.query(
          `INSERT INTO Timetable (course_id, teacher_id, classroom_id, slot_id, day_of_week, section, semester, academic_year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [session.course_id, session.teacher_id, session.classroom_id, session.slot_id,
           session.day_of_week || 'Monday', session.section_name, session.semester, academicSession]
        );
      }

      await connection.commit();
      return { success: true, jobId, message: 'Timetable saved successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(departmentId, academicSession) {
    const [jobs] = await pool.query(
      `SELECT gj.*
       FROM Generation_Jobs gj
       WHERE gj.department_id = ? AND gj.academic_session = ?
       ORDER BY gj.created_at DESC`,
      [departmentId, academicSession]
    );
    return jobs;
  }

  /**
   * Get generation results for a job
   */
  async getGenerationResults(jobId) {
    const [results] = await pool.query(
      `SELECT gr.*, c.course_name, c.course_code, t.teacher_name, cl.room_number, cl.building,
              ts.day_of_week, ts.start_time, ts.end_time, s.section_name, ay.year_name
       FROM Generation_Results gr
       JOIN Courses c ON gr.course_id = c.course_id
       JOIN Teachers t ON gr.teacher_id = t.teacher_id
       JOIN Classrooms cl ON gr.classroom_id = cl.classroom_id
       JOIN Time_Slots ts ON gr.slot_id = ts.slot_id
       JOIN Sections s ON gr.section_id = s.section_id
       JOIN Academic_Years ay ON gr.academic_year_id = ay.academic_year_id
       WHERE gr.job_id = ?
       ORDER BY ts.day_of_week, ts.start_time`,
      [jobId]
    );
    return results;
  }
}

module.exports = new GeneratorService();
