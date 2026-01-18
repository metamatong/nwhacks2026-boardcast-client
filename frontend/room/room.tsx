"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share,
  Circle,
  Layers,
  LogOut,
  X,
  Copy,
  Check,
  ChevronLeft,
  Trash2,
  Plus,
} from "lucide-react";

interface Snippet {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  color: string;
}

const MOCK_SNIPPETS: Snippet[] = [
  {
    id: "1",
    title: "Diagram 1",
    description: "Flow Chart",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    title: "Notes 2",
    description: "Meeting Notes",
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: "3",
    title: "Wireframe 3",
    description: "UI Design",
    timestamp: new Date(Date.now() - 900000),
  },
  {
    id: "4",
    title: "Brainstorm 4",
    description: "Ideas",
    timestamp: new Date(Date.now() - 1200000),
  },
  {
    id: "5",
    title: "Plan 5",
    description: "Project Plan",
    timestamp: new Date(Date.now() - 1500000),
  },
  {
    id: "6",
    title: "Code 6",
    description: "Code Review",
    timestamp: new Date(Date.now() - 1800000),
  },
];

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "1", name: "John Doe", color: "bg-blue-500" },
  { id: "2", name: "Jane Smith", color: "bg-purple-500" },
  { id: "3", name: "Bob Johnson", color: "bg-green-500" },
  { id: "4", name: "Alice Brown", color: "bg-yellow-500" },
  { id: "5", name: "Charlie Davis", color: "bg-red-500" },
];

const ParticipantAvatars: React.FC<{ participants: Participant[] }> = ({
  participants,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {participants.slice(0, 3).map((participant) => (
          <div
            key={participant.id}
            className={`w-8 h-8 rounded-full ${participant.color} border-2 border-page flex items-center justify-center text-xs font-semibold text-white`}
            title={participant.name}
          >
            {participant.name.charAt(0)}
          </div>
        ))}
      </div>
      {participants.length > 3 && (
        <span className="text-xs text-muted">+{participants.length - 3}</span>
      )}
    </div>
  );
};

const Header: React.FC<{
  roomCode: string;
  title: string;
  participants: Participant[];
  onCopyCode: () => void;
  copied: boolean;
  showParticipants: boolean;
  onToggleParticipants: () => void;
  onKickParticipant: (id: string) => void;
}> = ({
  roomCode,
  title,
  participants,
  onCopyCode,
  copied,
  showParticipants,
  onToggleParticipants,
  onKickParticipant,
}) => (
  <motion.header
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-page/80 backdrop-blur-sm border-b border-selected p-4 shrink-0 z-10 sticky top-0"
  >
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:flex items-center justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-primary truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-background rounded-lg border border-selected">
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-muted uppercase tracking-wide font-semibold">
              Room Code
            </span>
            <code className="font-mono text-sm text-primary font-bold tracking-[0.3em]">
              {roomCode}
            </code>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCopyCode}
            className="p-2 hover:bg-hover bg-transparent! rounded-lg transition-colors cursor-pointer group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            aria-label="Copy room code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
            )}
          </motion.button>
        </div>
        <div className="relative">
          <div
            onClick={onToggleParticipants}
            className="group flex items-center gap-3 px-5 py-2.5 bg-background rounded-lg border border-selected hover:border-gray-500 transform ease-in duration-100 cursor-pointer"
          >
            <ParticipantAvatars participants={participants} />
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-primary">
                {participants.length}
              </span>
              <span className="text-xs text-muted">In Room</span>
            </div>
          </div>
          <AnimatePresence>
            {showParticipants && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-64 bg-page border border-selected rounded-xl shadow-2xl overflow-hidden z-50"
              >
              <div className="px-4 py-3 border-b border-selected bg-background/50 backdrop-blur-sm flex justify-between items-center">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Participants
                </span>
                <span className="text-xs bg-selected px-2 py-0.5 rounded-full text-primary font-mono">
                  {participants.length}
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="group flex items-center gap-3 p-2 hover:bg-hover rounded-lg transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${participant.color} flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all`}
                    >
                      {participant.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">
                        {participant.name}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onKickParticipant(participant.id);
                      }}
                      className="bg-transparent! p-1.5 border border-transparent hover:bg-red-500/20 hover:border-red-500 rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                      aria-label={`Kick ${participant.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted group-hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="md:hidden space-y-3"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary truncate">{title}</h1>
          <ParticipantAvatars participants={participants} />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-selected">
          <code className="font-mono text-sm text-primary font-bold tracking-widest flex-1">
            {roomCode}
          </code>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCopyCode}
            className="p-1.5 hover:bg-hover rounded transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            aria-label="Copy room code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-secondary" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  </motion.header>
);

