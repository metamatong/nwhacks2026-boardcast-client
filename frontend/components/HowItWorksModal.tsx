'use client';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center px-4 z-50">
      <div className="bg-page rounded-lg border border-selected max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-page border-b border-selected p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">How Broadcast Works</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors bg-transparent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">For Teachers & Presenters</h3>
            <p className="text-secondary leading-relaxed">
              Set up a camera pointing at your physical whiteboard. Broadcast automatically captures what you write in real time, cleans it up for clarity, and streams it live to your audience.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">For Remote Students</h3>
            <p className="text-secondary leading-relaxed">
              Join a session using a session code. See the whiteboard content streamed live to your screen, follow along in real time, and never miss what's being written—even if you're far away or joining late.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Save & Review</h3>
            <p className="text-secondary leading-relaxed">
              All sessions are automatically saved. Access your notes anytime to review, study, or share with others who couldn't attend.
            </p>
          </div>

          <div className="bg-hover rounded-md p-4">
            <h3 className="text-sm font-semibold text-primary mb-2">Key Benefits</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>• No expensive smart boards required</li>
              <li>• Works with any physical whiteboard and camera</li>
              <li>• Real-time streaming and collaboration</li>
              <li>• Permanent record of your sessions</li>
              <li>• Perfect for remote, hybrid, and in-person teaching</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-md font-medium text-sm bg-primary text-background hover:opacity-90 transition-all"
          >
            Got it, let's get started
          </button>
        </div>
      </div>
    </div>
  );
}
