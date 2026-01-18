"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, SwitchCamera, HelpCircle, Play, Mic } from "lucide-react";
import { useRoomWebSocket } from "@/frontend/hooks/useRoomWebSocket";

interface Participant {
  id: string;
  name: string;
  color: string;
}

// ICE servers for WebRTC
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// 3-stage flow for mobile compatibility: idle → ready → live
type Stage = "idle" | "ready" | "live";

const HostView: React.FC = () => {
  const searchParams = useSearchParams();

  // Simple 3-stage state for mobile compatibility
  const [stage, setStage] = useState<Stage>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState<string>("idle");

  // Audio recording state
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Get room details from URL parameters
  const roomCode = searchParams.get("id") || "ABC123";
  const roomName = searchParams.get("title") || "Untitled Board";

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // WebRTC peer connections (one per participant)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Send audio chunk to server
  const sendAudioToServer = useCallback(async (audioBlob: Blob) => {
    if (!roomIdRef.current) {
      console.log("No room ID available for audio upload");
      return;
    }

    try {
      const form = new FormData();
      form.append("room_id", roomIdRef.current);
      form.append("duration_ms", "5000");
      form.append("file", audioBlob, `chunk_${Date.now()}.webm`);

      console.log("Uploading audio chunk to server...", {
        roomId: roomIdRef.current,
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });

      const response = await fetch(
        "https://boardcast-server.fly.dev/api/media/audio-chunks/",
        {
          method: "POST",
          body: form,
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Audio chunk uploaded successfully:", data);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to upload audio chunk:",
          response.status,
          errorText,
        );
      }
    } catch (error) {
      console.error("Error uploading audio chunk:", error);
    }
  }, []);

  // Start audio recording
  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Find supported mime type
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t));

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (!e.data.size) return;
        console.log("Audio chunk available:", e.data.size, "bytes");
        setAudioChunks((prev) => [...prev, e.data]);

        // Send to server
        await sendAudioToServer(e.data);
      };

      recorder.onstart = () => {
        console.log("Audio recording started");
        setIsRecordingAudio(true);
      };

      recorder.onstop = () => {
        console.log("Audio recording stopped");
        setIsRecordingAudio(false);
      };

      // Start recording with 5 second chunks
      recorder.start(5000);
      console.log("MediaRecorder started with 5s chunks");
    } catch (error) {
      console.error("Failed to start audio recording:", error);
    }
  }, [sendAudioToServer]);

  // Stop audio recording
  const stopAudioRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecordingAudio(false);
  }, []);

  // Handle incoming WebRTC signals
  const handleWebRTCSignal = useCallback(async (signal: any) => {
    const { type, from, sdp, candidate } = signal;

    let pc = peerConnectionsRef.current.get(from);

    if (!pc && type === "webrtc-answer") {
      console.log("No peer connection for answer from:", from);
      return;
    }

    if (type === "webrtc-answer" && pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log("Set remote description (answer) from:", from);
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    } else if (type === "webrtc-ice-candidate" && pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate from:", from);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  }, []);

  // Connect to WebSocket
  const {
    participants: wsParticipants,
    isConnected,
    roomId,
    sendWebRTCSignal,
    getClientId,
  } = useRoomWebSocket({
    joinCode: roomCode,
    participantName: "Host",
    isHost: true,
    onWebRTCSignal: handleWebRTCSignal,
  });

  // Sync roomId to ref for audio uploads
  useEffect(() => {
    if (roomId) {
      roomIdRef.current = roomId;
      console.log("Room ID synced for audio uploads:", roomId);
    }
  }, [roomId]);

  // Map WebSocket participants to UI format
  const participants: Participant[] = wsParticipants.map((p, index) => ({
    id: p.id,
    name: p.name,
    color: [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
    ][index % 5],
  }));

  // Prevent scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Stage 1: Request camera permission (idle → ready)
  const requestPermission = useCallback(async () => {
    if (stage !== "idle") return;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setStage("ready");
      console.log("Camera permission granted, stream ready");
    } catch (error) {
      console.error("Camera permission denied:", error);
      alert("Camera access denied. Please allow camera access and try again.");
    }
  }, [stage, facingMode]);

  // Stage 2: Go live (ready → live)
  const goLive = useCallback(() => {
    if (stage !== "ready" || !streamRef.current || !videoRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(console.error);
    setStage("live");
    console.log("Stream is now live");

    // Start audio recording for transcription
    startAudioRecording();
  }, [stage, startAudioRecording]);

  // Flip camera
  const flipCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);

    // If we have a stream, restart with new facing mode
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current && stage === "live") {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }

        // Update WebRTC tracks
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoTrack = stream.getVideoTracks()[0];
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender && videoTrack) {
            videoSender.replaceTrack(videoTrack);
          }
        });
      } catch (error) {
        console.error("Failed to flip camera:", error);
      }
    }
  }, [facingMode, stage]);

  // End stream
  const endStream = useCallback(() => {
    if (confirm("End stream and return to home?")) {
      // Stop audio recording
      stopAudioRecording();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      window.location.href = "/";
    }
  }, [stopAudioRecording]);

  // Create WebRTC peer connection for a participant
  const createPeerConnection = useCallback(
    async (participantId: string) => {
      if (!streamRef.current) {
        console.log("No stream available for WebRTC");
        return;
      }

      const existingPc = peerConnectionsRef.current.get(participantId);
      if (existingPc) existingPc.close();

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(participantId, pc);

      // Add stream tracks
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebRTCSignal({
            type: "webrtc-ice-candidate",
            candidate: event.candidate.toJSON(),
            to: participantId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`WebRTC state with ${participantId}:`, pc.connectionState);
        setWebrtcStatus(pc.connectionState);
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendWebRTCSignal({
          type: "webrtc-offer",
          sdp: pc.localDescription!,
          to: participantId,
        });
        console.log("Sent WebRTC offer to:", participantId);
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    },
    [sendWebRTCSignal],
  );

  // Create peer connections when participants join (only when live)
  useEffect(() => {
    if (stage !== "live" || !isConnected || !streamRef.current) return;

    const myClientId = getClientId();

    wsParticipants.forEach((participant) => {
      if (participant.id !== myClientId && participant.role !== "host") {
        if (!peerConnectionsRef.current.has(participant.id)) {
          console.log("Creating peer connection for:", participant.name);
          createPeerConnection(participant.id);
        }
      }
    });

    // Clean up departed participants
    peerConnectionsRef.current.forEach((pc, participantId) => {
      if (!wsParticipants.some((p) => p.id === participantId)) {
        pc.close();
        peerConnectionsRef.current.delete(participantId);
      }
    });
  }, [wsParticipants, stage, isConnected, createPeerConnection, getClientId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop audio recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans"
      style={{
        backgroundImage:
          stage !== "live"
            ? "radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)"
            : undefined,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Video element - always in DOM for mobile compatibility */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover bg-black ${stage === "live" ? "block" : "hidden"}`}
        autoPlay
        playsInline
        muted
      />

      {/* Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm z-10 flex items-start justify-between"
      >
        <div className="flex-1 text-center space-y-1">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg font-bold text-primary"
          >
            {roomName}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-xs text-muted">Room Code:</span>
            <code className="text-xs font-mono text-secondary font-semibold tracking-widest">
              {roomCode.length >= 6
                ? roomCode.slice(0, 3) + " " + roomCode.slice(3, 6)
                : roomCode}
            </code>
          </motion.div>
        </div>

        {stage === "live" && (
          <div className="flex items-center gap-2">
            {/* Recording Indicator */}
            {isRecordingAudio && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/20 border border-red-500/50 backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <Mic className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 rounded-full border border-selected flex items-center justify-center cursor-pointer bg-background/50 backdrop-blur-sm"
            >
              <HelpCircle className="w-5 h-5 text-primary" />
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Stage: Idle - Request Permission */}
      <AnimatePresence>
        {stage === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-center space-y-6 p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Camera className="w-20 h-20 text-muted mx-auto" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <p className="text-secondary text-lg font-semibold">
                  Start Streaming
                </p>
                <p className="text-muted text-sm">
                  Tap below to allow camera access
                </p>
              </motion.div>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={requestPermission}
                className="px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg shadow-lg cursor-pointer"
              >
                Allow Camera
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage: Ready - Go Live */}
      <AnimatePresence>
        {stage === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-center space-y-6 p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <Play className="w-10 h-10 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <p className="text-secondary text-lg font-semibold">
                  Camera Ready!
                </p>
                <p className="text-muted text-sm">
                  Tap to start streaming to participants
                </p>
              </motion.div>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goLive}
                className="px-8 py-4 bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg cursor-pointer"
              >
                Go Live
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage: Live - Bottom Controls */}
      <AnimatePresence>
        {stage === "live" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-6 z-10"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Participants Button */}
            <motion.button
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowParticipants(true)}
              className="px-4 h-16 rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer backdrop-blur-sm"
              style={{ backgroundColor: "rgba(30, 30, 30, 0.8)" }}
            >
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`w-8 h-8 rounded-full ${p.color} border-2 border-page flex items-center justify-center text-xs font-bold text-white`}
                    style={{ zIndex: 3 - idx }}
                  >
                    {p.name.charAt(0)}
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-page flex items-center justify-center text-xs text-white">
                    0
                  </div>
                )}
              </div>
            </motion.button>

            {/* End Stream Button */}
            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endStream}
              className="w-20 h-20 rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer backdrop-blur-sm"
              style={{ backgroundColor: "rgba(30, 30, 30, 0.8)" }}
            >
              <X className="w-7 h-7 text-primary" />
            </motion.button>

            {/* Flip Camera Button */}
            <motion.button
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={flipCamera}
              className="w-16 h-16 rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer backdrop-blur-sm"
              style={{ backgroundColor: "rgba(30, 30, 30, 0.8)" }}
            >
              <SwitchCamera className="w-6 h-6 text-primary" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Modal */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={() => setShowParticipants(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Participants</h2>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg"
                    >
                      <div
                        className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary">
                          {p.name}
                          {p.name === "Host" && " (You)"}
                        </p>
                        <p className="text-xs text-muted">
                          {p.name === "Host" ? "Streaming" : "Viewing"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted">No participants yet</p>
                    <p className="text-xs text-muted mt-1">
                      Share room code:{" "}
                      <span className="font-mono text-secondary">
                        {roomCode}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Stream Tips</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">
                    📱 Camera Setup
                  </h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use a phone stand or tripod</li>
                    <li>• Position camera above the whiteboard</li>
                    <li>• Ensure the board is fully visible</li>
                  </ul>
                </div>
                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">💡 Lighting</h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use bright, even lighting</li>
                    <li>• Avoid direct sunlight glare</li>
                    <li>• Minimize shadows</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostView;
