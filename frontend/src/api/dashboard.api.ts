import { api, asObject } from './client';
import type { DashboardData } from '../types';

export const dashboardApi = {
  summary: async (signal?: AbortSignal) =>
    asObject<DashboardData>(await api.get('/dashboard/summary', undefined, signal), 'dashboard'),
};
