import React from 'react';
import Image from 'next/image';
import { 
  User, Mail, Shield, ShieldCheck, Calendar, IdCard, 
  Briefcase, Store, Building2, Edit3, Monitor, LogOut, 
  ChevronRight, Key, Info, ArrowLeftRight, History 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  // Mock data structuralized from image_767982.jpg
  const userProfile = {
    name: "John Doe",
    email: "john.doe@example.com",
    isEmailVerified: true,
    employeeId: "EMP-000123",
    joinedOn: "Mar 12, 2024",
    currentBusiness: "Green Valley Store",
    businessSlug: "green-valley-store",
    role: "Cashier",
    assignedShop: "Main Outlet",
    currentSession: {
      since: "May 7, 2026 2:36 PM (Local Time)",
      ip: "::1",
      device: "Chrome 147.0.0.0 on Windows 10"
    },
    lastSession: {
      time: "May 6, 2026 8:42 PM",
      logoutTime: "May 6, 2026 10:15 PM",
      ip: "192.168.1.25",
      device: "Chrome 146.0.0.0 on Windows 10"
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-screen font-sans text-slate-600 antialiased">
      
      {/* ─── SECTION 1: HEADER USER PROFILE HERO CARD ────────────────────── */}
      <Card className="bg-white border-slate-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Left Block: Avatar & Base Information */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto">
            <div className="relative group cursor-pointer">
              <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                <AvatarImage src="/imgs/avatar-placeholder.png" alt={userProfile.name} className="object-cover" />
                <AvatarFallback className="bg-blue-50 text-blue-900 font-bold text-xl">JD</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-500 transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-center sm:text-left space-y-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{userProfile.name}</h1>
                <p className="text-sm text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  {userProfile.email}
                </p>
              </div>

              {userProfile.isEmailVerified && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-50 font-semibold gap-1 px-2.5 py-0.5 rounded-full text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                  Email Verified
                </Badge>
              )}

              {/* Badges Matrix */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                  <IdCard className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Employee ID</span>
                    <span className="font-mono text-slate-700 font-bold">{userProfile.employeeId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Joined On</span>
                    <span className="text-slate-700 font-bold">{userProfile.joinedOn}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Role & Location Tenant Matrix */}
          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-3 lg:min-w-[280px] bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Current Business</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{userProfile.currentBusiness}</p>
                <p className="text-[11px] text-slate-400 font-mono leading-none">{userProfile.businessSlug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Role</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{userProfile.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg shrink-0">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Assigned Shop</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{userProfile.assignedShop}</p>
              </div>
            </div>
          </div>

          {/* Edit Profile Floating Action Trigger */}
          <div className="absolute top-4 right-4 sm:static w-full sm:w-auto flex justify-end">
            <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 font-semibold text-slate-700 border-slate-200/80 shadow-sm gap-1.5 h-9">
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* ─── SECTION 2: GRID CORE BODY CONTENT CONTROLS ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COMPARTMENT: SESSION TRACKER INFO */}
        <Card className="bg-white border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              
              {/* Active Sub-card Stream Wrapper */}
              <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-800">Current Session</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">Logged in</span>
                </div>
                
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p><span className="text-slate-400 font-medium">Since:</span> <span className="font-semibold text-slate-700">{userProfile.currentSession.since}</span></p>
                  <p><span className="text-slate-400 font-medium">IP Address:</span> <span className="font-mono bg-white/60 px-1 border border-emerald-100/50 rounded text-slate-700 font-semibold">{userProfile.currentSession.ip}</span></p>
                  <p className="pt-0.5"><span className="text-slate-400 block font-medium mb-0.5">Device / Browser</span> <span className="text-slate-700 font-medium break-all">{userProfile.currentSession.device}</span></p>
                </div>
              </div>

              {/* Historic Node Log */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <History className="h-3.5 w-3.5" />
                  <span>Last Active Instance</span>
                </div>
                
                <div className="border border-slate-100 rounded-xl p-4 text-xs space-y-2.5 bg-slate-50/30">
                  <div className="flex justify-between"><span className="text-slate-400">Last Session</span><span className="font-semibold text-slate-700">{userProfile.lastSession.time}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Logout Time</span><span className="font-semibold text-slate-700">{userProfile.lastSession.logoutTime}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">IP Address</span><span className="font-mono font-semibold text-slate-700">{userProfile.lastSession.ip}</span></div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-slate-400 block font-medium mb-0.5">Device / Browser</span>
                    <span className="text-slate-600 font-medium">{userProfile.lastSession.device}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button variant="outline" className="w-full justify-between text-xs font-bold text-slate-600 hover:text-slate-900 border-slate-200/80 bg-white shadow-sm h-10 group">
              <span>View All Login History</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* RIGHT COMPARTMENT: ROUTING CONTROLS MATRIX & ACTIONS */}
        <div className="space-y-6">
          
          {/* Security Navigation Link Trays */}
          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Change Password</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Preferences</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manage email notifications</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Active Sessions</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Manage your active login sessions</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </button>

            </CardContent>
          </Card>

          {/* Volatile Account Actions Block */}
          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="h-4 w-4 text-rose-500 rotate-180" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/40 border border-rose-100 hover:bg-rose-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-950">Logout from All Devices</p>
                    <p className="text-[11px] text-rose-600/80 mt-0.5">Sign out from all active sessions</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ─── SECTION 3: BOTTOM DESCRIPTOR INFO TRAY ────────────────────── */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 items-start">
          <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 shadow-sm shadow-blue-200">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">About MultiPOs</h4>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              You can access multiple businesses based on the permissions granted to your unique credentials account profile.
            </p>
          </div>
        </div>
        
        <Button size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-semibold text-xs shadow-sm gap-1.5 h-9 shrink-0 w-full sm:w-auto">
          <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
          Switch Business
        </Button>
      </div>

      {/* ─── SECTION 4: FOOTER META RIGHTS ────────────────────── */}
      <footer className="text-center pt-2 pb-4">
        <p className="text-[11px] font-medium text-slate-400">
          &copy; 2026 MultiPOs. All rights reserved.
        </p>
      </footer>

    </div>
  );
}