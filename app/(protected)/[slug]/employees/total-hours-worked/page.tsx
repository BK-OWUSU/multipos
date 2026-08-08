"use client";

import * as React from "react";
import { 
  Clock, 
  Users, 
  CalendarDays, 
  Store, 
  TrendingUp, 
  Download, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  MoreVertical, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface TimeCardEntry {
  id: string;
  employee: {
    name: string;
    employeeId: string;
    imageUrl?: string;
  };
  shop: {
    name: string;
  };
  date: string;
  day: string;
  clockIn: string;
  clockOut: string;
  totalHours: string;
  status: "ACTIVE" | "COMPLETED";
  notes?: string;
}

const mockTimeCards: TimeCardEntry[] = [
  {
    id: "1",
    employee: { name: "John Mensah", employeeId: "EMP-1001" },
    shop: { name: "Accra Main Branch" },
    date: "May 31, 2024",
    day: "Fri",
    clockIn: "08:05 AM",
    clockOut: "05:32 PM",
    totalHours: "9.45",
    status: "ACTIVE",
    notes: "End of month stock count"
  },
  {
    id: "2",
    employee: { name: "Abena Boateng", employeeId: "EMP-1002" },
    shop: { name: "Tema Community 18" },
    date: "May 31, 2024",
    day: "Fri",
    clockIn: "08:15 AM",
    clockOut: "05:00 PM",
    totalHours: "8.75",
    status: "ACTIVE"
  },
  {
    id: "3",
    employee: { name: "Kwame Asare", employeeId: "EMP-1003" },
    shop: { name: "Kumasi Branch" },
    date: "May 31, 2024",
    day: "Fri",
    clockIn: "09:00 AM",
    clockOut: "06:15 PM",
    totalHours: "9.25",
    status: "ACTIVE",
    notes: "Customer rush"
  },
  {
    id: "4",
    employee: { name: "Akosua Gyasi", employeeId: "EMP-1004" },
    shop: { name: "Accra Mall Branch" },
    date: "May 31, 2024",
    day: "Fri",
    clockIn: "08:30 AM",
    clockOut: "04:30 PM",
    totalHours: "8.00",
    status: "ACTIVE"
  },
  {
    id: "5",
    employee: { name: "Kofi Adom", employeeId: "EMP-1005" },
    shop: { name: "Takoradi Branch" },
    date: "May 30, 2024",
    day: "Thu",
    clockIn: "08:10 AM",
    clockOut: "05:10 PM",
    totalHours: "9.00",
    status: "ACTIVE"
  },
  {
    id: "6",
    employee: { name: "Ama Serwaa", employeeId: "EMP-1006" },
    shop: { name: "Madina Branch" },
    date: "May 30, 2024",
    day: "Thu",
    clockIn: "09:05 AM",
    clockOut: "05:05 PM",
    totalHours: "8.00",
    status: "COMPLETED",
    notes: "Half day"
  }
];

export default function TotalHoursWorkedPage() {
  const [activeTab, setActiveTab] = React.useState<"all" | "summary">("all");

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="w-full space-y-6 p-6 lg:p-8 bg-slate-50/50 min-h-screen font-sans">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Total Hours Worked</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and review total working hours for employees across all shops.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-9 text-xs border-slate-200 text-slate-700 bg-white">
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Export
          </Button>
          <Button size="sm" className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Time Card
          </Button>
        </div>
      </div>

      {/* 2. Top Analytics Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Hours</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Clock className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">1,248.75 <span className="text-xs font-normal text-slate-500">hrs</span></div>
            <span className="text-[11px] text-slate-400">All Time</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Employees</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Users className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">42</div>
            <span className="text-[11px] text-emerald-600 font-medium">Active Employees</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg. Hours / Day</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><CalendarDays className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">8.23 <span className="text-xs font-normal text-slate-500">hrs</span></div>
            <span className="text-[11px] text-slate-400">Across Employees</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Shops</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Store className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">8</div>
            <span className="text-[11px] text-slate-400">Active Shops</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">This Month</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">184.50 <span className="text-xs font-normal text-slate-500">hrs</span></div>
            <span className="text-[11px] text-slate-400">Total Hours</span>
          </div>
        </Card>

      </div>

      {/* 3. Filters Toolbar Card */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Date Range Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Date Range</label>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800">
              <span>May 1, 2024 - May 31, 2024</span>
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Employee Dropdown Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Employee</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none">
              <option>All Employees</option>
            </select>
          </div>

          {/* Shop Dropdown Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Shop</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none">
              <option>All Shops</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Status</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none">
              <option>All Status</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 pt-1 sm:pt-0">
            <Button variant="outline" className="flex-1 h-9 text-xs border-slate-200 text-slate-700 bg-white rounded-xl">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Filters
            </Button>
            <Button className="flex-1 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
              Apply
            </Button>
          </div>

        </div>

        {/* Info Notification Sub-Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-800 text-xs">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Showing total hours worked for the selected date range and filters.</span>
        </div>
      </Card>

      {/* 4. Tab Navigation & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab("all")}
            className={`text-xs font-semibold pb-1 transition-all border-b-2 ${
              activeTab === "all" 
                ? "text-blue-600 border-blue-600" 
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            All Time Cards
          </button>
          <button 
            onClick={() => setActiveTab("summary")}
            className={`text-xs font-semibold pb-1 transition-all border-b-2 ${
              activeTab === "summary" 
                ? "text-blue-600 border-blue-600" 
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            Summary by Employee
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search employee or notes..." 
              className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-xl"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs border-slate-200 text-slate-700 bg-white rounded-xl shrink-0">
            Column
          </Button>
        </div>
      </div>

      {/* 5. Data Table Component */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/70 border-b border-slate-100">
            <TableRow>
              <TableHead className="w-12 text-[11px] font-bold text-slate-500">#</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Employee</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Shop</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Date</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Clock In</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Clock Out</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Total Hours</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Status</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500">Notes</TableHead>
              <TableHead className="w-12 text-right text-[11px] font-bold text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTimeCards.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                
                <TableCell className="text-xs font-medium text-slate-500">{index + 1}</TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                      <AvatarFallback className="bg-blue-900 text-white text-[10px] font-bold">
                        {getInitials(item.employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{item.employee.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.employee.employeeId}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{item.shop.name}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-xs font-medium text-slate-800">{item.date}</div>
                  <div className="text-[10px] text-slate-400">{item.day}</div>
                </TableCell>

                <TableCell className="text-xs font-medium text-slate-700">{item.clockIn}</TableCell>
                
                <TableCell className="text-xs font-medium text-slate-700">{item.clockOut}</TableCell>

                <TableCell className="text-xs font-bold text-blue-600">{item.totalHours}</TableCell>

                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-slate-500 truncate max-w-[150px]">
                  {item.notes || "—"}
                </TableCell>

                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 6. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <span className="text-xs text-slate-500">Showing 1 to 10 of 142 time cards</span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 mr-4">
              <span>10 / page</span>
            </div>

            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 bg-white" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button size="sm" className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs">
              1
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
              2
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
              3
            </Button>
            <span className="text-xs text-slate-400 px-1">...</span>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
              15
            </Button>

            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}