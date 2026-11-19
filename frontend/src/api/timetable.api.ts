import { createCrud } from './client';
import type { TimetableEntry } from '../types';

/** Query params supported: department_id, teacher_id, classroom_id, section, semester, academic_year, day_of_week */
export const timetableApi = createCrud<TimetableEntry>('/timetable', 'timetable');
