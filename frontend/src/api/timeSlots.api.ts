import { createCrud } from './client';
import type { TimeSlot } from '../types';

export const timeSlotsApi = createCrud<TimeSlot>('/time-slots', 'time slots');