const WhiteboardArea: React.FC = () => (
  <div
    className="flex-1 bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0 relative"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
      backgroundSize: "40px 40px",
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full h-full max-w-6xl bg-page/50 backdrop-blur-sm border border-selected rounded-xl flex items-center justify-center shadow-xl"
    >
      <div className="text-center space-y-6 p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative inline-block"
        >
          <Layers className="w-20 h-20 text-muted mx-auto" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-2"
        >
          <p className="text-secondary text-lg font-semibold">
            Whiteboard Ready
          </p>
          <p className="text-muted text-sm max-w-md">
            Start sharing your screen or use whiteboard tools to collaborate in
            real-time
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-2 text-xs text-muted"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Waiting for content...</span>
        </motion.div>
      </div>
    </motion.div>
  </div>
);

const Controla: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}> = ({ icon, label, onClick, variant = "secondary", disabled = false }) => {
  const variantClasses = {
    primary: "bg-primary text-background hover:opacity-80",
    secondary: "bg-hover text-primary hover:opacity-80 border border-selected",
    danger: "bg-hover text-primary hover:border-red-500 border border-selected",
  };
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none`}
    >
      {icon}
      <span className="hidden sm:inline text-sm">{label}</span>
    </motion.button>
  );
};

const ControlPanel: React.FC<{
  onShareScreen: () => void;
  onStartRecording: () => void;
  onOpenWhiteboard: () => void;
  onEndSession: () => void;
  isRecording: boolean;
}> = ({
  onShareScreen,
  onStartRecording,
  onOpenWhiteboard,
  onEndSession,
  isRecording,
}) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="bg-page/80 backdrop-blur-sm border-t border-selected p-4 shrink-0"
  >
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Controla
          icon={<Share className="w-4 h-4" />}
          label="Share Screen"
          onClick={onShareScreen}
          variant="primary"
        />
        <Controla
          icon={
            isRecording ? (
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            ) : (
              <Circle className="w-4 h-4" />
            )
          }
          label={isRecording ? "Recording..." : "Start Recording"}
          onClick={onStartRecording}
          variant={isRecording ? "danger" : "primary"}
        />
        <Controla
          icon={<Layers className="w-4 h-4" />}
          label="Whiteboard"
          onClick={onOpenWhiteboard}
          variant="primary"
        />
        <Controla
          icon={<LogOut className="w-4 h-4" />}
          label="End Session"
          onClick={onEndSession}
          variant="primary"
        />
      </motion.div>
    </div>
  </motion.div>
);

const SnippetCard: React.FC<{
  snippet: Snippet;
  onClick: () => void;
  onDelete: () => void;
}> = ({ snippet, onClick, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`group bg-background p-3 rounded-lg border border-selected transition-all ${
        isHovered ? "bg-hover border-primary" : ""
      } relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className="w-full text-left cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
      >
        <div className="aspect-video bg-page border border-selected rounded-lg flex items-center justify-center mb-2 overflow-hidden transition-colors">
          <div className="text-muted text-sm text-center px-2">
            {snippet.title}
          </div>
        </div>
        <div className="text-primary text-sm font-semibold transition-colors">
          {snippet.description}
        </div>
        <div className="text-muted text-xs mt-1">
          {snippet.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </button>
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 p-1.5 hover:bg-red-500/20 border border-transparent hover:border-red-500 rounded-md transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            aria-label="Delete snippet"
          >
            <Trash2 className="w-3 h-3 text-muted group-hover:text-red-500" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  snippets: Snippet[];
  onSnippetClick: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => void;
  onCreateSnippet: () => void;
}> = ({
  isOpen,
  onClose,
  snippets,
  onSnippetClick,
  onDeleteSnippet,
  onCreateSnippet,
}) => (
  <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </AnimatePresence>
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-80 lg:w-96 bg-page/95 backdrop-blur-md border-l border-selected shadow-2xl z-50"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-selected shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg border border-selected">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Snippets</h2>
              <p className="text-xs text-muted">{snippets.length} saved</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-secondary" />
          </motion.button>
        </div>
        <div className="p-4 border-b border-selected space-y-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateSnippet}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-background rounded-lg font-semibold hover:opacity-80 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Snippet</span>
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {snippets.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="popLayout">
                {snippets.map((snippet, index) => (
                  <motion.div
                    key={snippet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SnippetCard
                      snippet={snippet}
                      onClick={() => onSnippetClick(snippet)}
                      onDelete={() => onDeleteSnippet(snippet.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Layers className="w-16 h-16 text-muted mb-4" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-secondary font-semibold mb-2"
              >
                No snippets yet
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-muted text-sm"
              >
                Capture moments from your whiteboard session to save and review
                later
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  </>
);

const SidebarToggle: React.FC<{ onClick: () => void; isOpen: boolean }> = ({
  onClick,
  isOpen,
}) => (
  <AnimatePresence>
    {!isOpen && (
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-30 bg-page/90 backdrop-blur-sm hover:bg-hover text-primary px-3 py-6 rounded-l-lg shadow-xl border border-selected border-r-0 transition-all duration-300 group cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </motion.button>
    )}
  </AnimatePresence>
);

const Room: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [roomCode] = useState("ABC-123-XYZ");
  const [title] = useState("Untitled Board");
  const [snippets, setSnippets] = useState(MOCK_SNIPPETS);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] =
    useState<Participant[]>(MOCK_PARTICIPANTS);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [roomCode]);

  const handleSnippetClick = useCallback((snippet: Snippet) => {
    console.log("Snippet clicked:", snippet);
  }, []);

  const handleDeleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    console.log("Deleted snippet:", id);
  }, []);

  const handleCreateSnippet = useCallback(() => {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: `Snippet ${snippets.length + 1}`,
      description: "New Capture",
      timestamp: new Date(),
    };
    setSnippets((prev) => [newSnippet, ...prev]);
    console.log("Created snippet:", newSnippet);
  }, [snippets.length]);

  const handleShareScreen = useCallback(() => {
    console.log("Share screen clicked");
  }, []);

  const handleStartRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
    console.log(isRecording ? "Stop recording" : "Start recording");
  }, [isRecording]);

  const handleOpenWhiteboard = useCallback(() => {
    console.log("Open whiteboard clicked");
  }, []);

  const handleEndSession = useCallback(() => {
    if (confirm("Are you sure you want to end this session?")) {
      console.log("End session clicked");
    }
  }, []);

  const handleKickParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setShowParticipants(false);
    console.log("Kicked participant:", id);
  }, []);

  return (
    <div className="h-screen bg-background text-primary overflow-hidden flex flex-col font-sans">
      <Header
        roomCode={roomCode}
        title={title}
        participants={participants}
        onCopyCode={handleCopyCode}
        copied={copied}
        showParticipants={showParticipants}
        onToggleParticipants={() => setShowParticipants((s) => !s)}
        onKickParticipant={handleKickParticipant}
      />
      <WhiteboardArea />
      <ControlPanel
        onShareScreen={handleShareScreen}
        onStartRecording={handleStartRecording}
        onOpenWhiteboard={handleOpenWhiteboard}
        onEndSession={handleEndSession}
        isRecording={isRecording}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        snippets={snippets}
        onSnippetClick={handleSnippetClick}
        onDeleteSnippet={handleDeleteSnippet}
        onCreateSnippet={handleCreateSnippet}
      />
      <SidebarToggle
        onClick={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />
    </div>
  );
};

export default Room;
