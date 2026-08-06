"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { Users, Award, Gift, ShieldAlert, Plus, ChevronRight, Settings
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useEffect, useState } from "react";
import { AppSheet } from "@/components/reusables/AppSheet";
import { RewardForm } from "./LoyaltyReward";
import { LoyaltySettingsForm } from "./LoyaltySettings";
import { LoyaltyTierForm } from "./LoyaltyTiers";
import { useLoyaltyStore } from "@/store/loyaltyStore";
import TableMain from "@/components/reusables/table/TableMain";
import { loyaltyRewardColumn, LoyaltyRewardTableMeta } from "@/components/tablesColumnDef/business/customer-loyalty/loyaltyRewardColumnsDef";
import { LoyaltyConfigurationWithRelations, LoyaltyRewardsCatalogResponse } from "@/types/loyalty";
import { loyaltyMembersColumns } from "@/components/tablesColumnDef/business/customer-loyalty/loyaltyMembersColumns";
import { loyaltyHistoryColumns, LoyaltyHistoryTableMeta, LoyaltyHistoryTransaction } from "@/components/tablesColumnDef/business/customer-loyalty/loyaltyHistoryColumns";
import { LoyaltyTierConfigItem, loyaltyTiersColumns, LoyaltyTierTableMeta } from "@/components/tablesColumnDef/business/customer-loyalty/loyaltyTiersColumns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShopStore } from "@/store/shopStore";
import { LoyaltyLedgerDetails } from "@/components/detials-components/LoyaltyLedgerDetails";
import { LoyaltyTierDetails } from "@/components/detials-components/LoyaltyTierDetails";

type TabType = "Members"|"Transactions"|"Rewards"|"Tiers";


