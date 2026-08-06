"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button";

interface SessionContextType {
  resetSessionTimer: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const SESSION_DURATION = 30 * 60 * 1000; 
const WARNING_THRESHOLD = 2 * 60 * 1000; 
const ACTIVITY_DEBOUNCE = 30  * 1000;     

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
   const {logoutExpiration, logout} = useAuthStore();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  
  const expiresAtRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);

const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem("sessionNotify")
      localStorage.removeItem("brandTipsDismissed")
      localStorage.removeItem("categoryTipsDismissed")
      router.push("/login")
    } catch (error: unknown ) {
      console.error("Logout failed", error)
    } 

  }

  const handleExpiredLogout = useCallback( async() => {
    setShowWarning(false);
    await logoutExpiration()
    localStorage.removeItem("sessionNotify")
    localStorage.removeItem("brandTipsDismissed")
    localStorage.removeItem("categoryTipsDismissed")
    router.push("/login?reason=timeout");
  }, [router,logoutExpiration]);

  // ✅ FIX 1: Wrap core logic inside a useCallback so React knows it's an event method decoupled from the render phase
  const resetSessionTimerWithTime = useCallback(async (currentTime: number) => {
    try {
      const res = await fetch("/api/auth/ping", { method: "POST" });
      
      if (res.ok) {
        expiresAtRef.current = currentTime + SESSION_DURATION;
        lastSyncRef.current = currentTime;
        setTimeLeft(SESSION_DURATION);
        setShowWarning(false);
      } else if (res.status === 401) {
        handleExpiredLogout();
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
    }
  }, [handleExpiredLogout]);

  // ✅ FIX 2: Memoize context wrapper with useCallback to abstract the 'Date.now()' execution cleanly
  const resetSessionTimer = useCallback(async () => {
    await resetSessionTimerWithTime(Date.now());
  }, [resetSessionTimerWithTime]);

  // 2. Initialize Timestamps and Track Background Countdown
  useEffect(() => {
    const now = Date.now();
    expiresAtRef.current = now + SESSION_DURATION;
    lastSyncRef.current = now;

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const remaining = expiresAtRef.current - currentNow;

      if (remaining <= 0) {
        clearInterval(interval);
        handleExpiredLogout();
      } else {
        setTimeLeft(remaining);
        if (remaining <= WARNING_THRESHOLD) {
          setShowWarning(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handleExpiredLogout]);

  // 3. Silent Auto-Reset on Normal User Activity
  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      
      if (showWarning) return;

      if (lastSyncRef.current !== 0 && now - lastSyncRef.current > ACTIVITY_DEBOUNCE) {
        resetSessionTimerWithTime(now);
      }
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
    };
  }, [showWarning, resetSessionTimerWithTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <SessionContext.Provider value={{ resetSessionTimer }}>
      {children}
      
      {showWarning && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h2 style={modalStyles.title}>Session Expiring Soon</h2>
            <p style={modalStyles.text}>
              Your POS session will time out due to inactivity in{" "}
              <strong style={modalStyles.countdown}>{formatTime(timeLeft)}</strong>.
            </p>
            <div style={modalStyles.buttonContainer}>
              {/* ✅ FIX 3: Use the memoized wrapper function directly for clean layout binding */}
              <Button onClick={resetSessionTimer} style={modalStyles.extendButton}>
                Keep Working
              </Button>
              <Button onClick={handleLogout} style={modalStyles.logoutButton}>
                Log Out Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}

export const useSessionTimer = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSessionTimer must be used within a SessionTimeoutProvider");
  return context;
};

const modalStyles = {
  overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  modal: { backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "100%", maxWidth: "400px", textAlign: "center" as const, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  title: { fontSize: "20px", fontWeight: "bold", marginBottom: "12px", color: "#111827" },
  text: { fontSize: "14px", color: "#4b5563", marginBottom: "20px" },
  countdown: { color: "#dc2626", fontSize: "16px" },
  buttonContainer: { display: "flex", gap: "12px", justifyContent: "center" },
  extendButton: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  logoutButton: { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" }
};
