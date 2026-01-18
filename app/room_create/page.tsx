"use client";

import dynamic from "next/dynamic";

const RoomCreate = dynamic(() => import("@/frontend/room_create/room_create"), {
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

export default function RoomCreatePage() {
  return <RoomCreate />;
}
