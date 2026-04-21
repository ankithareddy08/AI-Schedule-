export const USERS_DATA = [
  { id: 1, name: 'Alice Johnson', initials: 'AJ' },
  { id: 2, name: 'Bob Smith', initials: 'BS' },
  { id: 3, name: 'Carol White', initials: 'CW' },
  { id: 4, name: 'David Brown', initials: 'DB' },
  { id: 5, name: 'Eve Davis', initials: 'ED' },
  { id: 6, name: 'Frank Miller', initials: 'FM' },
  { id: 7, name: 'Grace Wilson', initials: 'GW' },
  { id: 8, name: 'Henry Moore', initials: 'HM' },
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
  // User 1 Events
  { event_id: 1, user_id: 1, date: '2025-01-06', start_time: '10:30', end_time: '11:30', meeting_type: 'team_sync', duration: 60 },
  { event_id: 2, user_id: 1, date: '2025-01-06', start_time: '10:00', end_time: '11:00', meeting_type: 'focus_block', duration: 60 },
  { event_id: 3, user_id: 1, date: '2025-01-06', start_time: '15:30', end_time: '16:00', meeting_type: 'focus_block', duration: 30 },
  
  // User 2 Events
  { event_id: 111, user_id: 2, date: '2025-01-06', start_time: '13:00', end_time: '14:00', meeting_type: 'interview', duration: 60 },
  { event_id: 112, user_id: 2, date: '2025-01-06', start_time: '11:00', end_time: '11:30', meeting_type: 'interview', duration: 30 },
  { event_id: 113, user_id: 2, date: '2025-01-06', start_time: '14:30', end_time: '15:30', meeting_type: '1:1', duration: 60 },
  
  // User 3 Events
  { event_id: 214, user_id: 3, date: '2025-01-06', start_time: '15:30', end_time: '16:00', meeting_type: 'client_call', duration: 30 },
  { event_id: 215, user_id: 3, date: '2025-01-06', start_time: '11:00', end_time: '12:00', meeting_type: 'client_call', duration: 60 },
  { event_id: 216, user_id: 3, date: '2025-01-06', start_time: '16:00', end_time: '17:00', meeting_type: 'client_call', duration: 60 },
  
  // User 4 Events
  { event_id: 328, user_id: 4, date: '2025-01-06', start_time: '17:00', end_time: '17:30', meeting_type: 'team_sync', duration: 30 },
  { event_id: 329, user_id: 4, date: '2025-01-06', start_time: '14:30', end_time: '15:00', meeting_type: 'interview', duration: 30 },
  { event_id: 330, user_id: 4, date: '2025-01-06', start_time: '16:30', end_time: '17:00', meeting_type: 'client_call', duration: 30 },
  
  // User 5 Events
  { event_id: 442, user_id: 5, date: '2025-01-06', start_time: '14:00', end_time: '15:00', meeting_type: 'interview', duration: 60 },
  { event_id: 443, user_id: 5, date: '2025-01-06', start_time: '09:00', end_time: '09:30', meeting_type: 'brainstorm', duration: 30 },
  { event_id: 444, user_id: 5, date: '2025-01-06', start_time: '11:30', end_time: '12:00', meeting_type: 'focus_block', duration: 30 },
  
  // User 6 Events
  { event_id: 551, user_id: 6, date: '2025-01-06', start_time: '09:30', end_time: '10:30', meeting_type: 'team_sync', duration: 60 },
  { event_id: 552, user_id: 6, date: '2025-01-06', start_time: '14:00', end_time: '14:30', meeting_type: '1:1', duration: 30 },
  { event_id: 553, user_id: 6, date: '2025-01-06', start_time: '10:00', end_time: '11:00', meeting_type: 'brainstorm', duration: 60 },
  
  // User 7 Events
  { event_id: 662, user_id: 7, date: '2025-01-06', start_time: '13:30', end_time: '14:30', meeting_type: 'team_sync', duration: 60 },
  { event_id: 663, user_id: 7, date: '2025-01-06', start_time: '17:30', end_time: '18:00', meeting_type: 'team_sync', duration: 30 },
  { event_id: 664, user_id: 7, date: '2025-01-06', start_time: '11:30', end_time: '12:00', meeting_type: 'team_sync', duration: 30 },
  
  // User 8 Events
  { event_id: 778, user_id: 8, date: '2025-01-06', start_time: '11:00', end_time: '11:30', meeting_type: 'client_call', duration: 30 },
  { event_id: 779, user_id: 8, date: '2025-01-06', start_time: '09:00', end_time: '09:30', meeting_type: '1:1', duration: 30 },
  { event_id: 780, user_id: 8, date: '2025-01-06', start_time: '11:30', end_time: '12:30', meeting_type: 'team_sync', duration: 60 },
];


export const TIME_SLOTS = [
  // User 1 ML Slots
  { id: 168, user_id: 1, time: '11:30 AM (Jan 15)', score: 94, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 185, user_id: 1, time: '11:00 AM (Jan 16)', score: 88, description: 'Excellent alternative slot.', isTop: false },

  // User 2 ML Slots
  { id: 401, user_id: 2, time: '11:00 AM (Jan 14)', score: 100, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 473, user_id: 2, time: '10:00 AM (Jan 18)', score: 92, description: 'Excellent alternative slot.', isTop: false },

  // User 3 ML Slots
  { id: 582, user_id: 3, time: '11:30 AM (Jan 15)', score: 100, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 672, user_id: 3, time: '2:00 PM (Jan 17)', score: 87, description: 'Excellent alternative slot.', isTop: false },

  // User 4 ML Slots
  { id: 870, user_id: 4, time: '11:30 AM (Jan 16)', score: 95, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 995, user_id: 4, time: '3:00 PM (Jan 18)', score: 89, description: 'Excellent alternative slot.', isTop: false },

  // User 5 ML Slots
  { id: 1042, user_id: 5, time: '4:30 PM (Jan 14)', score: 94, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 1204, user_id: 5, time: '2:00 PM (Jan 16)', score: 85, description: 'Excellent alternative slot.', isTop: false },

  // User 6 ML Slots
  { id: 1445, user_id: 6, time: '11:00 AM (Jan 17)', score: 100, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 1427, user_id: 6, time: '1:00 PM (Jan 19)', score: 91, description: 'Excellent alternative slot.', isTop: false },

  // User 7 ML Slots
  { id: 1680, user_id: 7, time: '11:30 AM (Jan 18)', score: 100, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 1608, user_id: 7, time: '9:30 AM (Jan 20)', score: 86, description: 'Excellent alternative slot.', isTop: false },

  // User 8 ML Slots
  { id: 1841, user_id: 8, time: '11:00 AM (Jan 19)', score: 100, description: 'Top ML recommended slot based on your focus curve.', isTop: true },
  { id: 1787, user_id: 8, time: '3:30 PM (Jan 21)', score: 90, description: 'Excellent alternative slot.', isTop: false },
];