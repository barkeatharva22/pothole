"use client";

import dynamic from "next/dynamic";

const HazardMapClient = dynamic(() => import("./HazardMapClient"), { ssr: false });

export default function PublicMapPage() {
  return <HazardMapClient />;
}
