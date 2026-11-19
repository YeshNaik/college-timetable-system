// Types mirror the 11 MySQL tables (snake_case column names). Joined display
// fields (e.g. department_name) are optional because they come from backend JOINs.

export interface Department {
  department_id: number;
  department_name: string;
  department_code: string;
  teacher_count?: number;
  course_count?: number;
}

export interface Teacher {
  teacher_id: number;
  teacher_name: string;
  email: string;
  phone: string;
  department_id: number;
  department_name?: string;
  designation: string;
  status: string;
}

export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  department_name?: string;
  credits: number;
  teacher_count?: number;
  teacher_names?: string | string[];
}

export interface Classroom {
  classroom_id: number;
  room_number: string;
  building: string;
  capacity: number;
  room_type: string;
}

export interface TimeSlot {
  slot_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface TimetableEntry {
  timetable_id: number;
  course_id: number;
  teacher_id: number;
  classroom_id: number;
  slot_id: number;
  section: string;
  semester: string | number;
  academic_year: string;
  // joined
  course_name?: string;
  course_code?: string;
  teacher_name?: string;
  room_number?: string;
  building?: string;
  department_id?: number;
  department_name?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
}

export interface Leave {
  leave_id: number;
  teacher_id: number;
  teacher_name?: string;
  department_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  applied_on?: string;
}

export interface Substitution {
  substitution_id: number;
  timetable_id: number;
  absent_teacher_id: number;
  substitute_teacher_id: number;
  absent_teacher_name?: string;
  substitute_teacher_name?: string;
  course_name?: string;
  course_code?: string;
  room_number?: string;
  section?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  substitution_date: string;
  status: string;
}

export interface SubstituteCandidate {
  teacher_id: number;
  teacher_name: string;
  department_name?: string;
  qualified_course?: string;
  is_available: boolean;
  existing_classes: number;
  is_eligible: boolean;
  reason?: string;
}

export interface AvailabilityRow {
  teacher_id: number;
  teacher_name: string;
  department_name?: string;
  qualified_courses?: string[] | string;
  scheduled_classes: number;
  on_leave: boolean;
  available_slots?: string[] | string;
}

export interface AuditLog {
  audit_id: number;
  substitution_id: number;
  action: string;
  action_description: string;
  performed_at: string;
}

export interface ArchiveRecord {
  archive_id: number;
  substitution_id: number;
  timetable_id: number;
  absent_teacher_name?: string;
  substitute_teacher_name?: string;
  substitution_date: string;
  status: string;
  archived_at: string;
}

export interface DashboardData {
  stats: {
    total_teachers: number;
    total_departments: number;
    total_courses: number;
    total_classrooms: number;
    todays_classes: number;
    teachers_on_leave: number;
    substitutions_assigned: number;
    pending_leaves: number;
  };
  today_timetable: TimetableEntry[];
  teachers_on_leave: Leave[];
  recent_substitutions: Substitution[];
  pending_leaves: Leave[];
  weekly_distribution: { day: string; count: number }[];
  department_distribution: { department_name: string; teacher_count: number }[];
}

export type ReportKey =
  | 'workload'
  | 'department-timetable'
  | 'leaves'
  | 'substitutions'
  | 'frequent-substitutes'
  | 'course-allocation';

export type Row = Record<string, unknown>;

// Automatic Timetable Generation Types
export interface AcademicYear {
  academic_year_id: number;
  department_id: number;
  department_name?: string;
  year_name: string;
  year_number: number;
  is_active: boolean;
}

export interface Section {
  section_id: number;
  academic_year_id: number;
  section_name: string;
  section_code: string;
  student_count: number;
  is_active: boolean;
  year_name?: string;
  year_number?: number;
  department_name?: string;
}

export interface SubjectRequirement {
  requirement_id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  academic_year_id: number;
  year_name?: string;
  year_number?: number;
  semester: number;
  weekly_lectures: number;
  weekly_practicals: number;
  lecture_duration_minutes: number;
  practical_duration_minutes: number;
  practical_consecutive_slots: number;
  required_room_type: string;
  min_room_capacity: number;
  is_active: boolean;
}

export interface TimetableConfig {
  config_id: number;
  department_id: number;
  academic_session: string;
  college_start_time: string;
  college_end_time: string;
  working_days: string[];
  period_duration_minutes: number;
  short_break_after_period: number;
  short_break_duration_minutes: number;
  lunch_break_start: string;
  lunch_break_end: string;
  max_daily_periods: number;
  max_teacher_daily_hours: number;
  max_teacher_weekly_hours: number;
  max_student_daily_hours: number;
  allow_saturday: boolean;
}

export interface GenerationSession {
  course_id: number;
  course_name: string;
  course_code: string;
  academic_year_id: number;
  year_name: string;
  year_number: number;
  semester: number;
  section_id: number;
  section_name: string;
  section_code: string;
  student_count: number;
  session_type: 'lecture' | 'practical';
  session_number: number;
  is_practical: boolean;
  duration_minutes: number;
  required_room_type: string;
  min_room_capacity: number;
  priority: number;
  // Assigned fields (after generation)
  teacher_id?: number;
  teacher_name?: string;
  classroom_id?: number;
  room_number?: string;
  building?: string;
  slot_id?: number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  assignment_date?: string;
  warnings?: GenerationWarning[];
  teacher_score?: number;
  classroom_score?: number;
}

export interface GenerationWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GenerationConflict {
  session: GenerationSession;
  reason: string;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  sessions: GenerationSession[];
  unassigned: GenerationConflict[];
  warnings: GenerationWarning[];
  conflicts: GenerationConflict[];
  stats: {
    total: number;
    scheduled: number;
    unassigned: number;
    backtracks: number;
  };
}

export type GenerationScope = 'department' | 'year' | 'section';

export interface GenerationPreviewRequest {
  department_id: number;
  academic_session: string;
  academic_year_id?: number;
  semester?: number;
  section_id?: number;
  generation_scope?: 'department' | 'year' | 'section';
}

export interface GenerationSaveRequest {
  sessions: GenerationSession[];
  department_id: number;
  academic_session: string;
  academic_year_id?: number;
  semester?: number;
  created_by: number;
}

export interface GenerationJob {
  job_id: number;
  department_id: number;
  academic_session: string;
  academic_year_id?: number;
  semester?: number;
  section_id?: number;
  generation_scope: string;
  status: string;
  total_sessions_required: number;
  sessions_scheduled: number;
  sessions_failed: number;
  conflicts_detected: any;
  warnings: any;
  generation_duration_ms: number;
  algorithm_used: string;
  started_at?: string;
  completed_at?: string;
  created_by?: number;
  created_at: string;
}

export interface GenerationResults {
  result_id: number;
  job_id: number;
  course_id: number;
  teacher_id: number;
  classroom_id: number;
  slot_id: number;
  section_id: number;
  academic_year_id: number;
  semester: number;
  session_type: string;
  session_number: number;
  is_practical: boolean;
  course_name: string;
  course_code: string;
  teacher_name: string;
  room_number: string;
  building: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  section_name: string;
  year_name: string;
}
