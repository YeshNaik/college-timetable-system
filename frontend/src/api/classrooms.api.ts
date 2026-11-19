import { createCrud } from './client';
import type { Classroom } from '../types';

export const classroomsApi = createCrud<Classroom>('/classrooms', 'classrooms');
