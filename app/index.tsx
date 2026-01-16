import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Header } from '../components/Header';
import { PreloadScreen } from '../components/PreloadScreen';
import { PTTButton } from '../components/PTTButton';
import { UserList } from '../components/UserList';
import { Colors } from '../constants/theme';
import { useIntercom } from '../hooks/useIntercom';

type AppState = 'preload' | 'choice' | 'create' | 'join' | 'intercom';

export default function App() {
  const [appState, setAppState] = useState<AppState>('preload');
  const [userName, setUserName] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [reqs, setReqs] = useState({ wifi: false, headset: false });

  const {
    isConnected,
    isSpeaking,
    users,
    startTalking,
    stopTalking,
    createRoom,
    joinRoom,
    discoverServers,
    checkRequirements,
    roomName,
    role
  } = useIntercom();

  useEffect(() => {
    const check = async () => {
      const status = await checkRequirements();
      setReqs(status);
    };
    check();
  }, [appState, checkRequirements]);

  const handleCreateRoom = async () => {
    if (!userName || !roomNameInput) return;
    setIsProcessing(true);
    try {
      await createRoom(roomNameInput, userName);
      setAppState('intercom');
    } catch (e: any) {
      Alert.alert("Connection Error", e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinSelection = async (roomId: string) => {
    if (!userName) {
      Alert.alert("Name Required", "Please enter your name first.");
      return;
    }
    setIsProcessing(true);
    try {
      await joinRoom(roomId, userName);
      setAppState('intercom');
    } catch (e: any) {
      Alert.alert("Join Error", e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshRooms = async () => {
    setIsProcessing(true);
    const servers = await discoverServers();
    const rooms = servers.flatMap(s => s.rooms);
    setAvailableRooms(rooms);
    setIsProcessing(false);
  };

  if (appState === 'preload') {
    return <PreloadScreen onFinish={() => setAppState('choice')} />;
  }

  if (appState === 'choice') {
    return (
      <View style={styles.container}>
        <View style={styles.choiceHeader}>
          <Text style={styles.choiceTitle}>Get Started</Text>
          <Text style={styles.choiceSubtitle}>How would you like to participate today?</Text>
        </View>

        <View style={styles.requirementsBox}>
          <View style={styles.reqRow}>
            <MaterialCommunityIcons name={reqs.wifi ? "wifi" : "wifi-off"} size={20} color={reqs.wifi ? Colors.success : Colors.danger} />
            <Text style={styles.reqText}>{reqs.wifi ? "WiFi Connected" : "WiFi Required"}</Text>
          </View>
          <View style={styles.reqRow}>
            <MaterialCommunityIcons name={reqs.headset ? "headphones" : "headphones-off"} size={20} color={reqs.headset ? Colors.success : Colors.secondary} />
            <Text style={styles.reqText}>{reqs.headset ? "Audio Device Ready" : "Headset Recommended"}</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>YOUR DISPLAY NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Director, Camera A"
            placeholderTextColor={Colors.textDim}
            value={userName}
            onChangeText={setUserName}
          />
        </View>

        <View style={styles.choiceActions}>
          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={() => setAppState('create')}
          >
            <View style={[styles.choiceIcon, { backgroundColor: Colors.primary }]}>
              <MaterialCommunityIcons name="plus" size={32} color="white" />
            </View>
            <Text style={styles.choiceBtnTitle}>Create Room</Text>
            <Text style={styles.choiceBtnDesc}>Start a new intercom channel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={async () => {
              setAppState('join');
              refreshRooms();
            }}
          >
            <View style={[styles.choiceIcon, { backgroundColor: Colors.accent }]}>
              <MaterialCommunityIcons name="login" size={32} color="white" />
            </View>
            <Text style={styles.choiceBtnTitle}>Join Room</Text>
            <Text style={styles.choiceBtnDesc}>Connect to existing team</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (appState === 'create') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setAppState('choice')}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Channel</Text>
          <Text style={styles.formSubtitle}>Set up a new coordination room for your team.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ROOM NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Service, Youth"
              placeholderTextColor={Colors.textDim}
              value={roomNameInput}
              onChangeText={setRoomNameInput}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!roomNameInput || isProcessing) && styles.disabledBtn]}
            onPress={handleCreateRoom}
            disabled={!roomNameInput || isProcessing}
          >
            {isProcessing ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>LAUNCH CHANNEL</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (appState === 'join') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setAppState('choice')}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.joinHeaderRow}>
            <Text style={styles.formTitle}>Available Rooms</Text>
            <TouchableOpacity onPress={refreshRooms}>
              <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.roomList}>
            {isProcessing && availableRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.emptyText}>Scanning Network...</Text>
              </View>
            ) : availableRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify-close" size={48} color={Colors.textDim} />
                <Text style={styles.emptyText}>No active rooms found on your LAN.</Text>
                <Text style={styles.emptySubText}>Ensure the signaling server is running on a laptop on this Wi-Fi.</Text>
              </View>
            ) : (
              availableRooms.map(room => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => handleJoinSelection(room.id)}
                >
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomStats}>{room.userCount} active members</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.primary} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Intercom State
  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.intercomInfo}>
        <Text style={styles.intercomRoom}>{roomName.toUpperCase()}</Text>
        <Text style={styles.intercomRole}>{role.toUpperCase()} MODE</Text>
      </View>

      <UserList users={users} />

      <View style={styles.bottomSection}>
        <PTTButton
          isSpeaking={isSpeaking}
          onPressIn={startTalking}
          onPressOut={stopTalking}
          disabled={!isConnected}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  choiceHeader: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  choiceTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white,
  },
  choiceSubtitle: {
    fontSize: 16,
    color: Colors.textDim,
    marginTop: 8,
  },
  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  label: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    color: Colors.white,
    fontSize: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceActions: {
    paddingHorizontal: 24,
    gap: 20,
  },
  choiceBtn: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  choiceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  choiceBtnTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  choiceBtnDesc: {
    fontSize: 13,
    color: Colors.textDim,
    marginTop: 4,
  },
  backBtn: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
    lineHeight: 20,
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  requirementsBox: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reqText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  joinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomList: {
    flex: 1,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  roomStats: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: Colors.textDim,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  intercomInfo: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  intercomRoom: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  intercomRole: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  }
});
