import { api, asArray, asObject, type Params } from './client';
import type {
  AcademicYear,
  Section,
  SubjectRequirement,
  TimetableConfig,
  GenerationSession,
  GenerationResult,
  GenerationPreviewRequest,
  GenerationSaveRequest,
  GenerationJob,
  GenerationResults
} from '../types';

// Academic Years API
export const academicYearsApi = {
  list: async (params: Params = {}, signal?: AbortSignal) =>
    asArray<AcademicYear>(await api.get('/academic-years', params, signal), 'academic years'),

  get: async (id: number, signal?: AbortSignal) =>
    asObject<AcademicYear>(await api.get(`/academic-years/${id}`, undefined, signal), 'academic year'),

  create: async (data: Partial<AcademicYear>) =>
    asObject<AcademicYear>(await api.post('/academic-years', data), 'academic year'),

  update: async (id: number, data: Partial<AcademicYear>) =>
    asObject<AcademicYear>(await api.put(`/academic-years/${id}`, data), 'academic year'),

  delete: async (id: number) => {
    await api.delete(`/academic-years/${id}`);
  }
};

// Sections API
export const sectionsApi = {
  list: async (params: Params = {}, signal?: AbortSignal) =>
    asArray<Section>(await api.get('/sections', params, signal), 'sections'),

  get: async (id: number, signal?: AbortSignal) =>
    asObject<Section>(await api.get(`/sections/${id}`, undefined, signal), 'section'),

  create: async (data: Partial<Section>) =>
    asObject<Section>(await api.post('/sections', data), 'section'),

  update: async (id: number, data: Partial<Section>) =>
    asObject<Section>(await api.put(`/sections/${id}`, data), 'section'),

  delete: async (id: number) => {
    await api.delete(`/sections/${id}`);
  }
};

// Subject Requirements API
export const subjectRequirementsApi = {
  list: async (params: Params = {}, signal?: AbortSignal) =>
    asArray<SubjectRequirement>(await api.get('/subject-requirements', params, signal), 'subject requirements'),

  get: async (id: number, signal?: AbortSignal) =>
    asObject<SubjectRequirement>(await api.get(`/subject-requirements/${id}`, undefined, signal), 'subject requirement'),

  create: async (data: Partial<SubjectRequirement>) =>
    asObject<SubjectRequirement>(await api.post('/subject-requirements', data), 'subject requirement'),

  update: async (id: number, data: Partial<SubjectRequirement>) =>
    asObject<SubjectRequirement>(await api.put(`/subject-requirements/${id}`, data), 'subject requirement'),

  delete: async (id: number) => {
    await api.delete(`/subject-requirements/${id}`);
  }
};

// Timetable Configuration API
export const timetableConfigApi = {
  get: async (departmentId: number, academicSession: string, signal?: AbortSignal) =>
    asObject<TimetableConfig>(await api.get('/generation/config', { department_id: departmentId, academic_session: academicSession }, signal), 'timetable config'),

  save: async (data: Partial<TimetableConfig>) =>
    asObject<TimetableConfig>(await api.post('/generation/config', data), 'timetable config')
};

// Generation API
export const generationApi = {
  preview: async (request: GenerationPreviewRequest, signal?: AbortSignal) =>
    asObject<GenerationResult>(await api.post('/generation/preview', request), 'generation preview'),

  generate: async (request: GenerationPreviewRequest, signal?: AbortSignal) =>
    asObject<GenerationResult>(await api.post('/generation/generate', request), 'generation'),

  save: async (request: GenerationSaveRequest, signal?: AbortSignal) =>
    asObject<{ success: boolean; jobId: number | null; message: string }>(await api.post('/generation/save', request), 'generation save'),

  history: async (params: Params, signal?: AbortSignal) =>
    asArray<GenerationJob>(await api.get('/generation/history', params, signal), 'generation history'),

  results: async (jobId: number, signal?: AbortSignal) =>
    asArray<GenerationResults>(await api.get(`/generation/results/${jobId}`, undefined, signal), 'generation results'),

  teacherAvailability: async (params: Params, signal?: AbortSignal) =>
    asArray<any>(await api.get('/teacher-availability', params, signal), 'teacher availability'),

  teacherAvailabilityBulk: async (data: { teacher_id: number; availabilities: any[] }) =>
    asObject<any>(await api.post('/teacher-availability/bulk', data), 'teacher availability bulk')
};

export type GenerationScope = 'department' | 'year' | 'section';