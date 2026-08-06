"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface MapWrapperProps {
  latitude?: number | string;
  longitude?: number | string;
  onChange?: (lat: string, lng: string) => void;
  readOnly?: boolean;
}

const MapComponentWithNoSSR = dynamic(
  () => import("./LocationMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-55 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-800" />
        <span className="text-xs font-medium">Mounting map modules...</span>
      </div>
    )
  }
);

export function DynamicMapWrapper(props: MapWrapperProps) {
  return <MapComponentWithNoSSR {...props} />;
}