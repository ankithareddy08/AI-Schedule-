export const USERS_DATA = [
  { id: 1, name: 'Alice Johnson', initials: 'AJ' },
  { id: 2, name: 'Bob Smith', initials: 'BS' },
  { id: 3, name: 'Carol White', initials: 'CW' },
  { id: 4, name: 'David Brown', initials: 'DB' },
];

export const USER_PROFILES = {
  1: {
    preferred_time: 'neutral',
    avg_meetings_per_day: 5.0,
    preferred_duration: 30,
    do_not_disturb_start: null,
    do_not_disturb_end: '13:30',
  },
  2: {
    preferred_time: 'morning',
    avg_meetings_per_day: 4.3,
    preferred_duration: 30,
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  3: {
    preferred_time: 'morning',
    avg_meetings_per_day: 3.7,
    preferred_duration: 60,
    do_not_disturb_start: '12:30',
    do_not_disturb_end: '13:30',
  },
  4: {
    preferred_time: 'neutral',
    avg_meetings_per_day: 3.8,
    preferred_duration: 60,
    do_not_disturb_start: '12:30',
    do_not_disturb_end: '13:30',
  },
};

export const CALENDAR_EVENTS = [
  { event_id: 1, user_id: 1, date: '2025-01-06', start_time: '10:30', end_time: '11:30', meeting_type: 'team_sync', duration: 60 },
  { event_id: 2, user_id: 1, date: '2025-01-06', start_time: '10:00', end_time: '11:00', meeting_type: 'focus_block', duration: 60 },
  { event_id: 3, user_id: 1, date: '2025-01-06', start_time: '15:30', end_time: '16:00', meeting_type: 'focus_block', duration: 30 },
  { event_id: 4, user_id: 1, date: '2025-01-06', start_time: '09:00', end_time: '10:00', meeting_type: 'client_call', duration: 60 },
  { event_id: 5, user_id: 1, date: '2025-01-06', start_time: '16:00', end_time: '16:30', meeting_type: 'team_sync', duration: 30 },
  { event_id: 6, user_id: 1, date: '2025-01-06', start_time: '09:30', end_time: '10:30', meeting_type: 'client_call', duration: 60 },
  { event_id: 7, user_id: 1, date: '2025-01-06', start_time: '17:30', end_time: '18:00', meeting_type: 'team_sync', duration: 30 },
  { event_id: 8, user_id: 1, date: '2025-01-06', start_time: '14:30', end_time: '15:00', meeting_type: 'client_call', duration: 30 },
  { event_id: 9, user_id: 1, date: '2025-01-06', start_time: '13:00', end_time: '13:30', meeting_type: '1:1', duration: 30 },
  { event_id: 10, user_id: 1, date: '2025-01-06', start_time: '16:30', end_time: '17:30', meeting_type: '1:1', duration: 60 },
  { event_id: 11, user_id: 1, date: '2025-01-07', start_time: '14:30', end_time: '15:30', meeting_type: '1:1', duration: 60 },
  { event_id: 12, user_id: 1, date: '2025-01-07', start_time: '13:00', end_time: '14:00', meeting_type: 'client_call', duration: 60 },
  { event_id: 13, user_id: 1, date: '2025-01-07', start_time: '09:30', end_time: '10:30', meeting_type: 'client_call', duration: 60 },
  { event_id: 14, user_id: 1, date: '2025-01-07', start_time: '17:30', end_time: '18:30', meeting_type: 'team_sync', duration: 60 },
  { event_id: 15, user_id: 1, date: '2025-01-07', start_time: '12:30', end_time: '13:00', meeting_type: '1:1', duration: 30 },
  { event_id: 16, user_id: 1, date: '2025-01-07', start_time: '17:00', end_time: '17:30', meeting_type: 'client_call', duration: 30 },
  { event_id: 17, user_id: 1, date: '2025-01-07', start_time: '16:30', end_time: '17:00', meeting_type: 'team_sync', duration: 30 },
  { event_id: 18, user_id: 1, date: '2025-01-08', start_time: '15:00', end_time: '15:30', meeting_type: 'team_sync', duration: 30 },
  { event_id: 19, user_id: 1, date: '2025-01-08', start_time: '13:00', end_time: '13:30', meeting_type: 'client_call', duration: 30 },
  { event_id: 20, user_id: 1, date: '2025-01-08', start_time: '16:00', end_time: '16:30', meeting_type: 'brainstorm', duration: 30 },
];

export const TIME_SLOTS = [
  { 
    id: 5, // mapped from slot_id
    time: '10:00 AM - 10:30 AM', // formatted from start_time
    score: 95, // formatted from 0.95
    description: 'Perfect match! Avoids your afternoon do-not-disturb block.', 
    isTop: true 
  },
  { 
    id: 4, 
    time: '2:00 PM - 2:30 PM', 
    score: 88, 
    description: 'Good afternoon alternative.',
    isTop: false 
  },
  { 
    id: 6, 
    time: '11:00 AM - 11:30 AM', 
    score: 85, 
    description: 'Solid morning slot, though closer to your focus time.',
    isTop: false 
  },
];