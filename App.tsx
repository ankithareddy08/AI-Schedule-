import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, ScrollView, View, Text, StatusBar, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, FlatList, Modal,
  KeyboardAvoidingView, Platform, Keyboard, Image, ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'https://frontend-orpin-theta.vercel.app';

// ─── THEME ────────────────────────────────────────────────────────────────────
const CYAN     = '#22d3ee';
const DARK_BG  = '#050505';
const CARD_BG  = '#0f0f13';
const SHEET_BG = '#0a0a0c';
const BORDER   = 'rgba(255,255,255,0.05)';
const BEAM     = 'rgba(255,255,255,0.2)';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface UserProfile {
  userId: number;
  name: string;
  email: string;
  preferredTime: string;
  avgMeetingsPerDay: number;
  preferredDuration: number;
  doNotDisturbStart: string | null;
  doNotDisturbEnd: string | null;
}
interface CalendarEvent {
  eventId: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  isConflict: boolean;
  durationMinutes: number;
}
interface RecommendationOption {
  slotKey: string;
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  scoreLabel: string;
  participantAvailability: number;
  focusAverage: number;
  explanation: string[];
  supportingSignals: string[];
}
interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  positiveRate: number;
}
interface ScheduleResponse {
  user: UserProfile;
  intent: {
    action: string;
    durationMinutes: number;
    urgency: string;
    timePreference: string;
    llmUsed: boolean;
    requiresConflictResolution: boolean;
    participants: string[];
    hardConstraints: string[];
  };
  events: CalendarEvent[];
  recommendations: RecommendationOption[];
  conflictOptions: unknown[];
  modelMetrics: ModelMetrics;
  notes: string[];
}
interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
}
type Tab = 'chat' | 'calendar';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtTime = (t: string) => {
  if (!t) return '';
  const h = parseInt(t.split(':')[0] ?? '0', 10);
  const m = t.split(':')[1] ?? '00';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m}`;
};
const fmtAMPM = (t: string) => {
  if (!t) return '';
  return parseInt(t.split(':')[0] ?? '0', 10) >= 12 ? 'PM' : 'AM';
};
const fmtDate = (d: string) => {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return d; }
};

const SCHEDULING_RE = /\b(schedule|meeting|book|set up|arrange|plan|sync|standup|stand.?up|1:1|one.on.one|call|review|interview|hour|minute|min|today|tomorrow|monday|tuesday|wednesday|thursday|friday|this week|next week|morning|afternoon|evening)\b/i;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(): React.JSX.Element {
  const msgIdRef = useRef(2);
  const nextId = () => ++msgIdRef.current;

  // ── Auth (mirrors web activeUser) ──────────────────────────────────────────
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  // ── Chat ───────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'ai', text: 'Hi! Tell me what meeting you need to schedule. I\'ll parse the request and rank the best time slots.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<ScheduleResponse | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ── Recommendations ────────────────────────────────────────────────────────
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationOption[]>([]);
  const [confirmedSlotKey, setConfirmedSlotKey] = useState<string | null>(null);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // ── Load users on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data.users) ? data.users : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  // ── Load events when user logs in ──────────────────────────────────────────
  useEffect(() => {
    if (!activeUser) return;
    fetch(`${API_BASE}/api/events?userId=${activeUser.userId}`)
      .then(r => r.json())
      .then(data => setCalendarEvents(Array.isArray(data.events) ? data.events : []))
      .catch(() => {});
  }, [activeUser]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectUser = (user: UserProfile) => {
    setActiveUser(user);
    setActiveTab('chat');
    msgIdRef.current = 2;
    setMessages([{ id: 1, type: 'ai', text: `Welcome ${user.name}! Tell me what meeting you need to schedule.` }]);
    setInput('');
    setLastResult(null);
    setRecommendations([]);
    setConfirmedSlotKey(null);
  };

  const handleSignOut = () => setShowSignOut(true);

  const confirmSignOut = () => {
    setShowSignOut(false);
    setActiveUser(null);
    setActiveTab('chat');
    setMessages([{ id: 1, type: 'ai', text: 'Hi! Tell me what meeting you need to schedule. I\'ll parse the request and rank the best time slots.' }]);
    setLastResult(null);
    setRecommendations([]);
    setCalendarEvents([]);
    setConfirmedSlotKey(null);
    setShowRecommendations(false);
  };

  const handleSend = async () => {
    if (!activeUser || !input.trim() || isSending) return;
    const prompt = input.trim();
    setInput('');
    Keyboard.dismiss();

    const userMsgId = nextId();
    setMessages(prev => [...prev, { id: userMsgId, type: 'user', text: prompt }]);

    if (!SCHEDULING_RE.test(prompt)) {
      setMessages(prev => [...prev, {
        id: nextId(), type: 'ai',
        text: "I'm a scheduling assistant! Try something like: \"Schedule a 30-min team sync tomorrow\" or \"Book a 1-hour review this Friday afternoon\".",
      }]);
      return;
    }

    setIsSending(true);
    setConfirmedSlotKey(null);
    const loadingId = nextId();
    setMessages(prev => [...prev, { id: loadingId, type: 'ai', text: '⏳ Parsing with Gemini...' }]);

    try {
      const res = await fetch(`${API_BASE}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.userId, prompt }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ScheduleResponse = await res.json();

      if (data.events?.length) setCalendarEvents(data.events);
      setRecommendations(data.recommendations ?? []);
      setLastResult(data);

      const method = data.intent.llmUsed ? '🤖 Gemini' : '📋 Auto';
      const count = data.recommendations?.length ?? 0;
      const aiText = data.intent.requiresConflictResolution && (data.conflictOptions?.length ?? 0) > 0
        ? `Conflict detected. Ranked ${data.conflictOptions.length} overlapping meeting${data.conflictOptions.length !== 1 ? 's' : ''} by move priority.`
        : `${method} parsed: ${data.intent.durationMinutes}min ${data.intent.action.replace('_', ' ')} · ML model ranked ${count} slot${count !== 1 ? 's' : ''}.${count > 0 ? '\n\nTap "View ranked slots" below ↓' : ''}`;

      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: aiText } : m));
      if (count > 0) setTimeout(() => setShowRecommendations(true), 500);
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === loadingId ? { ...m, text: '⚠️ Could not reach server. Make sure Next.js is running.' } : m,
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = (rec: RecommendationOption) => {
    setConfirmedSlotKey(rec.slotKey);
    setShowRecommendations(false);
    const timeStr = `${fmtTime(rec.startTime)}–${fmtTime(rec.endTime)} ${fmtAMPM(rec.endTime)}`;
    setMessages(prev => [...prev, {
      id: nextId(), type: 'ai',
      text: `✅ Confirmed! Meeting locked for ${fmtDate(rec.date)} at ${timeStr}. No calendar was mutated — confirmation is the final human-in-the-loop step.`,
    }]);
  };

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (!activeUser) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
        <ScrollView contentContainerStyle={s.loginContent} keyboardShouldPersistTaps="handled">
          <View style={s.logoBox}>
            <Image source={require('./assets/app-logo.jpg')} style={{ width: 88, height: 88 }} resizeMode="cover" />
          </View>
          <Text style={s.appTitle}>Aura Sync</Text>
          <Text style={s.appSubtitle}>AI-powered scheduling</Text>

          <View style={[s.card, { alignSelf: 'stretch' }]}>
            <Text style={s.cardTitle}>Choose Profile</Text>
            {usersLoading && <ActivityIndicator color={CYAN} style={{ marginVertical: 20 }} />}
            {!usersLoading && users.length === 0 && (
              <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 10, fontSize: 14 }}>
                Could not load profiles. Is the Next.js server running?
              </Text>
            )}
            {users.map((u, idx) => (
              <TouchableOpacity
                key={u.userId || idx}
                style={s.glassBtn}
                onPress={() => handleSelectUser(u)}
                activeOpacity={0.7}
              >
                <Text style={s.glassBtnText}>Login as {u.name || 'User'}</Text>
                <Image source={require('./assets/arrow-right.png')} style={{ width: 18, height: 18, tintColor: CYAN }} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MAIN APP (mirrors web shell) ───────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f13" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.headerLogoBox}>
            <Image source={require('./assets/app-logo.jpg')} style={{ width: 32, height: 32 }} resizeMode="cover" />
          </View>
          <Text style={s.headerTitle}>Aura Sync</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.chip}><Text style={[s.chipText, { color: CYAN }]}>{activeUser.name}</Text></View>
          <View style={s.chip}><Text style={s.chipText}>{activeUser.preferredTime} pref</Text></View>
          <TouchableOpacity style={s.userBadge} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={s.userInitial}>{activeUser.name.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'chat' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={[
                { marginVertical: 6, flexDirection: 'row', alignItems: 'flex-end' },
                item.type === 'user' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
              ]}>
                {item.type === 'ai' && <Text style={{ fontSize: 20, marginRight: 8, marginBottom: 4 }}>⚡</Text>}
                <View style={[s.bubble, item.type === 'user' ? s.bubbleUser : s.bubbleAI]}>
                  <Text style={[s.bubbleText, { color: item.type === 'user' ? '#fff' : '#bbb' }]}>{item.text}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={lastResult ? (
              <View style={s.intentCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[s.cardLabel, { color: CYAN, marginBottom: 4 }]}>Intent extraction</Text>
                    <Text style={{ color: '#fff', fontSize: 13 }}>
                      {lastResult.intent.llmUsed ? '🤖 Gemini parsed' : '📋 Auto parsed'} · {lastResult.intent.action.replace('_', ' ')}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.viewSlotsBtn} onPress={() => setShowRecommendations(true)}>
                    <Text style={s.viewSlotsBtnText}>View ranked slots ↓</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    `${lastResult.intent.durationMinutes} min`,
                    `Urgency: ${lastResult.intent.urgency}`,
                    `${lastResult.intent.participants?.length ?? 0} participant${(lastResult.intent.participants?.length ?? 0) !== 1 ? 's' : ''}`,
                    `${lastResult.intent.hardConstraints?.length ?? 0} constraint${(lastResult.intent.hardConstraints?.length ?? 0) !== 1 ? 's' : ''}`,
                  ].map(item => (
                    <View key={item} style={[s.card, { padding: 8 }]}>
                      <Text style={{ color: '#ccc', fontSize: 12 }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          />

          {/* Input row */}
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder='e.g. "Schedule a 1-hour team sync this week"'
              placeholderTextColor="#555"
              value={input}
              onChangeText={setInput}
              editable={!isSending}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || isSending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!input.trim() || isSending}
            >
              {isSending
                ? <ActivityIndicator size="small" color={CYAN} />
                : <Image source={require('./assets/arrow-up.png')} style={{ width: 20, height: 20, tintColor: CYAN }} />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Calendar tab */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Events card */}
          <View style={[s.card, { marginBottom: 16 }]}>
            <View style={s.cardHeader}>
              <Text style={s.cardLabel}>Calendar</Text>
              <Text style={s.cardHeading}>Your events</Text>
            </View>
            <View style={{ padding: 16 }}>
              {calendarEvents.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 20, fontSize: 14 }}>
                  Submit a scheduling request to load calendar events.
                </Text>
              ) : (
                calendarEvents.map((ev, i) => {
                  const safeType = ev.meetingType?.replace(/_/g, ' ').toUpperCase() ?? 'MEETING';
                  return (
                    <View key={ev.eventId || i} style={[s.eventCard, ev.isConflict && { borderLeftColor: '#ef4444' }]}>
                      <View style={s.eventTimeCol}>
                        <Text style={s.eventTimeNum}>{fmtTime(ev.startTime)}</Text>
                        <Text style={[s.eventAMPM, ev.isConflict && { color: '#ef4444' }]}>{fmtAMPM(ev.startTime)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.eventName}>{safeType}</Text>
                        <Text style={s.eventMeta}>{ev.durationMinutes}m · {ev.date}</Text>
                        {ev.isConflict && <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>⚠ Conflict</Text>}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* ML Signals card */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardLabel}>ML Signals</Text>
              <Text style={s.cardHeading}>Top ranked slots</Text>
            </View>
            <View style={{ padding: 16 }}>
              {recommendations.length === 0 ? (
                <Text style={{ color: '#888', fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>
                  Send a request to see ranked slots here.
                </Text>
              ) : (
                recommendations.map(rec => (
                  <View key={rec.slotKey} style={s.mlSlotCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                          {fmtDate(rec.date)} · {fmtTime(rec.startTime)}–{fmtTime(rec.endTime)} {fmtAMPM(rec.endTime)}
                        </Text>
                        <Text style={{ color: CYAN, fontSize: 12, marginTop: 2 }}>{rec.scoreLabel}</Text>
                      </View>
                      <View style={s.mlScoreBox}>
                        <Text style={{ fontSize: 10, color: '#888' }}>ML score</Text>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{Math.round(rec.score * 100)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {rec.supportingSignals.map(sig => (
                        <View key={sig} style={s.tag}><Text style={s.tagText}>{sig}</Text></View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {(['chat', 'calendar'] as Tab[]).map(tab => (
          <TouchableOpacity key={tab} style={s.navItem} onPress={() => setActiveTab(tab)}>
            <Image
              source={tab === 'chat' ? require('./assets/message-square.png') : require('./assets/calendar.png')}
              style={[s.navIcon, { tintColor: activeTab === tab ? CYAN : '#555' }]}
            />
            <Text style={[s.navLabel, { color: activeTab === tab ? CYAN : '#555' }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Sign-out modal ────────────────────────────────────────────────── */}
      <Modal visible={showSignOut} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowSignOut(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={s.signOutCard}>
                {/* Avatar */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={s.signOutAvatar}>
                    <Text style={s.signOutInitial}>{activeUser?.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 4, marginTop: 12 }}>
                    {activeUser?.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    {activeUser?.preferredTime} preference · {activeUser?.email}
                  </Text>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 }} />

                <Text style={{ color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                  Are you sure you want to sign out?
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={s.signOutCancelBtn} onPress={() => setShowSignOut(false)} activeOpacity={0.7}>
                    <Text style={{ color: '#888', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.signOutConfirmBtn} onPress={confirmSignOut} activeOpacity={0.7}>
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Recommendation bottom sheet ────────────────────────────────────── */}
      <Modal visible={showRecommendations} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowRecommendations(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={s.bottomSheet}>
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <View style={{ width: 40, height: 4, backgroundColor: '#333', borderRadius: 2 }} />
                </View>

                {/* Sheet header */}
                <View style={s.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardLabel}>Slot comparison</Text>
                    <Text style={s.sheetTitle}>Top Recommendations</Text>
                    <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                      No action is taken until you confirm a slot.
                    </Text>
                  </View>
                  <TouchableOpacity style={s.closeBtn} onPress={() => setShowRecommendations(false)}>
                    <Text style={{ color: '#666', fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                  {recommendations.map((rec, index) => {
                    const isTop = index === 0;
                    const confirmed = confirmedSlotKey === rec.slotKey;
                    return (
                      <View key={rec.slotKey} style={[isTop ? s.slotTop : s.slot, { marginBottom: 12 }]}>
                        {/* Badges */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          {isTop && (
                            <View style={s.badgeCyan}>
                              <Text style={[s.badgeText, { color: CYAN }]}>⭐ Top choice</Text>
                            </View>
                          )}
                          {confirmed && (
                            <View style={s.badgeGreen}>
                              <Text style={[s.badgeText, { color: '#34d399' }]}>✓ Confirmed</Text>
                            </View>
                          )}
                        </View>

                        {/* Score + time row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{ color: CYAN, fontWeight: '700', fontSize: 13, marginBottom: 6 }}>
                              ⭐ {Math.round(rec.score * 100)}% · {rec.scoreLabel}
                            </Text>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{fmtDate(rec.date)}</Text>
                            <Text style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>
                              {fmtTime(rec.startTime)}–{fmtTime(rec.endTime)} {fmtAMPM(rec.endTime)}
                            </Text>
                          </View>
                          <View style={s.scoreBox}>
                            <Text style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>ML score</Text>
                            <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34 }}>
                              {Math.round(rec.score * 100)}
                            </Text>
                          </View>
                        </View>

                        {/* Explanation bullets */}
                        <View style={{ gap: 6, marginBottom: 12 }}>
                          {rec.explanation.map(exp => (
                            <View key={exp} style={s.explCard}>
                              <Text style={{ fontSize: 13, color: '#ccc', lineHeight: 18 }}>{exp}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Signal tags */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {rec.supportingSignals.map(sig => (
                            <View key={sig} style={s.tag}><Text style={s.tagText}>{sig}</Text></View>
                          ))}
                        </View>

                        {/* Footer */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#666' }}>
                            Avail {Math.round(rec.participantAvailability * 100)}% · Focus {Math.round(rec.focusAverage * 100)}%
                          </Text>
                          <TouchableOpacity style={s.cyanBtn} onPress={() => handleConfirm(rec)}>
                            <Text style={s.cyanBtnText}>Confirm suggestion</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  {/* Model metrics */}
                  {lastResult?.modelMetrics && (
                    <View style={[s.card, { padding: 16, marginTop: 4, marginBottom: 12 }]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Model performance</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {([
                          { label: 'Accuracy',      value: lastResult.modelMetrics.accuracy },
                          { label: 'Precision',     value: lastResult.modelMetrics.precision },
                          { label: 'Recall',        value: lastResult.modelMetrics.recall },
                          { label: 'Positive rate', value: lastResult.modelMetrics.positiveRate },
                        ] as { label: string; value: number }[]).map(({ label, value }) => (
                          <View key={label} style={[s.metricBox, { width: '47%' }]}>
                            <Text style={{ fontSize: 11, color: '#666' }}>{label}</Text>
                            <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 }}>
                              {Math.round(value * 100)}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* System notes */}
                  {lastResult?.notes && lastResult.notes.length > 0 && (
                    <View style={[s.card, { padding: 16 }]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 14 }}>System notes</Text>
                      <View style={{ gap: 8 }}>
                        {lastResult.notes.map(note => (
                          <View key={note} style={s.explCard}>
                            <Text style={{ fontSize: 13, color: '#bbb', lineHeight: 20 }}>{note}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },

  // Login
  loginContent:  { paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center', flexGrow: 1 },
  logoBox:       { width: 96, height: 96, borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 2, borderColor: CYAN, marginBottom: 20, overflow: 'hidden' },
  appTitle:      { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8 },
  appSubtitle:   { fontSize: 16, color: CYAN, marginBottom: 40 },
  glassBtn:      { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: BORDER, borderTopWidth: 1.5, borderTopColor: BEAM, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glassBtnText:  { color: '#ccc', fontWeight: '700', fontSize: 16 },

  // Sign-out modal
  signOutCard:       { backgroundColor: '#0a0a0c', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopWidth: 2, borderTopColor: BEAM, padding: 28, width: 320 },
  signOutAvatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: CARD_BG, borderWidth: 2, borderColor: CYAN, alignItems: 'center', justifyContent: 'center' },
  signOutInitial:    { fontSize: 22, fontWeight: '700', color: CYAN },
  signOutCancelBtn:  { flex: 1, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.15)', borderRadius: 12, alignItems: 'center' },
  signOutConfirmBtn: { flex: 1, paddingVertical: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderTopWidth: 1.5, borderTopColor: '#ef4444', borderRadius: 12, alignItems: 'center' },

  // Cards
  card:        { backgroundColor: CARD_BG, borderRadius: 20, borderWidth: 1, borderColor: BORDER, borderTopWidth: 1.5, borderTopColor: BEAM },
  cardHeader:  { padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  cardLabel:   { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  cardHeading: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 4 },
  cardTitle:   { fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 20 },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#0f0f13' },
  headerLogoBox: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: CYAN },
  headerTitle:   { fontSize: 20, fontWeight: '700', color: '#fff' },
  chip:          { backgroundColor: CARD_BG, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: BORDER },
  chipText:      { fontSize: 11, color: '#888' },
  userBadge:     { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: CYAN },
  userInitial:   { color: CYAN, fontWeight: '700', fontSize: 16 },

  // Chat
  bubble:     { padding: 14, borderRadius: 20, maxWidth: '80%', borderWidth: 1, borderColor: BORDER },
  bubbleUser: { backgroundColor: '#15151a', borderTopRightRadius: 4, borderTopWidth: 1.5, borderTopColor: CYAN },
  bubbleAI:   { backgroundColor: CARD_BG, borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  intentCard:       { backgroundColor: 'rgba(34,211,238,0.06)', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)' },
  viewSlotsBtn:     { backgroundColor: 'rgba(34,211,238,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', flexShrink: 0 },
  viewSlotsBtnText: { color: CYAN, fontSize: 12, fontWeight: '600' },

  inputRow: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: DARK_BG, alignItems: 'center' },
  input:    { flex: 1, backgroundColor: CARD_BG, color: '#fff', paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: BORDER, height: 48, fontSize: 15 },
  sendBtn:  { width: 48, height: 48, borderRadius: 24, backgroundColor: '#15151a', justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: BORDER, borderTopWidth: 1.5, borderTopColor: CYAN },

  // Bottom nav
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: DARK_BG, paddingVertical: 12 },
  navItem:   { flex: 1, alignItems: 'center' },
  navIcon:   { width: 24, height: 24, marginBottom: 4 },
  navLabel:  { fontSize: 12, fontWeight: '600' },

  // Calendar events
  eventCard:    { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: CYAN },
  eventTimeCol: { marginRight: 16, alignItems: 'center', width: 50 },
  eventTimeNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  eventAMPM:    { fontSize: 12, color: CYAN, fontWeight: '600' },
  eventName:    { fontSize: 15, color: '#fff', fontWeight: '700' },
  eventMeta:    { color: '#666', fontSize: 13, marginTop: 2 },

  // ML slot card (calendar tab)
  mlSlotCard: { backgroundColor: 'rgba(34,211,238,0.05)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(34,211,238,0.15)' },
  mlScoreBox: { backgroundColor: 'rgba(34,211,238,0.1)', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)', minWidth: 56 },

  // Tags
  tag:     { backgroundColor: CARD_BG, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: BORDER },
  tagText: { fontSize: 11, color: '#888' },

  // Bottom sheet
  bottomSheet: { backgroundColor: SHEET_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 0, borderTopWidth: 1.5, borderTopColor: BEAM, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetTitle:  { color: '#fff', fontWeight: '700', fontSize: 20, marginTop: 6 },
  closeBtn:    { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginLeft: 12 },

  // Slot cards
  slot:    { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderTopWidth: 1.5, borderTopColor: BEAM },
  slotTop: { backgroundColor: '#111116', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderTopWidth: 2, borderTopColor: CYAN },

  scoreBox: { backgroundColor: DARK_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 64 },
  explCard: { backgroundColor: DARK_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10 },

  badgeCyan:  { backgroundColor: 'rgba(34,211,238,0.1)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)' },
  badgeGreen: { backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  badgeText:  { fontSize: 11, fontWeight: '600' },

  cyanBtn:     { backgroundColor: 'rgba(34,211,238,0.1)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', borderTopWidth: 1.5, borderTopColor: CYAN },
  cyanBtnText: { color: CYAN, fontWeight: '700', fontSize: 13 },

  metricBox: { backgroundColor: DARK_BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER },
});
