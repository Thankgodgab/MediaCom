import {
  RTCPeerConnection,
  mediaDevices,
  RTCSessionDescription,
} from 'react-native-webrtc';

export const createPeer = () => {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
};

export const getAudioStream = async () => {
  return await mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
};
