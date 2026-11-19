import { api, asArray, createCrud } from './client';
import type { Course, Teacher } from '../types';

const crud = createCrud<Course>('/courses', 'courses');

export const coursesApi = {
  ...crud,
  /** Teachers qualified for a course (Teacher_Courses). */
  teachers: async (courseId: number, signal?: AbortSignal) =>
    asArray<Teacher>(await api.get(`/courses/${courseId}/teachers`, undefined, signal), 'qualified teachers'),
};
