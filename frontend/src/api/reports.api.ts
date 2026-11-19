import { api, asArray, type Params } from './client';
import type { ReportKey, Row } from '../types';

export const reportsApi = {
  run: async (key: ReportKey, params: Params, signal?: AbortSignal) =>
    asArray<Row>(await api.get(`/reports/${key}`, params, signal), 'report'),
};
