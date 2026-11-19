import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Teachers from './pages/Teachers';
import TeacherProfile from './pages/TeacherProfile';
import Courses from './pages/Courses';
import Classrooms from './pages/Classrooms';
import TimeSlots from './pages/TimeSlots';
import Timetable from './pages/Timetable';
import TeacherAvailability from './pages/TeacherAvailability';
import Leaves from './pages/Leaves';
import Substitutions from './pages/Substitutions';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Archive from './pages/Archive';
import Generator from './pages/Generator';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="departments" element={<Departments />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/:id" element={<TeacherProfile />} />
        <Route path="courses" element={<Courses />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="time-slots" element={<TimeSlots />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="availability" element={<TeacherAvailability />} />
        <Route path="generator" element={<Generator />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="substitutions" element={<Substitutions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="archive" element={<Archive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
