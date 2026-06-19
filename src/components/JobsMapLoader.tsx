"use client";

import dynamic from "next/dynamic";

const JobsMap = dynamic(() => import("@/components/JobsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-500">Loading map…</p>
    </div>
  ),
});

export default function JobsMapLoader() {
  return <JobsMap />;
}
