import * as Network from 'expo-network';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
    mediaDevices,
    MediaStream,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
} from 'react-native-webrtc';
import { io, Socket } from 'socket.io-client';

interface IntercomContextType {
    isConnected: boolean;
    isSpeaking: boolean;
    role: 'director' | 'member';
    users: any[];
    roomName: string;
    serverAddress: string | null;
    startTalking: () => void;
    stopTalking: () => void;
    setRole: (role: 'director' | 'member') => void;
    createRoom: (roomName: string, userName: string) => Promise<void>;
    joinRoom: (roomId: string, userName: string) => Promise<void>;
    discoverServers: () => Promise<any[]>;
    checkRequirements: () => Promise<{ wifi: boolean, headset: boolean }>;
}

const IntercomContext = createContext<IntercomContextType | undefined>(undefined);

export const IntercomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [role, setRole] = useState<'director' | 'member'>('member');
    const [users, setUsers] = useState<any[]>([]);
    const [roomName, setRoomName] = useState('');
    const [serverAddress, setServerAddress] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const pcMap = useRef<Map<string, RTCPeerConnection>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const iceConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    const checkRequirements = async () => {
        const netInfo = await Network.getNetworkStateAsync();
        const wifi = netInfo.type === Network.NetworkStateType.WIFI;

        // Headset check is simplified for now as expo-av doesn't expose a direct sync property
        return { wifi, headset: true };
    };

    const discoverServers = async () => {
        const ip = await Network.getIpAddressAsync();
        const baseIp = ip.split('.').slice(0, 3).join('.');

        const pings = [];
        for (let i = 1; i < 255; i++) {
            const targetIp = `${baseIp}.${i}`;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1500);

            pings.push(
                fetch(`http://${targetIp}:3000/status`, { signal: controller.signal })
                    .then(res => res.json())
                    .then(data => ({ ip: targetIp, ...data }))
                    .catch(() => null)
                    .finally(() => clearTimeout(id))
            );
        }

        const results = await Promise.all(pings);
        return results.filter(r => r !== null);
    };

    const connectToSocket = (address: string, userName: string, roomId: string, userRole: any) => {
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io(`http://${address}:3000`);
        socketRef.current = socket;
        setServerAddress(address);

        socket.on('connect', async () => {
            setIsConnected(true);
            const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            stream.getAudioTracks().forEach(t => t.enabled = false);
            socket.emit('join-room', { roomId, userName, role: userRole });
        });

        socket.on('user-joined', (user) => {
            setUsers(prev => [...prev, user]);
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

        if (isOfferer) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socket.emit('signal', { to: targetId, signal: { sdp: offer } });
            });
        }
        return pc;
    };

    const createRoom = async (roomName: string, userName: string) => {
        const servers = await discoverServers();
        if (servers.length === 0) throw new Error("No MediaCom server found on network. Ensure server is running on a laptop.");
        setRoomName(roomName);
        setRole('director');
        connectToSocket(servers[0].ip, userName, roomName, 'director');
    };

    const joinRoom = async (roomId: string, userName: string) => {
        const servers = await discoverServers();
        if (servers.length === 0) throw new Error("No MediaCom server found.");
        const server = servers.find(s => s.rooms.some((r: any) => r.id === roomId));
        if (!server) throw new Error("Room no longer exists.");
        setRoomName(roomId);
        setRole('member');
        connectToSocket(server.ip, userName, roomId, 'member');
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

    return (
        <IntercomContext.Provider value={{
            isConnected,
            isSpeaking,
            role,
            users,
            roomName,
            serverAddress,
            startTalking,
            stopTalking,
            setRole,
            createRoom,
            joinRoom,
            discoverServers,
            checkRequirements
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
