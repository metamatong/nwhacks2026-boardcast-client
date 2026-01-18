"use client";

import dynamic from "next/dynamic";

const HostView = dynamic(() => import("@/frontend/host_view/host_view"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-primary font-semibold">Loading camera...</p>
      </div>
    </div>
  ),
});

export default function HostViewPage() {
  return <HostView />;
}
