import { api, asArray, createCrud, type Params } from './client';
import type { AvailabilityRow, Course, Leave, Substitution, Teacher, TimetableEntry } from '../types';

const crud = createCrud<Teacher>('/teachers', 'teachers');

export const teachersApi = {
  ...crud,
  courses: async (id: number, signal?: AbortSignal) =>
    asArray<Course>(await api.get(`/teachers/${id}/courses`, undefined, signal), 'teacher courses'),
  /** Replaces the teacher's qualified courses (Teacher_Courses rows). */
  assignCourses: async (id: number, courseIds: number[]) => {
    await api.put(`/teachers/${id}/courses`, { course_ids: courseIds });
  },
  timetable: async (id: number, signal?: AbortSignal) =>
    asArray<TimetableEntry>(await api.get(`/teachers/${id}/timetable`, undefined, signal), 'teacher timetable'),
  leaves: async (id: number, signal?: AbortSignal) =>
    asArray<Leave>(await api.get(`/teachers/${id}/leaves`, undefined, signal), 'teacher leaves'),
  substitutions: async (id: number, signal?: AbortSignal) =>
    asArray<Substitution>(await api.get(`/teachers/${id}/substitutions`, undefined, signal), 'teacher substitutions'),
  availability: async (params: Params, signal?: AbortSignal) =>
    asArray<AvailabilityRow>(await api.get('/teachers/availability', params, signal), 'availability'),
};
