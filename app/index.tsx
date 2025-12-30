import * as Network from 'expo-network';
import { useEffect, useRef, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { io, Socket } from 'socket.io-client';


import { createPeer, getAudioStream } from '@/lib/webrtc';
import {
    RTCPeerConnection,
    RTCSessionDescription,
} from 'react-native-webrtc';


export default function HomeScreen() {
    const [wifiOk, setWifiOk] = useState(false);
    const [joined, setJoined] = useState(false);
    const [users, setUsers] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);


    const peers = useRef<{ [id: string]: RTCPeerConnection }>({});
    const localStream = useRef<any>(null);

        

    useEffect(() => {
        checkNetwork();
    }, []);

    const checkNetwork = async () => {
        const net = await Network.getNetworkStateAsync();
        setWifiOk(net.isConnected && net.type === Network.NetworkStateType.WIFI);
    };

    const joinRoom = async () => {
        const stream = await getAudioStream();
        localStream.current = stream;

        const s = io('http://YOUR_LOCAL_IP:3000');
        setSocket(s);

        s.emit('join-room', 'media-room');

        s.on('room-users', async users => {
            for (const id of users) {
                if (id === s.id) continue;

                const peer = createPeer();
                peers.current[id] = peer;

                stream.getTracks().forEach(track =>
                    peer.addTrack(track, stream)
                );

                peer.ontrack = event => {
                    // play remote audio automatically
                };

                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);

                s.emit('offer', { to: id, offer });
            }
        });

        s.on('offer', async ({ from, offer }) => {
            const peer = createPeer();
            peers.current[from] = peer;

            stream.getTracks().forEach(track =>
                peer.addTrack(track, stream)
            );

            await peer.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            s.emit('answer', { to: from, answer });
        });

        s.on('answer', async ({ from, answer }) => {
            await peers.current[from].setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        });

        setJoined(true);
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>MediaCom</Text>

            {!joined && (
                <>
                    <Text>Wi-Fi Connected: {wifiOk ? 'YES' : 'NO'}</Text>
                    <Button
                        title="Join Media Room"
                        disabled={!wifiOk}
                        onPress={joinRoom}
                    />
                </>
            )}

            {joined && (
                <>
                    <Text style={styles.subtitle}>Connected Members</Text>
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <Text style={styles.user}>{item}</Text>
                        )}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subtitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
    },
    user: {
        padding: 6,
    },
});
