import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { USERS_DATA, CALENDAR_EVENTS, TIME_SLOTS } from './data';

type Screen = 'login' | 'chat' | 'calendar';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
}

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('login');
  
  // User & Auth State
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(''); // NEW STATE for custom error

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'user', text: 'Schedule a team sync for tomorrow.' },
    { id: 2, type: 'ai', text: 'Looking at your calendar and focus habits... I found optimal time slots from your dataset.' },
  ]);
  const [input, setInput] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filteredSlots, setFilteredSlots] = useState<any[]>([]);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  const safeUsers = Array.isArray(USERS_DATA) ? USERS_DATA : [];
  const safeSlots = Array.isArray(TIME_SLOTS) ? TIME_SLOTS : [];
  const safeEvents = Array.isArray(CALENDAR_EVENTS) ? CALENDAR_EVENTS : [];

  const currentUserEvents = safeEvents.filter((ev: any) => ev.user_id === selectedUserId || ev.id === selectedUserId);
  const currentUserSlots = safeSlots.filter((slot: any) => slot.user_id === selectedUserId || slot.id === selectedUserId);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleDatasetLogin = (name: string, id: number) => {
    setSelectedUser(name);
    setSelectedUserId(id);
    setScreen('chat');
  };

  const handleManualLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter a valid email and password.');
      return;
    }
    setSelectedUser(loginEmail.split('@')[0]);
    setSelectedUserId(999);
    setScreen('chat');
  };

  const handleConfirmSignOut = () => {
    setShowSignOut(false);
    setScreen('login');
    setSelectedUser('');
    setSelectedUserId(null);
    setLoginEmail('');
    setLoginPassword('');
    setMessages([
      { id: 1, type: 'user', text: 'Schedule a team sync for tomorrow.' },
      { id: 2, type: 'ai', text: 'Looking at your calendar and focus habits... I found optimal time slots from your dataset.' },
    ]);
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage = input.trim();

      // Extract duration from message (e.g., "30 min", "30 minute", "30m")
      const durationMatch = userMessage.match(/(\d+)\s*(min|minute|m|hour|hr|h)/i);
      const requestedDuration = durationMatch ? parseInt(durationMatch[1]) : null;

      // Filter slots by requested duration if specified
      let filtered = currentUserSlots;
      if (requestedDuration) {
        filtered = currentUserSlots.filter((slot: any) => {
          const slotDuration = slot.duration || slot.duration_minutes || 30;
          return slotDuration >= requestedDuration;
        });
      }

      setFilteredSlots(filtered);

      // Add user message
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, type: 'user', text: userMessage },
        {
          id: prev.length + 2,
          type: 'ai',
          text: requestedDuration
            ? `Finding ${requestedDuration}min slots... Analyzing your ${filtered.length} available options.`
            : 'Analyzing your calendar and finding optimal time slots...'
        }
      ]);

      setInput('');
      Keyboard.dismiss();

      setTimeout(() => {
        setShowRecommendations(true);
      }, 600);
    }
  };

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
    setShowConfirmation(true);
  };

  const handleConfirmSlot = () => {
    setShowConfirmation(false);
    setShowRecommendations(false);
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, type: 'ai', text: `✅ Confirmed! Meeting scheduled for ${selectedSlot?.time || selectedSlot?.start_time || 'the selected time'}` },
    ]);
  };

  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.logoBox}>
            <Image
              source={require('./assets/logo.png')}
              style={{ width: 70, height: 70, borderRadius: 15 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>Aura Sync</Text>
          <Text style={styles.appSubtitle}>AI-powered scheduling</Text>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            
            <TextInput
              style={styles.loginInput}
              placeholder="Email address"
              placeholderTextColor="#666"
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.loginInput}
              placeholder="Password"
              placeholderTextColor="#666"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            <TouchableOpacity 
              style={styles.primaryGlassButton} 
              onPress={handleManualLogin}
            >
              <Text style={styles.primarySignInText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK LOGIN</Text>
              <View style={styles.dividerLine} />
            </View>

            {safeUsers.length === 0 && (
              <Text style={{color: '#EF4444', textAlign: 'center', marginBottom: 10}}>Dataset not found. Manual login only.</Text>
            )}

            {safeUsers.map((u: any, idx: number) => (
              <TouchableOpacity
                key={u.id || idx}
                style={styles.glassButton}
                onPress={() => handleDatasetLogin(u.name || 'User', u.id || idx + 1)}
              >
                <Text style={styles.signInButtonText}>Login as {u.name || 'User'}</Text>
                <Image
                  source={require('./assets/arrow-right.png')}
                  style={{ width: 18, height: 18, tintColor: CYAN, marginLeft: 8 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* CUSTOM LOGIN ERROR MODAL */}
        <Modal visible={!!loginError} transparent={true} animationType="fade">
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationBox}>
              <Text style={[styles.confirmationTitle, { color: '#ef4444' }]}>Login Failed</Text>
              <Text style={[styles.confirmationText, { color: '#888', marginBottom: 20 }]}>{loginError}</Text>
              <TouchableOpacity 
                style={[styles.confirmButton, { width: '100%', borderColor: '#ef4444' }]} 
                onPress={() => setLoginError('')}
              >
                <Text style={[styles.confirmButtonText, { color: '#ef4444' }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }

  if (screen === 'chat') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeaderTitle}>Aura Sync</Text>
            <TouchableOpacity style={styles.userBadge} onPress={() => setShowSignOut(true)}>
              <Text style={styles.userInitial}>{selectedUser ? selectedUser.charAt(0).toUpperCase() : 'U'}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={messages}
            keyExtractor={msg => msg.id.toString()}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View style={[styles.messageLine, item.type === 'user' ? styles.userLine : styles.aiLine]}>
                {item.type === 'ai' && <Text style={styles.aiAvatar}>⚡</Text>}
                <View style={[styles.messageBubble, item.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.messageText, item.type === 'user' ? styles.userMessageText : styles.aiMessageText]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />

          <Modal visible={showSignOut} transparent={true} animationType="fade">
            <View style={styles.confirmationOverlay}>
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationTitle}>Sign Out</Text>
                <Text style={[styles.confirmationText, {color: '#888', marginBottom: 20}]}>Are you sure you want to sign out?</Text>
                <View style={{flexDirection: 'row', gap: 12, width: '100%'}}>
                  <TouchableOpacity style={[styles.confirmButton, {flex: 1, backgroundColor: '#111', borderTopColor: '#333'}]} onPress={() => setShowSignOut(false)}>
                    <Text style={[styles.confirmButtonText, {color: '#888'}]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmButton, {flex: 1, borderTopColor: '#ef4444'}]} onPress={handleConfirmSignOut}>
                    <Text style={[styles.confirmButtonText, {color: '#ef4444'}]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={showRecommendations} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.bottomSheet}>
                <View style={styles.modalHandle}><View style={styles.handleBar} /></View>
                <Text style={styles.modalTitle}>Top Recommendations</Text>
                
                <ScrollView contentContainerStyle={styles.slotsListContent}>
                  {currentUserSlots.length === 0 && (
                    <Text style={{color: '#888', textAlign: 'center', marginTop: 20}}>No ML recommendations found in dataset for this user.</Text>
                  )}
                  {currentUserSlots.map((slot: any, index: number) => {
                    const isTopChoice = index === 0 || slot.isTop;
                    return (
                      <TouchableOpacity key={slot.id || slot.slot_id || index} style={[styles.slotCard, isTopChoice && styles.topSlotCard]} onPress={() => handleSelectSlot(slot)}>
                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreText}>⭐ {(slot.score || 90)}% ML Match</Text>
                        </View>
                        <Text style={styles.slotTime}>{slot.time || slot.start_time}</Text>
                        <Text style={styles.slotDescription}>{slot.description || 'Optimal slot based on your focus history.'}</Text>
                        <View style={[styles.slotButton, isTopChoice && styles.confirmButtonHighlight]}>
                          <Text style={[styles.slotButtonText, isTopChoice && styles.confirmButtonText]}>
                            {isTopChoice ? 'Confirm & Schedule' : 'Select'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal visible={showConfirmation} transparent={true} animationType="fade">
            <View style={styles.confirmationOverlay}>
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationTitle}>✅ Scheduled</Text>
                <Text style={styles.confirmationText}>{selectedSlot?.time || selectedSlot?.start_time}</Text>
                <TouchableOpacity style={[styles.confirmButton, {width: '100%'}]} onPress={handleConfirmSlot}>
                  <Text style={styles.confirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.inputBoxContainer}>
            <TextInput
              style={styles.inputBox}
              placeholder="Ask Aura to schedule..."
              placeholderTextColor="#666"
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity style={styles.sendButtonBox} onPress={handleSendMessage}>
              <Image
                source={require('./assets/arrow-up.png')}
                style={{ width: 22, height: 22, tintColor: CYAN }}
              />
            </TouchableOpacity>
          </View>

          {!isKeyboardVisible && (
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => setScreen('chat')}>
                <Image 
                  source={require('./assets/message-square.png')}
                  style={[styles.navIconImg, { tintColor: screen === 'chat' ? CYAN : '#555' }]} 
                />
                <Text style={[styles.navLabel, { color: screen === 'chat' ? CYAN : '#555' }]}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => setScreen('calendar')}>
                <Image 
                  source={require('./assets/calendar.png')}
                  style={[styles.navIconImg, { tintColor: screen === 'calendar' ? CYAN : '#555' }]} 
                />
                <Text style={[styles.navLabel, { color: screen === 'calendar' ? CYAN : '#555' }]}>Calendar</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Calendar Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>Aura Sync</Text>
        <TouchableOpacity style={styles.userBadge} onPress={() => setShowSignOut(true)}>
           <Text style={styles.userInitial}>{selectedUser ? selectedUser.charAt(0).toUpperCase() : 'U'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.calendarContent}>
        <Text style={styles.sectionTitle}>{selectedUser}'s Events</Text>
        
        {currentUserEvents.length === 0 && (
           <Text style={{color: '#888', textAlign: 'center', marginTop: 40}}>No calendar events found in dataset for this user.</Text>
        )}

        {currentUserEvents.map((ev: any, index: number) => {
          if (!ev || !ev.start_time) return null;
          
          const timeParts = ev.start_time.split(':');
          const hour = parseInt(timeParts[0] || '0', 10);
          const minutes = timeParts[1] || '00';
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const timeStr = `${displayHour}:${minutes}`;
          const safeType = ev.meeting_type ? ev.meeting_type.replace(/_/g, ' ').toUpperCase() : 'MEETING';

          return (
            <View key={ev.event_id || index} style={styles.eventCard}>
              <View style={styles.eventTimeSection}>
                <Text style={styles.eventTime}>{timeStr}</Text>
                <Text style={styles.eventAMPM}>{ampm}</Text>
              </View>
              <View>
                <Text style={styles.eventName}>{safeType}</Text>
                <Text style={styles.eventMeta}>{ev.duration || ev.duration_minutes || 30}m • {ev.date || 'Today'}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showSignOut} transparent={true} animationType="fade">
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Sign Out</Text>
            <Text style={[styles.confirmationText, {color: '#888', marginBottom: 20}]}>Are you sure you want to sign out?</Text>
            <View style={{flexDirection: 'row', gap: 12, width: '100%'}}>
              <TouchableOpacity style={[styles.confirmButton, {flex: 1, backgroundColor: '#111', borderTopColor: '#333'}]} onPress={() => setShowSignOut(false)}>
                <Text style={[styles.confirmButtonText, {color: '#888'}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, {flex: 1, borderTopColor: '#ef4444'}]} onPress={handleConfirmSignOut}>
                <Text style={[styles.confirmButtonText, {color: '#ef4444'}]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setScreen('chat')}>
          <Image
            source={require('./assets/message-square.png')}
            style={[styles.navIconImg, { tintColor: screen === 'chat' ? CYAN : '#555' }]}
          />
          <Text style={[styles.navLabel, { color: screen === 'chat' ? CYAN : '#555' }]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setScreen('calendar')}>
          <Image
            source={require('./assets/calendar.png')}
            style={[styles.navIconImg, { tintColor: screen === 'calendar' ? CYAN : '#555' }]}
          />
          <Text style={[styles.navLabel, { color: screen === 'calendar' ? CYAN : '#555' }]}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CYAN = '#22d3ee'; 
const DARK_BG = '#050505'; 
const CARD_BG = '#0f0f13'; 
const BORDER_COLOR = 'rgba(255, 255, 255, 0.05)';
const LIGHT_BEAM = 'rgba(255, 255, 255, 0.2)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  loginContent: { padding: 40, alignItems: 'center' },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: CYAN, marginBottom: 20, overflow: 'hidden' },
  appTitle: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8 },
  appSubtitle: { fontSize: 16, color: CYAN, marginBottom: 40 },
  formCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: LIGHT_BEAM, borderTopWidth: 1.5 },
  formTitle: { fontSize: 18, color: '#fff', marginBottom: 20, textAlign: 'center' },
  loginInput: { backgroundColor: DARK_BG, color: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12, fontSize: 15 },
  primaryGlassButton: { backgroundColor: 'rgba(34, 211, 238, 0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.3)', borderTopColor: CYAN, borderTopWidth: 1.5 },
  primarySignInText: { color: CYAN, fontWeight: '800', fontSize: 16 },
  glassButton: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: LIGHT_BEAM, borderTopWidth: 1.5, marginBottom: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInButtonText: { color: '#ccc', fontWeight: '700', textAlign: 'center', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER_COLOR },
  dividerText: { color: '#666', marginHorizontal: 10, fontSize: 12, fontWeight: 'bold' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  chatHeaderTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  userBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: CYAN },
  userInitial: { color: CYAN, fontWeight: '700', fontSize: 16 },
  messagesList: { padding: 16 },
  messageLine: { marginVertical: 8, flexDirection: 'row', alignItems: 'flex-end' },
  userLine: { justifyContent: 'flex-end' },
  aiLine: { justifyContent: 'flex-start' },
  aiAvatar: { fontSize: 20, marginRight: 8, marginBottom: 4 },
  messageBubble: { padding: 14, borderRadius: 20, maxWidth: '80%' },
  userBubble: { backgroundColor: '#15151a', borderTopRightRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: CYAN, borderTopWidth: 1.5 },
  aiBubble: { backgroundColor: CARD_BG, borderTopLeftRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR },
  messageText: { fontSize: 15, lineHeight: 22 },
  userMessageText: { color: '#fff' },
  aiMessageText: { color: '#bbb' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  bottomSheet: { backgroundColor: '#0a0a0c', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: LIGHT_BEAM },
  modalHandle: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', paddingHorizontal: 20, marginBottom: 10 },
  slotsListContent: { paddingHorizontal: 16 },
  slotCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: LIGHT_BEAM, borderTopWidth: 1.5 },
  topSlotCard: { borderTopColor: CYAN, borderTopWidth: 2, backgroundColor: '#111116' },
  scoreContainer: { marginBottom: 8 },
  scoreText: { color: CYAN, fontWeight: '700', fontSize: 13 },
  slotTime: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  slotDescription: { fontSize: 14, color: '#888', marginBottom: 16 },
  slotButton: { backgroundColor: '#1a1a20', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  confirmButtonHighlight: { backgroundColor: '#15151a', borderTopColor: CYAN, borderTopWidth: 1.5 },
  slotButtonText: { color: '#fff', fontWeight: '600' },
  confirmButtonText: { color: CYAN },
  confirmationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmationBox: { backgroundColor: CARD_BG, padding: 30, borderRadius: 20, borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: LIGHT_BEAM, borderTopWidth: 1.5, alignItems: 'center', width: '100%' },
  confirmationTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  confirmationText: { color: CYAN, fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  confirmButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  inputBoxContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: BORDER_COLOR, backgroundColor: DARK_BG },
  inputBox: { flex: 1, backgroundColor: CARD_BG, color: '#fff', paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: BORDER_COLOR },
  sendButtonBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#15151a', justifyContent: 'center', alignItems: 'center', marginLeft: 10, borderWidth: 1, borderColor: BORDER_COLOR, borderTopColor: CYAN, borderTopWidth: 1.5 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER_COLOR, backgroundColor: DARK_BG, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center' },
  navIconImg: { width: 24, height: 24, marginBottom: 4 },
  navLabel: { fontSize: 12, fontWeight: '600' },
  calendarContent: { padding: 20 },
  sectionTitle: { fontSize: 14, color: '#888', fontWeight: '700', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  eventCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR, borderLeftWidth: 4, borderLeftColor: CYAN },
  eventTimeSection: { marginRight: 16, alignItems: 'center', width: 50 },
  eventTime: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  eventAMPM: { fontSize: 12, color: CYAN, fontWeight: '600' },
  eventName: { fontSize: 16, color: '#fff', fontWeight: '700' },
  eventMeta: { color: '#666', fontSize: 13, marginTop: 4 }
});

export default App;