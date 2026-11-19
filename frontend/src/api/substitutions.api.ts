import { api, asArray, createCrud } from './client';
import type { Substitution, SubstituteCandidate, TimetableEntry } from '../types';

const crud = createCrud<Substitution>('/substitutions', 'substitutions');

export interface AssignPayload {
  timetable_id: number;
  absent_teacher_id: number;
  substitute_teacher_id: number;
  substitution_date: string;
}

export const substitutionsApi = {
  list: crud.list,
  /** Timetable entries of the absent teacher that fall on the given date. */
  affected: async (teacherId: number, date: string, signal?: AbortSignal) =>
    asArray<TimetableEntry>(
      await api.get('/substitutions/affected', { teacher_id: teacherId, date }, signal),
      'affected entries',
    ),
  /** Eligibility is computed by the backend. */
  candidates: async (timetableId: number, date: string, signal?: AbortSignal) =>
    asArray<SubstituteCandidate>(
      await api.get('/substitutions/candidates', { timetable_id: timetableId, date }, signal),
      'candidates',
    ),
  assign: async (payload: AssignPayload) => {
    await api.post('/substitutions', payload);
  },
  confirm: async (id: number) => {
    await api.patch(`/substitutions/${id}/confirm`);
  },
  cancel: async (id: number) => {
    await api.patch(`/substitutions/${id}/cancel`);
  },
};