export default function CustomerLoyaltyDashboard() {
  //Stores
  const {
    loading,
    fetchLoyaltyConfigs, loyaltyConfigs,
    fetchLoyaltyRewards, loyaltyRewards,
    fetchLoyaltyTiers, loyaltyTiers,
    fetchLoyaltyMembersList, loyaltyMembersList,
    fetchLoyaltyHistory, loyaltyHistory,
    fetchLoyaltyMetrics, loyaltyMetrics
  } = useLoyaltyStore()
  const {fetchShops, shops} = useShopStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [isLoyaltyTiersOpen, setILoyaltyTiersOpen] = useState(false);
  const [isEditLoyaltyTierOpen, setIsEditLoyaltyTierOpen] = useState(false);
  const [isLoyaltyHistoryDetailsOpen, setLoyaltyHistoryDetailsOpen] = useState(false);
  const [isLoyaltyTierDetailsOpen, setLoyaltyTierDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Members")

  const [selectedLoyaltyReward, setSelectedLoyaltyReward] = useState<LoyaltyRewardsCatalogResponse[number] | null>()
  const [selectedLoyaltyHistory, setSelectedLoyaltyHistory] = useState<LoyaltyHistoryTransaction | null>()
  const [selectedLoyaltyTier, setSelectedLoyaltyTier] = useState<LoyaltyTierConfigItem | null>()

  useEffect(()=>{
    fetchLoyaltyConfigs();
    fetchLoyaltyRewards();
    fetchLoyaltyTiers();
    fetchLoyaltyMembersList();
    fetchLoyaltyHistory();
    fetchLoyaltyMetrics();
    fetchShops();
  },[fetchLoyaltyConfigs, fetchLoyaltyHistory, fetchLoyaltyMembersList, fetchLoyaltyMetrics, fetchLoyaltyRewards, fetchLoyaltyTiers,fetchShops])


  // Calculate active membership percentage safely
const total = loyaltyMetrics?.totalMembers ?? 0;
const active = loyaltyMetrics?.activeMembersCount ?? 0;
const activePercentage = total > 0 ? ((active / total) * 100).toFixed(1) : "0.0";

const metricCards = [
    {
      title: "Total Members",
      value: (loyaltyMetrics?.totalMembers ?? 0).toLocaleString(),
      sub: "All registered profiles",
      icon: Users,
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      title: "Total Points",
      value: (loyaltyMetrics?.totalPoints ?? 0).toLocaleString(),
      sub: "Current system wallet balance",
      icon: Award,
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Redeemed Rewards",
      value: (loyaltyMetrics?.redeemedRewardsCount ?? 0).toLocaleString(),
      sub: "Total claims finalized",
      icon: Gift,
      iconColor: "text-amber-500 bg-amber-50",
    },
    {
      title: "Active Members",
      value: active.toLocaleString(),
      sub: `${activePercentage}% of total members`,
      icon: ShieldAlert,
      iconColor: "text-blue-700 bg-blue-50",
    },
];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans">
      
      {/* HEADER SECTION PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">Customer Loyalty</h1>
          <p className="text-slate-500 text-xs font-medium">Manage customer loyalty points, tiers and rewards rewards matrices smoothly.</p>
        </div>
        <div className="flex items-center gap-2.5">
          
          {/* CONTROL SWITCH TRIGGER */}
          <Button 
            variant="outline" 
            onClick={() => setIsSettingsOpen(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 font-medium transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Loyalty Settings
          </Button>

          <Button
            onClick = {()=> setIsAddRewardOpen(true)} 
            className="bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs py-4 px-4 gap-1.5 rounded-xl shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Reward
          </Button>
        </div>
      </div>

      {/* METRICS SUMMARY CARD RIBBON GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card, i) => (
          <Card key={i} className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${card.iconColor}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] font-bold tracking-tight uppercase block">
                  {card.title}
                </span>
                
                {loading ? (
                  <div className="h-8 w-24 bg-slate-100 animate-pulse rounded my-1" />
                ) : (
                  <span className="text-2xl font-bold text-blue-950 block tracking-tight">
                    {card.value}
                  </span>
                )}

                {card.sub && (
                  <span className="text-[11px] font-medium text-slate-400 block truncate">
                    {card.sub}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CORE INTERACTIVE TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">        
        {/* LEFT COMPONENT COLUMN: MAIN TABS & DATA ARRAYS */}
        <div className="lg:col-span-9 bg-white h-full rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as TabType)}
            className="w-full">
            <div className="border-b border-slate-100 px-6 pt-4 bg-white">
              <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start overflow-x-auto rounded-none w-full flex scrollbar-none">
                {["Members", "Transactions", "Rewards", "Tiers"].map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className="data-[state=active]:text-blue-800 data-[state=active]:border-b-3 data-[state=active]:border-b-blue-800 rounded-none border-b-2 border-transparent bg-transparent py-3.5 px-3 text-xs font-bold text-slate-400 transition-all whitespace-nowrap"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="Members" className="m-0 p-6 space-y-5">
              {/* RENDER MEMBERS TABLE */}
              <div className="rounded-xl border border-slate-100 overflow-x-auto">
              <TableMain
                columns={loyaltyMembersColumns} 
                data={loyaltyMembersList || []}
                searchKey="fullName"
                columnVisibilityFilter={true}
                placeholder="Search by customer name..."
                loading={loading}
               />
              </div>
            </TabsContent>
             {/* LOYALTY TRANSACTIONS  */}
            <TabsContent value="Transactions" className="m-0 p-6 space-y-5">
              {/* RENDER MEMBERS TABLE */}
              <div className="rounded-xl border border-slate-100 overflow-x-auto">
                <TableMain
                columns={loyaltyHistoryColumns} 
                data={loyaltyHistory || []}
                searchKey="fullName"
                columnVisibilityFilter={true}
                placeholder="Search by customer name..."
                loading={loading}
                meta={{
                  onViewLoyaltyHistory(loyaltyHistory) {
                    // Implement the logic to view loyalty history details
                    setLoyaltyHistoryDetailsOpen(true);
                    setSelectedLoyaltyHistory(loyaltyHistory);
                  }
                } as LoyaltyHistoryTableMeta}
               />
              </div>
            </TabsContent>

            {/* LOYALTY REWARDS */}
            <TabsContent value="Rewards" className="m-0 p-6 space-y-5">
              {/* RENDER TABLE */}
              <div className="rounded-xl border border-slate-100 overflow-x-auto">
               <TableMain
                columns={loyaltyRewardColumn}
                data={loyaltyRewards || []}
                searchKey="fullName"
                columnVisibilityFilter={true}
                placeholder="Search by customer name..."
                loading={loading}

                meta={{
                  onEditLoyaltyReward(reward) {
                    setSelectedLoyaltyReward(reward)
                    setIsAddRewardOpen(true)
                  },
                } as LoyaltyRewardTableMeta}
               />
              </div>
            </TabsContent>

            {/* LOYALTY TIERS */}
            <TabsContent value="Tiers" className="m-0 p-6 space-y-5">
              {/* RENDER TIERS TABLE */}
              <div className="rounded-xl border border-slate-100 overflow-x-auto">
                 <TableMain
                  columns={loyaltyTiersColumns} 
                  data={loyaltyTiers || []}
                  searchKey="fullName"
                  columnVisibilityFilter={true}
                  placeholder="Search by customer name..."
                  loading={loading}
                  meta={{
                    onEditLoyaltyTier(loyaltyTier) {
                      setSelectedLoyaltyTier(loyaltyTier);
                      setIsEditLoyaltyTierOpen(true);
                    },
                    onViewLoyaltyTierDetails(loyaltyTier) {
                      setSelectedLoyaltyTier(loyaltyTier);
                      setLoyaltyTierDetailsOpen(true);
                    }
                  } as LoyaltyTierTableMeta}
               />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COMPONENT COLUMN: SIDEBAR PERIPHERALS PANEL TIERS */}
        <div className="lg:col-span-3 space-y-6">
         {/* LOYALTY TIERS PROFILE CARD PANEL */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-bold text-blue-950 text-xs tracking-tight">
                Loyalty Tiers
              </CardTitle>
              <Button
                onClick={() => setILoyaltyTiersOpen(true)} 
                variant="link" 
               className="bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs py-4 px-2 gap-1.5 rounded-xl shadow-sm transition-colors">
                <Plus className="w-4 h-4" />Add Tiers
              </Button>
            </CardHeader>
            
            <CardContent className="p-5 pt-0 space-y-3">
              {/* Fallback skeleton state if data is still loading */}
              {loading && !loyaltyTiers?.length && (
                <div className="text-xs text-slate-400 py-4 text-center animate-pulse">
                  Loading live tier configurations...
                </div>
              )}

              {/* Empty state safeguard */}
              {!loading && (!loyaltyTiers || loyaltyTiers.length === 0) && (
                <div className="text-xs text-slate-400 py-4 text-center italic">
                  No loyalty tiers configured yet.
                </div>
              )}

              {/* Live Data Render */}
              {loyaltyTiers && [...loyaltyTiers]
                .sort((a, b) => a.minimumLifetimePoints - b.minimumLifetimePoints)
                .map((tier, idx, sortedArr) => {
                  const nextTier = sortedArr[idx + 1];
                  const startPoints = tier.minimumLifetimePoints.toLocaleString();
                  
                  const rangeLabel = nextTier 
                    ? `${startPoints} - ${(nextTier.minimumLifetimePoints - 1).toLocaleString()} pts`
                    : `${startPoints}+ pts`;

                  // 1. DYNAMIC ICON LOOKUP: 
                  // Safely map string value (e.g. "star") to Lucide component, fallback to "Award"
                  const iconName = (tier.icon || "award") as keyof typeof LucideIcons;
                  // Capitalize first letter if your DB saves lowercase "star" instead of "Star"
                  const capitalizedIconName = (iconName.charAt(0).toUpperCase() + iconName.slice(1)) as keyof typeof LucideIcons;
                  
                  const IconComponent = (LucideIcons[capitalizedIconName] || LucideIcons.Award) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

                  return (
                    <div 
                      key={tier.id} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border border-slate-50/50 hover:bg-slate-50/50 transition-colors ${
                        !tier.isActive ? "opacity-55 select-none" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Visual indicator using the colored icon instead of raw text */}
                        <div 
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/4"
                          style={{ 
                            backgroundColor: tier.color ? `${tier.color}15` : "#F3F4F6" 
                          }}
                        >
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: tier.color || "#475569" }} 
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-950">{tier.name}</span>
                            {tier.isDefault && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-medium px-1.5 py-0.5 rounded border border-slate-200/60 leading-none">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 leading-none">{rangeLabel}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  );
                })}
            </CardContent>
           </Card>

        {/* TOP REWARDS PROFILE CARD PANEL */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-bold text-blue-950 text-xs tracking-tight">
                  Top Rewards
                </CardTitle>
                <Button
                  onClick={() => setActiveTab("Rewards")} 
                  variant="link" 
                  className="p-0 text-[11px] font-bold text-blue-800 hover:text-blue-900 h-auto"
                >
                  View All →
                </Button>
              </CardHeader>
              
              <CardContent className="p-5 pt-0 space-y-3">
                {/* Fallback loading state */}
                {loading && !loyaltyRewards?.length && (
                  <div className="text-xs text-slate-400 py-4 text-center animate-pulse">
                    Loading rewards catalog...
                  </div>
                )}

                {/* Empty database state safeguard */}
                {!loading && (!loyaltyRewards || loyaltyRewards.filter(r => !r.isDeleted && r.isActive).length === 0) && (
                  <div className="text-xs text-slate-400 py-4 text-center italic">
                    No active rewards found.
                  </div>
                )}

                {/* Live Data Render */}
                {loyaltyRewards && [...loyaltyRewards]
                  .filter((reward) => !reward.isDeleted && reward.isActive)
                  // Sort by highest usage/redemption history count
                  .sort((a, b) => (b._count?.histories || 0) - (a._count?.histories || 0))
                  // Limit to the top 3 items matching image_63c5dc.png
                  .slice(0, 3)
                  .map((reward) => {
                    // Strict mapping based on your database enum RewardType
                    let badgeColor = "bg-blue-50 text-blue-700"; // Fallback for PRODUCT & FREE_SERVICE
                    
                    switch (reward.rewardType) {
                      case "PERCENTAGE":
                        badgeColor = "bg-purple-50 text-purple-700";
                        break;
                      case "FIXED_AMOUNT":
                        badgeColor = "bg-emerald-50 text-emerald-700";
                        break;
                      case "PRODUCT":
                      case "FREE_SERVICE":
                      default:
                        badgeColor = "bg-blue-50 text-blue-700";
                        break;
                    }

                    return (
                      <div 
                        key={reward.id} 
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50/50 hover:bg-slate-50/50 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 tracking-tight">
                          {reward.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${badgeColor}`}>
                          {reward.pointsRequired.toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

        </div>

      </div>


      {/* DYNAMIC RULES WRAPPER PRESET */}
      <AppSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Loyalty Configuration"
        description="Define membership rule settings and calculation ratios for your multi-tenant POS workspace."
        maxWidth="lg"
      >
        <LoyaltySettingsForm
          shops={shops} 
          initialData={
            loyaltyConfigs 
              ? {
                  isEnabled: loyaltyConfigs.isEnabled,
                  applyToAllShops: loyaltyConfigs.applyToAllShops,
                  targetShops: (loyaltyConfigs as LoyaltyConfigurationWithRelations).targetShops?.map((ts) => ({
                    shopId: ts.shopId
                  })) ?? [],
                  amountRequiredPerPoint: Number(loyaltyConfigs.amountRequiredPerPoint),
                  pointValue: Number(loyaltyConfigs.pointValue),
                  minimumPointsToRedeem: loyaltyConfigs.minimumPointsToRedeem,
                  maxRedeemPercentage: loyaltyConfigs.maxRedeemPercentage,
                  pointsExpiryMonths: loyaltyConfigs.pointsExpiryMonths,
                  earnOnPromotions: loyaltyConfigs.earnOnPromotions,
                }
              : undefined 
          }
          onSuccess={() => { 
            setIsSettingsOpen(false);
            fetchLoyaltyConfigs();
          }} 
        />
      </AppSheet>


      {/* DRAWER B: Itemized Perks Catalog Upload Form */}
      <AppSheet
        isOpen={isAddRewardOpen}
        onClose={() => setIsAddRewardOpen(false)}
        title="Edit Reward Perk"
        description="Customize a physical product, voucher item, or custom service milestone incentive for your loyalty catalog."
        maxWidth="lg"
      >
        <RewardForm onSuccess={() => {
          fetchLoyaltyRewards();
          setIsAddRewardOpen(false)
          }}
          initialData={ 
            selectedLoyaltyReward ?
            {
              id: selectedLoyaltyReward.id,
              title: selectedLoyaltyReward.title,
              description: selectedLoyaltyReward.description,
              pointsRequired: Number(selectedLoyaltyReward.pointsRequired),
              rewardType: selectedLoyaltyReward.rewardType,
              rewardValue: Number(selectedLoyaltyReward.rewardValue),
            }:
            undefined 
          } 
          />
      </AppSheet>

      {/* DRAWER B: Itemized Perks Catalog Upload Form */}
      <AppSheet
        isOpen={isLoyaltyTiersOpen}
        onClose={() => setILoyaltyTiersOpen(false)}
        title="Create New Reward Perk"
        description="Add a physical product, voucher item, or custom service milestone incentive to your loyalty catalog."
        maxWidth="lg"
      >
        <LoyaltyTierForm onSuccess={() =>{ 
          fetchLoyaltyTiers();
          setILoyaltyTiersOpen(false)
          }} />
      </AppSheet>
      {/* DETAILS DRAWER FOR LOYALTY HISTORY  */}
      <AppSheet
        isOpen={isLoyaltyHistoryDetailsOpen}
        onClose={() => setLoyaltyHistoryDetailsOpen(false)}
        title="Loyalty Ledger Audit Trail"
        description="Deep-dive audit logs for loyalty balances, adjustments, rewards, and transaction rollbacks."
        maxWidth="lg"
      >
        {selectedLoyaltyHistory ? (
          <LoyaltyLedgerDetails transaction={selectedLoyaltyHistory} />
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No ledger event selected.
          </div>
        )}
      </AppSheet>

    {/* DRAWERS FOR LOYALTY TIERS */}
      <AppSheet
        isOpen={isEditLoyaltyTierOpen}
        onClose={() => setIsEditLoyaltyTierOpen(false)}
        title="Edit Loyalty Tier"
        description="Customize a Loyalty Tier"
        maxWidth="lg"
      >
        <LoyaltyTierForm
          onSuccess={() => { 
            fetchLoyaltyTiers();
            setIsEditLoyaltyTierOpen(false);
          }}
          initialData={
            selectedLoyaltyTier ? {
              id: selectedLoyaltyTier.id,
              name: selectedLoyaltyTier.name,
              description: selectedLoyaltyTier.description ?? undefined,
              minimumLifetimePoints: Number(selectedLoyaltyTier.minimumLifetimePoints),
              color: selectedLoyaltyTier.color ?? undefined,
              icon: selectedLoyaltyTier.icon ?? undefined,
              isActive: selectedLoyaltyTier.isActive,
              isDefault: selectedLoyaltyTier.isDefault,
              priority: Number(selectedLoyaltyTier.priority), 
              earnMultiplier: Number(selectedLoyaltyTier.earnMultiplier), 
              redemptionMultiplier: Number(selectedLoyaltyTier.redemptionMultiplier),
            } : undefined 
          }
        />
      </AppSheet>

      <AppSheet
        isOpen={isLoyaltyTierDetailsOpen}
        onClose={() => setLoyaltyTierDetailsOpen(false)}
        title="Loyalty Tier Settings Profile"
        description="Audit milestone thresholds, points generation boost indices, and member populations matching this configuration profile."
        maxWidth="lg"
      >
        {selectedLoyaltyTier ? (
          <LoyaltyTierDetails tier={selectedLoyaltyTier} />
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No tier profile configuration selected.
          </div>
        )}
      </AppSheet>
    </div>
  );
}