"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export interface VoiceParticipant {
  socketId: string;
  userId: string;
  muted: boolean;
}

type SignalData = { sdp: RTCSessionDescriptionInit } | { candidate: RTCIceCandidateInit };

/**
 * STUN finds each player's public address. Strict NATs also need a TURN
 * relay: set NEXT_PUBLIC_ICE_SERVERS to a JSON RTCIceServer[] to add one.
 */
function iceServers(): RTCIceServer[] {
  const raw = process.env.NEXT_PUBLIC_ICE_SERVERS;
  if (raw) {
    try {
      return JSON.parse(raw) as RTCIceServer[];
    } catch {
      console.warn("NEXT_PUBLIC_ICE_SERVERS is not valid JSON; using public STUN only");
    }
  }
  return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
}

/** RMS level above which a stream counts as speaking. */
const SPEAKING_LEVEL = 0.04;

interface Peer {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  /** ICE candidates that arrived before the remote description. */
  pending: RTCIceCandidateInit[];
}

/**
 * Room voice channel over a WebRTC mesh. The socket only carries signaling;
 * audio goes straight between players. Whoever joins calls everyone already
 * there, so two peers never both send offers.
 */
export function useVoiceChat(socket: Socket | null, roomId: string) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** socketIds currently talking; "me" for the local mic. */
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());

  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, Peer>());
  const audioCtx = useRef<AudioContext | null>(null);
  const meters = useRef(new Map<string, AnalyserNode>());

  const meter = useCallback((key: string, stream: MediaStream) => {
    const ctx = audioCtx.current;
    if (!ctx || meters.current.has(key)) return;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    meters.current.set(key, analyser);
  }, []);

  const closePeer = useCallback((socketId: string) => {
    const peer = peers.current.get(socketId);
    if (!peer) return;
    peer.pc.close();
    peer.audio.srcObject = null;
    peers.current.delete(socketId);
    meters.current.delete(socketId);
  }, []);

  const teardown = useCallback(() => {
    for (const id of [...peers.current.keys()]) closePeer(id);
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    meters.current.clear();
    void audioCtx.current?.close();
    audioCtx.current = null;
    setJoined(false);
    setMuted(false);
    setSpeaking(new Set());
  }, [closePeer]);

  const createPeer = useCallback(
    (socketId: string): Peer => {
      const existing = peers.current.get(socketId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      const audio = new Audio();
      audio.autoplay = true;
      const peer: Peer = { pc, audio, pending: [] };
      peers.current.set(socketId, peer);

      localStream.current?.getTracks().forEach((track) => pc.addTrack(track, localStream.current!));
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket?.emit("voice:signal", { roomId, to: socketId, data: { candidate: e.candidate.toJSON() } });
        }
      };
      pc.ontrack = (e) => {
        const [stream] = e.streams;
        if (!stream) return;
        audio.srcObject = stream;
        audio.play().catch(() => setError("Click anywhere to allow voice playback."));
        meter(socketId, stream);
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") closePeer(socketId);
      };
      return peer;
    },
    [socket, roomId, meter, closePeer]
  );

  const flushCandidates = async (peer: Peer) => {
    for (const c of peer.pending.splice(0)) await peer.pc.addIceCandidate(c).catch(() => {});
  };

  // Signaling and the participant list.
  useEffect(() => {
    if (!socket) return;

    const onParticipants = (list: VoiceParticipant[]) => {
      setParticipants(list);
      const present = new Set(list.map((p) => p.socketId));
      for (const id of [...peers.current.keys()]) if (!present.has(id)) closePeer(id);
    };

    const onPeers = async (others: VoiceParticipant[]) => {
      if (!localStream.current) return;
      for (const other of others) {
        const { pc } = createPeer(other.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("voice:signal", { roomId, to: other.socketId, data: { sdp: pc.localDescription!.toJSON() } });
      }
    };

    const onSignal = async ({ from, data }: { from: string; data: SignalData }) => {
      if (!localStream.current) return;
      try {
        if ("sdp" in data) {
          const peer = createPeer(from);
          await peer.pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === "offer") {
            await peer.pc.setLocalDescription(await peer.pc.createAnswer());
            socket.emit("voice:signal", { roomId, to: from, data: { sdp: peer.pc.localDescription!.toJSON() } });
          }
          await flushCandidates(peer);
        } else {
          const peer = peers.current.get(from);
          if (!peer) return;
          if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(data.candidate).catch(() => {});
          else peer.pending.push(data.candidate);
        }
      } catch (err) {
        console.error("Voice signaling failed", err);
      }
    };

    // The server drops us from voice when the socket drops.
    const onDisconnect = () => teardown();

    socket.on("voice:participants", onParticipants);
    socket.on("voice:peers", onPeers);
    socket.on("voice:signal", onSignal);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("voice:participants", onParticipants);
      socket.off("voice:peers", onPeers);
      socket.off("voice:signal", onSignal);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, roomId, createPeer, closePeer, teardown]);

  // Speaking indicators.
  useEffect(() => {
    if (!joined) return;
    const buffer = new Float32Array(512);
    const interval = setInterval(() => {
      const now = new Set<string>();
      for (const [key, analyser] of meters.current) {
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (const v of buffer) sum += v * v;
        if (Math.sqrt(sum / buffer.length) > SPEAKING_LEVEL) now.add(key);
      }
      setSpeaking((prev) =>
        prev.size === now.size && [...now].every((k) => prev.has(k)) ? prev : now
      );
    }, 150);
    return () => clearInterval(interval);
  }, [joined]);

  // Leave voice when the page goes away.
  useEffect(
    () => () => {
      socket?.emit("voice:leave", { roomId });
      teardown();
    },
    [socket, roomId, teardown]
  );

  const join = useCallback(async () => {
    if (!socket || joined || joining) return;
    setError(null);
    setJoining(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice chat needs a secure (https) page and a browser with microphone support.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStream.current = stream;
      audioCtx.current = new AudioContext();
      meter("me", stream);

      const ack = await new Promise<{ ok: boolean; error?: { message: string } }>((resolve) =>
        socket.emit("voice:join", { roomId }, resolve)
      );
      if (!ack?.ok) throw new Error(ack?.error?.message ?? "Couldn't join voice");
      setJoined(true);
    } catch (err) {
      teardown();
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setError(denied ? "Microphone access was blocked. Allow it in the browser to talk." : (err as Error).message);
    } finally {
      setJoining(false);
    }
  }, [socket, roomId, joined, joining, meter, teardown]);

  const leave = useCallback(() => {
    socket?.emit("voice:leave", { roomId });
    teardown();
  }, [socket, roomId, teardown]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    localStream.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
    socket?.emit("voice:mute", { roomId, muted: next });
  }, [socket, roomId, muted]);

  return {
    participants,
    joined,
    joining,
    muted,
    error,
    /** Socket id of this tab, to tell "me" apart from my other tabs. */
    mySocketId: socket?.id ?? null,
    isSpeaking: (socketId: string) => speaking.has(socketId === socket?.id ? "me" : socketId),
    join,
    leave,
    toggleMute,
  };
}
