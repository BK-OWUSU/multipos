import { formatSessionDate, parseUserAgent, formatIP } from "@/lib/utils";
import { Session } from "@/types/auth/auth";
import { Monitor, Globe } from "lucide-react";

export function SessionInfo({ 
  currentLoginAt, 
  lastLoginAt,
  logoutAt, 
  ipAddress, 
  userAgent 
}: Session) {
  const current = formatSessionDate(currentLoginAt);
  const lastLogin = formatSessionDate(lastLoginAt);
  const lastLogout = formatSessionDate(logoutAt);

  return (
    <div className="space-y-3">
      {/* Date Info */}
      <div className="space-y-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Current Session</span>
          <span className="text-xs text-slate-700 font-medium">{current.relative}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Last Login</span>
          <span className="text-xs text-slate-600">{lastLogin.relative}</span>
        </div> 
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Last Logout</span>
          <span className="text-xs text-slate-600">{lastLogout.relative}</span>
        </div>
      </div>

       <p className="text-xs text-slate-400 mt-2 italic">
        Precise login: {current.precise}
      </p>

      {/* Device Info */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <Monitor className="text-slate-400" size={12} />
          <span className="text-[11px] text-slate-600 truncate">
            {parseUserAgent(userAgent)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="text-slate-400" size={12} />
          <span className="text-[11px] text-slate-600">
            {formatIP(ipAddress)}
          </span>
        </div>
      </div>
    </div>
  );
}