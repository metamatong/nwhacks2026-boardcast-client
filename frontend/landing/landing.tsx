'use client';

import { useState } from 'react';
import HowItWorksModal from '../components/HowItWorksModal';

export default function Landing() {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    if (mode === 'join' && (!roomCode.trim() || !username.trim())) return;
    if (mode === 'create' && !username.trim()) return;
    setIsLoading(true);
    console.log(
      mode === 'join'
        ? `Joining room: ${roomCode} as ${username}`
        : `Creating room as ${username}`
    );
  };

  const isFormValid = mode === 'join' 
    ? roomCode.trim() && username.trim()
    : username.trim();

  return (
    <div className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4">
      <HowItWorksModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-8xl font-bold text-primary mb-2">
            Broadcast
          </h1>
          <p className="text-secondary">
            Stream your whiteboard in real time
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 rounded-md font-medium text-sm bg-hover text-secondary hover:opacity-80 transition-all"
          >
            Learn how it works
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-selected"></div>
            <span className="text-xs text-muted">or</span>
            <div className="flex-1 border-t border-selected"></div>
          </div>
        </div>

        <div className="bg-page rounded-xl border border-selected p-8">
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === 'join'
                  ? 'bg-selected text-primary border border-primary'
                  : 'bg-background text-secondary border border-selected hover:border-primary'
              }`}
            >
              Join
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === 'create'
                  ? 'bg-selected text-primary border border-primary'
                  : 'bg-background text-secondary border border-selected hover:border-primary'
              }`}
            >
              Start
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Session Code
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition uppercase tracking-widest text-center font-mono text-lg"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              isFormValid && !isLoading
                ? 'bg-primary text-background hover:opacity-80 cursor-pointer'
                : 'bg-selected text-muted cursor-not-allowed'
            }`}
          >
            {isLoading 
              ? 'Connecting...' 
              : mode === 'join' 
                ? 'Join' 
                : 'Start Broadcast'
            }
          </button>

          {mode === 'create' && (
            <p className="text-xs text-muted text-center mt-4">
              Your session code will be generated
            </p>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted leading-relaxed">
            Transform physical whiteboards into live, collaborative digital pages. Capture, stream, and save in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
