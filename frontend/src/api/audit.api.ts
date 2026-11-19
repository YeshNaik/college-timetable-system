import { createCrud } from './client';
import type { AuditLog } from '../types';

const crud = createCrud<AuditLog>('/audit', 'audit logs');

/** Read-only. */
export const auditApi = { list: crud.list, get: crud.get };
