"use client";

import { useEffect, useState } from "react";
import { 
  Store, 
  Plus, 
  Search, 
  Users, 
  Package, 
  Coins, 
  MoreHorizontal, 
  Edit2, 
  Copy, 
  Info,
  ExternalLink
} from "lucide-react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ShopSwitcher from "@/components/shop-switcher";
import { DynamicMapWrapper } from "@/components/reusables/map/DynamicMapWrapper";
import { useShopStore } from "@/store/shopStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import CurrencyFormatter from "@/components/reusables/CurrencyFormter";
import { toast } from "sonner";
import EditShopSheet from "../add-shop/EditShopSheet";

const TABS_CONFIG = ["General", "Employees", "Inventory", "POS Settings", "Receipt Settings", "Taxes", "Cash Registers", "Audit Logs"];

export default function ManageShopsDashboard() {
  //STORES
  const { fetchShops, shops } = useShopStore();
    const user = useAuthStore((state) => state.user);
    const businessSlug = user?.business.slug;
    const createShopPath = `/${businessSlug}/shops/add-shop`;
    const router = useRouter();
  
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  //USE STATES
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("General");
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Resolve the selected shop on the fly during render to prevent cascading hooks errors
  const selectedShop = shops.find(s => s.id === selectedShopId) || shops[0];

  // Crash-proof database property item filtering
  const filteredShops = shops.filter(shop => {
    const matchesName = shop.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = shop.region ? shop.region.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesSearch = matchesName || matchesRegion;

    if (filter === "Active") return matchesSearch && shop.isActive === true;
    if (filter === "Inactive") return matchesSearch && shop.isActive === false;
    if (filter === "Deleted") return matchesSearch && shop.isDeleted === true;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 text-slate-900">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shops</h1>
          <p className="text-sm text-muted-foreground">Manage all your business locations and properties.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <ShopSwitcher shops={shops || []}  createShopPath={createShopPath}/>
          </div>
          <Button onClick={() => router.push(createShopPath)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11 sm:h-10 font-bold text-xs sm:text-sm shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Shop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SHOP LIST CONTAINER */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col h-full min-h-150">
          <div className="p-5 space-y-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search shops..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white rounded-xl h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Filter Navigation Pills */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100/80">
              {["All", "Active", "Inactive", "Deleted"].map((type) => {
                const count = (() => {
                  if (type === "All") return shops.length;
                  if (type === "Active") return shops.filter(s => s.isActive === true).length;
                  if (type === "Inactive") return shops.filter(s => s.isActive === false).length;
                  if (type === "Deleted") return shops.filter(s => s.isDeleted === true).length;
                  return 0;
                })();

                const isCurrentFilter = filter === type;
                
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(type)}
                    className={`text-xs rounded-lg px-3 py-1.5 font-bold flex-1 transition-all ${
                      isCurrentFilter 
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40" 
                        : "text-slate-500 hover:bg-slate-100/60"
                    }`}
                  >
                    {type} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Scrollable Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {filteredShops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <Card 
                  key={shop.id}
                  onClick={() => setSelectedShopId(shop.id)}
                  className={`cursor-pointer transition-all rounded-xl border ${
                    isSelected 
                      ? "border-indigo-600 ring-1 ring-indigo-600/20 bg-indigo-50/20" 
                      : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        shop.isActive === true
                          ? "bg-white text-indigo-600 border-indigo-100/80" 
                          : "bg-white text-slate-400 border-slate-100"
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{shop.name}</h4>
                          {/* 🟢 Boolean text fallback applied */}
                          <Badge className={`text-[10px] font-bold px-1.5 py-0 rounded-md tracking-wide shrink-0 ${
                            shop.isActive === true ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600"
                          }`}>
                            {shop.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate">{shop.region || "No Region Specified"}</p>
                      </div>
                    </div>

                    {/* Data Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1 text-center py-2 my-3 border-t border-b border-slate-100 bg-white/60 rounded-xl">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shop?._count?.currentEmployees || 0}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Employees</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shop?._count?.inventories || 0}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Products</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 truncate px-1">
                          {<CurrencyFormatter amount = {(shop?.todaySalesTotal || 0)}/>}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Sales</span>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1 hover:text-slate-900"><Edit2 className="w-3 h-3" /> Manage</span>
                      <span className="flex items-center gap-1 hover:text-slate-900"><Coins className="w-3 h-3" /> View Sales</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* RIGHT COLUMN: DETAIL AREA */}
        <Card className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {selectedShop ? (
            <>
              {/* Top Hero Layout */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">{selectedShop?.name}</h2>
                      {/* 🟢 Boolean text fallback applied */}
                      <Badge className={selectedShop?.isActive === true ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600"}>
                        {selectedShop?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedShop?.region || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditOpen(true)} 
                    className="h-9 rounded-xl border-slate-200"
                    >Edit Shop
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50">Deactivate</Button>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">Delete Shop</Button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 border-b border-slate-100 bg-white">
                  <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start overflow-x-auto rounded-none w-full flex">
                    {TABS_CONFIG.map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="data-[state=active]:text-blue-800 data-[state=active]:border-b-3 data-[state=active]:border-b-blue-800 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Workspace Canvas */}
                <div className="p-6">
                  {activeTab === "General" ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* General Information Data Card */}
                        <Card className="border-slate-100 rounded-2xl shadow-none">
                          <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                              <h3 className="font-bold text-slate-900 text-sm">General Information</h3>
                              <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setIsEditOpen(true)} 
                                  className="h-7 px-2.5 text-xs rounded-lg text-slate-400 border-slate-200">
                                  Edit
                              </Button>
                            </div>

                            <div className="space-y-3 text-xs font-medium">
                              {[
                                { label: "Shop Name", value: selectedShop.name },
                                { label: "Shop Slug", value: selectedShop.slug, code: true },
                                { label: "Phone Number", value: selectedShop.phone || "N/A" },
                                { label: "Address", value: `${selectedShop.address || "N/A"}` },
                                { label: "GPA", value: `${selectedShop.gpsAddress || "N/A"}` },
                                { label: "Region", value: selectedShop.region || "N/A" },
                                { label: "City", value: selectedShop.city || "N/A" },
                                { label: "Opening Time", value: selectedShop.openingTime || "N/A" },
                                { label: "Closing Time", value: selectedShop.closingTime || "N/A" },
                              ].map((item, idx) => (
                                <div key={idx} className="flex justify-between py-0.5 items-start">
                                  <span className="text-slate-400">{item.label}</span>
                                  <span className={`text-slate-900 font-semibold text-right max-w-47.5 ${item.code ? "font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded" : ""}`}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                              <Separator className="my-2 bg-slate-50" />
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Status</span>
                                <span className={`inline-flex items-center gap-1.5 font-bold ${selectedShop.isActive ? "text-emerald-600" : "text-slate-500"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedShop.isActive ? "bg-emerald-500" : "bg-slate-400"}`} /> 
                                  {selectedShop.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Created At</span>
                                <span className="text-slate-600 font-semibold">
                                  {selectedShop.createdAt ? new Date(selectedShop.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Geolocation Map Layout Card */}
                        <Card className="border-slate-100 rounded-2xl shadow-none flex flex-col justify-between">
                          <CardContent className="p-5 space-y-4 w-full">
                            <div className="pb-2 border-b border-slate-50">
                              <h3 className="font-bold text-slate-900 text-sm">Location</h3>
                            </div>

                            <div>
                              <DynamicMapWrapper 
                                latitude={selectedShop.latitude ? Number(selectedShop.latitude) : 0}
                                longitude={selectedShop.longitude ? Number(selectedShop.longitude) : 0}
                                readOnly={true}
                              />
                            </div>

                            <div className="space-y-3 pt-1 text-xs font-medium">
                              <div>
                                <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Address</span>
                                <div className="flex items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                                  <span className="text-slate-700 font-semibold text-[11px] truncate">{selectedShop.address || "N/A"}, {selectedShop.region || "N/A"}</span>
                                  <Button
                                     onClick={()=> {
                                      window.navigator.clipboard.writeText(selectedShop?.address || "");
                                      toast.success("Shop address copied to clipboard")
                                    }} 
                                    variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>

                              <div>
                                <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">GPS Coordinates</span>
                                <div className="flex items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                                  <span className="text-slate-700 font-mono text-[11px] truncate">{selectedShop.gpsAddress || "N/A"}</span>
                                  <Button
                                     onClick={()=> {
                                      window.navigator.clipboard.writeText(selectedShop?.gpsAddress || "");
                                      toast.success("GPS copied to clipboard")
                                    }} 
                                    variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>        
                              <div>
                                <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Shop ID</span>
                                <div className="flex items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                                  <span className="text-slate-700 font-mono text-[11px] truncate">{selectedShop.id}</span>
                                  <Button
                                    onClick={()=> {
                                      window.navigator.clipboard.writeText(selectedShop.id);
                                      toast.success("Shop ID copied to clipboard")
                                    }}
                                    variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Operational Bottom Metrics Panels */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { title: "Employees", icon: Users, value: selectedShop?._count?.currentEmployees || 0, link: "Manage Employees →" },
                          { title: "Products", icon: Package, value: selectedShop?._count?.inventories || 0, link: "Manage Inventory →" },
                          { title: "Today's Sales", icon: Coins, value: <CurrencyFormatter amount = {selectedShop?.todaySalesTotal || 0}/>, label: `${selectedShop.salesGrowth || "0.0%"} vs yesterday` },
                          { title: "Cash Register", icon: Store, value: selectedShop?.cashRegister?.status || "Closed", label: `Since ${selectedShop?.cashRegister?.since || "N/A"}` },
                        ].map((card, i) => {
                          const IconComp = card.icon;
                          return (
                            <Card key={i} className="border-slate-100 rounded-2xl bg-slate-50/40 shadow-none flex flex-col justify-between h-32">
                              <CardContent className="p-4 flex flex-col justify-between h-full w-full">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                                  <div className="p-1.5 rounded-xl bg-white border border-slate-100 text-slate-700">
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                </div>
                                <div>
                                  <span className={`block text-xl font-black tracking-tight ${card.title === "Cash Register" && card.value === "Open" ? "text-emerald-600" : "text-slate-900"}`}>
                                    {card.value}
                                  </span>
                                  {card.link ? (
                                    <button className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 block text-left">
                                      {card.link}
                                    </button>
                                  ) : (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block ${
                                      card.title === "Today's Sales" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 font-medium"
                                    }`}>
                                      {card.label}
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                      <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">{activeTab} Section Content</p>
                      <p className="text-xs text-slate-400 mt-1">Data parameters related to configuration updates appear here.</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-24">
              <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No stores loaded into local database environment context</p>
            </div>
          )}

          {/* Context Footer Information Strip Banner */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-start gap-3 text-xs leading-relaxed text-slate-500 mt-auto">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="font-medium">
              <span className="font-bold text-slate-700">About Shops:</span> Shops represent independent localized business operational environments. You can manage roles, routing configurations, hardware terminal links, and isolated stock sets unique to each store container. 
              <a href="#" className="text-indigo-600 font-bold hover:underline ml-1 inline-flex items-center gap-0.5">Learn More <ExternalLink className="w-3 h-3" /></a>
            </div>
          </div>
        </Card>

      </div>
      {/* ── SLIDE-OVER SHEET FORM PANEL ────────────────────────── */}
      <EditShopSheet 
        shop={selectedShop}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={()=>  fetchShops()}
      />
    </div>
  );
}