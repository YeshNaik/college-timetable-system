import { createCrud } from './client';
import type { Department } from '../types';

export const departmentsApi = createCrud<Department>('/departments', 'departments');
