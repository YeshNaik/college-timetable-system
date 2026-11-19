const express = require('express');
const pool = require('../db');
const generatorService = require('../services/timetableGenerator/generatorService');

const router = express.Router();

// POST /api/generation/generate - Generate timetable
router.post('/generate', async (req, res) => {
  try {
    const {
      department_id,
      academic_session,
      academic_year_id,
      semester,
      section_id,
      generation_scope = 'department'
    } = req.body;

    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const assignmentDate = new Date().toISOString().split('T')[0];

    const result = await generatorService.generate({
      departmentId: department_id,
      academicSession: academic_session,
      academicYearId: academic_year_id,
      semester: semester,
      sectionId: section_id,
      generationScope: generation_scope,
      assignmentDate
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(409).json(result);
    }
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ message: error.message || 'Generation failed' });
  }
});

// POST /api/generation/save - Save generated timetable
router.post('/save', async (req, res) => {
  try {
    const department_id = req.body.department_id || (Array.isArray(req.body.sessions) && req.body.sessions[0]?.department_id);
    const created_by = req.body.created_by || 1;
    const { sessions, academic_session, academic_year_id, semester } = req.body;

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ message: 'sessions array is required' });
    }
    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const result = await generatorService.saveTimetable(sessions, {
      departmentId: department_id,
      academicSession: academic_session,
      academicYearId: academic_year_id,
      semester: semester,
      createdBy: created_by
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Save timetable error:', error);
    res.status(500).json({ message: error.message || 'Failed to save timetable' });
  }
});

// GET /api/generation/history - Get generation history
router.get('/history', async (req, res) => {
  try {
    const { department_id, academic_session } = req.query;
    
    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const history = await generatorService.getGenerationHistory(department_id, academic_session);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: error.message || 'Failed to get history' });
  }
});

// GET /api/generation/results/:jobId - Get generation results
router.get('/results/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const results = await generatorService.getGenerationResults(jobId);
    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: error.message || 'Failed to get results' });
  }
});

// GET /api/generation/preview - Preview generated timetable (without saving)
router.post('/preview', async (req, res) => {
  try {
    const {
      department_id,
      academic_session,
      academic_year_id,
      semester,
      section_id,
      generation_scope = 'department'
    } = req.body;

    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const assignmentDate = new Date().toISOString().split('T')[0];

    const result = await generatorService.generate({
      departmentId: department_id,
      academicSession: academic_session,
      academicYearId: academic_year_id,
      semester: semester,
      sectionId: section_id,
      generationScope: generation_scope,
      assignmentDate
    });

    res.json(result);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: error.message || 'Preview failed' });
  }
});

// GET /api/generation/config - Get timetable configuration for department
router.get('/config', async (req, res) => {
  try {
    const { department_id, academic_session } = req.query;
    
    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const [config] = await pool.query(
      'SELECT * FROM Timetable_Configuration WHERE department_id = ? AND academic_session = ?',
      [department_id, academic_session]
    );

    if (config.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    try {
      config[0].working_days = typeof config[0].working_days === 'string' 
        ? JSON.parse(config[0].working_days || '[]') 
        : config[0].working_days;
    } catch (e) {
      config[0].working_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    res.json(config[0]);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: error.message || 'Failed to get config' });
  }
});

// POST /api/generation/config - Create/update timetable configuration
router.post('/config', async (req, res) => {
  try {
    const {
      department_id,
      academic_session,
      college_start_time,
      college_end_time,
      working_days,
      period_duration_minutes,
      short_break_after_period,
      short_break_duration_minutes,
      lunch_break_start,
      lunch_break_end,
      max_daily_periods,
      max_teacher_daily_hours,
      max_teacher_weekly_hours,
      max_student_daily_hours,
      allow_saturday
    } = req.body;

    if (!department_id || !academic_session) {
      return res.status(400).json({ message: 'department_id and academic_session are required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO Timetable_Configuration 
         (department_id, academic_session, college_start_time, college_end_time, working_days,
          period_duration_minutes, short_break_after_period, short_break_duration_minutes,
          lunch_break_start, lunch_break_end, max_daily_periods,
          max_teacher_daily_hours, max_teacher_weekly_hours, max_student_daily_hours, allow_saturday)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           college_start_time = VALUES(college_start_time),
           college_end_time = VALUES(college_end_time),
           working_days = VALUES(working_days),
           period_duration_minutes = VALUES(period_duration_minutes),
           short_break_after_period = VALUES(short_break_after_period),
           short_break_duration_minutes = VALUES(short_break_duration_minutes),
           lunch_break_start = VALUES(lunch_break_start),
           lunch_break_end = VALUES(lunch_break_end),
           max_daily_periods = VALUES(max_daily_periods),
           max_teacher_daily_hours = VALUES(max_teacher_daily_hours),
           max_teacher_weekly_hours = VALUES(max_teacher_weekly_hours),
           max_student_daily_hours = VALUES(max_student_daily_hours),
           allow_saturday = VALUES(allow_saturday),
           updated_at = NOW()`,
        [
          department_id, academic_session, college_start_time || '09:00:00', college_end_time || '17:00:00',
          JSON.stringify(working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
          period_duration_minutes || 60, short_break_after_period || 2, short_break_duration_minutes || 10,
          lunch_break_start || '13:00:00', lunch_break_end || '14:00:00',
          max_daily_periods || 8, max_teacher_daily_hours || 6, max_teacher_weekly_hours || 20,
          max_student_daily_hours || 7, allow_saturday !== false
        ]
      );

      await connection.commit();
      res.status(201).json({ message: 'Configuration saved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Save config error:', error);
    res.status(500).json({ message: error.message || 'Failed to save config' });
  }
});

module.exports = router;
