require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'College Timetable API', version: '1.0.0' });
});

// API Routes
const dashboardRoutes = require('./routes/dashboard');
const departmentsRoutes = require('./routes/departments');
const teachersRoutes = require('./routes/teachers');
const coursesRoutes = require('./routes/courses');
const classroomsRoutes = require('./routes/classrooms');
const timeSlotsRoutes = require('./routes/timeSlots');
const timetableRoutes = require('./routes/timetable');
const leavesRoutes = require('./routes/leaves');
const substitutionsRoutes = require('./routes/substitutions');
const reportsRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const archiveRoutes = require('./routes/archive');
const generationRoutes = require('./routes/generation');
const academicYearsRoutes = require('./routes/academicYears');
const sectionsRoutes = require('./routes/sections');
const subjectRequirementsRoutes = require('./routes/subjectRequirements');
const teacherAvailabilityRoutes = require('./routes/teacherAvailability');

app.use('/api', dashboardRoutes);
app.use('/api', departmentsRoutes);
app.use('/api', teachersRoutes);
app.use('/api', coursesRoutes);
app.use('/api', classroomsRoutes);
app.use('/api', timeSlotsRoutes);
app.use('/api', timetableRoutes);
app.use('/api', leavesRoutes);
app.use('/api', substitutionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', auditRoutes);
app.use('/api', archiveRoutes);
app.use('/api/generation', generationRoutes);
app.use('/api', academicYearsRoutes);
app.use('/api', sectionsRoutes);
app.use('/api', subjectRequirementsRoutes);
app.use('/api', teacherAvailabilityRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Base URL: /api/*');
});

module.exports = app;