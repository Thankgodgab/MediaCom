import React, { createContext, useContext, useRef, useState } from 'react';
import {
    mediaDevices,
    MediaStream,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
} from 'react-native-webrtc';
import { io, Socket } from 'socket.io-client';

// We'll use a public relay or you can host this on Render/Heroku for free.
// For now, I'm setting this up to be Cloud-Ready.
const SIGNALING_SERVER = "https://mediacom-server.onrender.com"; // Replace with your cloud URL later

interface IntercomContextType {
    isConnected: boolean;
    isSpeaking: boolean;
    role: 'director' | 'member';
    users: any[];
    roomName: string;
    startTalking: () => void;
    stopTalking: () => void;
    setRole: (role: 'director' | 'member') => void;
    joinRoom: (roomId: string, userName: string, role: 'director' | 'member') => Promise<void>;
    leaveRoom: () => void;
}

const IntercomContext = createContext<IntercomContextType | undefined>(undefined);

export const IntercomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [role, setRole] = useState<'director' | 'member'>('member');
    const [users, setUsers] = useState<any[]>([]);
    const [roomName, setRoomName] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const pcMap = useRef<Map<string, RTCPeerConnection>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const iceConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    const cleanup = () => {
        pcMap.current.forEach(pc => pc.close());
        pcMap.current.clear();
        socketRef.current?.disconnect();
        localStream?.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        setUsers([]);
        setIsConnected(false);
    };

    const joinRoom = async (roomId: string, userName: string, userRole: 'director' | 'member') => {
        cleanup();
        setRoomName(roomId);
        setRole(userRole);

        const socket = io(SIGNALING_SERVER);
        socketRef.current = socket;

        socket.on('connect', async () => {
            setIsConnected(true);
            try {
                const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
                setLocalStream(stream);
                stream.getAudioTracks().forEach(t => t.enabled = false);
                socket.emit('join-room', { roomId, userName, role: userRole });
            } catch (err) {
                console.error("Mic error:", err);
            }
        });

        socket.on('user-joined', (user) => {
            setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
            createPeerConnection(user.id, true, socket);
        });

        socket.on('room-users', (roomUsers) => {
            setUsers(roomUsers);
            roomUsers.forEach((user: any) => {
                if (user.id !== socket.id) createPeerConnection(user.id, true, socket);
            });
        });

        socket.on('signal', async ({ from, signal }) => {
            let pc = pcMap.current.get(from);
            if (!pc) pc = createPeerConnection(from, false, socket);

            try {
                if (signal.sdp) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (signal.sdp.type === 'offer') {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.emit('signal', { to: from, signal: { sdp: pc.localDescription } });
                    }
                } else if (signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (e) {
                console.warn("Signal error:", e);
            }
        });

        socket.on('user-speaking', ({ id, isSpeaking }) => {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, isSpeaking } : u));
        });

        socket.on('user-left', (id) => {
            setUsers(prev => prev.filter(u => u.id !== id));
            pcMap.current.get(id)?.close();
            pcMap.current.delete(id);
        });
    };

    const createPeerConnection = (targetId: string, isOfferer: boolean, socket: Socket) => {
        const pc = new RTCPeerConnection(iceConfig);
        pcMap.current.set(targetId, pc);

        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) socket.emit('signal', { to: targetId, signal: { candidate: event.candidate } });
        };

        pc.ontrack = (event) => {
            // Audio streams from others are automatically handled by WebRTC
        };

        if (isOfferer) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socket.emit('signal', { to: targetId, signal: { sdp: offer } });
            }).catch(e => console.error("Offer error:", e));
        }
        return pc;
    };

    const startTalking = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach(t => t.enabled = true);
        setIsSpeaking(true);
        socketRef.current?.emit('speaking-status', { isSpeaking: true });
    };

    const stopTalking = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach(t => t.enabled = false);
        setIsSpeaking(false);
        socketRef.current?.emit('speaking-status', { isSpeaking: false });
    };

    const leaveRoom = () => {
        cleanup();
        setRoomName('');
    };

    return (
        <IntercomContext.Provider value={{
            isConnected,
            isSpeaking,
            role,
            users,
            roomName,
            startTalking,
            stopTalking,
            setRole,
            joinRoom,
            leaveRoom
        }}>
            {children}
        </IntercomContext.Provider>
    );
};

export const useIntercom = () => {
    const context = useContext(IntercomContext);
    if (!context) throw new Error('useIntercom must be used within IntercomProvider');
    return context;
};
