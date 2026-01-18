"use client";

import dynamic from "next/dynamic";

const NoteOptions = dynamic(() => import("@/frontend/note_options/noteOptions"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-primary font-semibold">Loading...</p>
      </div>
    </div>
  ),
});

export default function NoteOptionsPage() {
  return <NoteOptions />;
}
