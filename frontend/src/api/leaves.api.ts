import { api, asArray, createCrud } from './client';
import type { Leave, TimetableEntry } from '../types';

const crud = createCrud<Leave>('/leaves', 'leaves');

export const leavesApi = {
  ...crud,
  approve: async (id: number) => {
    await api.patch(`/leaves/${id}/approve`);
  },
  reject: async (id: number) => {
    await api.patch(`/leaves/${id}/reject`);
  },
  /** Timetable entries that fall inside the leave period. */
  affectedEntries: async (id: number, signal?: AbortSignal) =>
    asArray<TimetableEntry>(await api.get(`/leaves/${id}/affected-entries`, undefined, signal), 'affected entries'),
};
