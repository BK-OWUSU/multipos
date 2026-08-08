"use client";

import * as React from "react";
import { 
  KeyRound, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit3, 
  ShieldCheck, 
  LogOut,
  Store,
  Briefcase,
  Laptop
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { User } from "@/types/auth/auth";
import { PasswordChangeModal } from "./PasswordChangeModalComponent";

interface UserProfilePageProps {
  user: User;
  onEditProfile?: () => void;
  onPasswordChange?: () => void;
  onLogout?: () => void;
}

export default function UserProfile({ user, onEditProfile, onPasswordChange, onLogout }: UserProfilePageProps) {
     const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(user.needsPasswordChange); 
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans">
        <p className="text-sm text-slate-500">Loading user profile...</p>
      </div>
    );
  }

  // Helper to compute user initials for the avatar
  const getInitials = (name: string) => {
    return (name || "User")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full space-y-6 p-6 lg:p-8 bg-slate-50/50 min-h-screen font-sans">

            {/* 2. High-Priority Password Change Alert Banner */}
      {user.needsPasswordChange && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">Security Action Required</h2>
              <p className="text-xs text-amber-700">
                Your account requires a mandatory password update before proceeding with standard clinical operations.
              </p>
            </div>
          </div>
          <Button 
            onClick={onPasswordChange}
            size="sm" 
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0"
          >
            Update Password Now
          </Button>
        </div>
      )}  
      
      {/* 1. Profile Header Component */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <div className="h-28 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 pt-6 relative">
          <div className="absolute -bottom-8 left-6">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md bg-blue-950 text-white font-bold text-xl flex items-center justify-center">
              <AvatarFallback className="bg-blue-900 text-white text-xl w-full h-full flex items-center justify-center">
                {user.imageUrl ? (
                  <Image src={user.imageUrl} width={80} height={80} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.fullName)
                )}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-12 pb-6 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* User Metadata */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user.fullName}</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  EMP ID: {user.employeeId}
                </span>
                <span>•</span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {user.role.name}
                </span>
                <span>•</span>
                <span className="text-slate-600 font-medium">
                  Business: {user.business.name} ({user.business.currencySymbol})
                </span>
              </div>
            </div>

            {/* Quick Action Group */}
            <div className="flex items-center gap-2.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEditProfile}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg h-9"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={()=> setIsPasswordModalOpen(!user.needsPasswordChange)}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg h-9"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Change Password
              </Button>
            </div>
            <PasswordChangeModal 
                isOpen={isPasswordModalOpen}
                userId={user.id}
                isMandatory={user.needsPasswordChange}
                onSuccess={() => {
                    setIsPasswordModalOpen(false);
                    if (onLogout) {
                        onLogout();
                    }
                }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Personal & Employment Details (2-Column structure) */}
        <Card className="lg:col-span-2 bg-white border-slate-200/80 shadow-xs rounded-2xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900">Personal & Employment Records</CardTitle>
            <CardDescription className="text-xs text-slate-500">Verified credentials, contact channels, and employment history</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
              </span>
              <p className="text-sm font-semibold text-slate-800 break-all">{user.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Designation / Title
              </span>
              <p className="text-sm font-semibold text-slate-800">{user.designation || "Not specified"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> Residential Address
              </span>
              <p className="text-sm font-semibold text-slate-800">{user.address || "Not specified"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date of Birth
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Hire Date
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {user.hireDate ? new Date(user.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-slate-400" /> Last Active Session
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {user.session?.lastLoginAt 
                  ? new Date(user.session.lastLoginAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                  : user.session?.currentLoginAt 
                    ? new Date(user.session.currentLoginAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                    : "Active Now"}
              </p>
            </div>

          </CardContent>
        </Card>

        {/* 3. Current Workspace & Assigned Shops Section */}
        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900">Workspace & Shops</CardTitle>
              <CardDescription className="text-xs text-slate-500">Active POS branch and branch access list</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Current Shop */}
              {user.currentShop ? (
                <div className="p-4 rounded-xl border bg-blue-50/30 border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-900 text-white">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{user.currentShop.name || "Active Shop"}</h2>
                        <span className="text-[10px] font-mono text-slate-500">SLUG: {user.currentShop.shopSlug}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px]">
                      Current
                    </Badge>
                  </div>
                  {user.currentShop.address && (
                    <p className="text-xs text-slate-600 flex items-center gap-1 pt-1 border-t border-blue-100/60">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {user.currentShop.address}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1 text-center">
                  <h3 className="text-xs font-bold text-amber-900">No Active Shop Selected</h3>
                  <p className="text-[11px] text-amber-700">Please switch to a specific branch to perform sales or inventory operations.</p>
                </div>
              )}

              {/* Assigned Shops List Summary */}
              {user.assignedShops && user.assignedShops.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Branches ({user.assignedShops.length})</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {user.assignedShops.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-medium text-slate-800 truncate">{item.shop.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{item.shop.shopSlug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </div>

          {/* Action Center Footer */}
          <CardContent className="pt-0 pb-6 border-t border-slate-100 mt-4">
            <div className="pt-4 space-y-2">
              <Button 
                variant="destructive" 
                onClick={onLogout}
                className="w-full text-xs font-semibold rounded-lg h-9 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" /> Log Out
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}