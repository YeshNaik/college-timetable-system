import { createCrud } from './client';
import type { ArchiveRecord } from '../types';

const crud = createCrud<ArchiveRecord>('/archive', 'archive');

/** Read-only. */
export const archiveApi = { list: crud.list, get: crud.get };
