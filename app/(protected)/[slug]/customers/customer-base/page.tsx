"use client"
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import TableMain from "@/components/reusables/table/TableMain";
import { useParams, useRouter } from "next/navigation";
import hasAccess from "@/lib/accessPermissionSecurity";
import { GenericModal } from "@/components/reusables/GenericModal";
import CustomerForm from "./customerForm"; // You'll need to create this
import GenericExcelBulkImport from "@/components/reusables/GenericExcelBulkImport";
import { customerImportConfig } from "@/lib/configs/customer-config"; // Create this config
import { 
  Plus, 
  Users, 
  UserPlus, 
  CreditCard, 
  Trophy, 
  Upload, 
  Handshake 
} from "lucide-react";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import CustomButton from "@/components/reusables/CustomButton";
import { useCustomerStore } from "@/store/customerStore";
import { customerColumns } from "@/components/tablesColumnDef/business/customerColumns";
import { AppResponse } from "@/types/auth/auth";

export default function CustomerList() {
  const router = useRouter();
  const { slug } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [width, setWidth] = useState("sm:max-w-137.5");
  
  // Stores
  const { currentSlug, user } = useAuthStore();
  const { customers, loading, fetchCustomers } = useCustomerStore();

  // Fetching Data
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Stats calculated from REAL database data
  const stats = useMemo(() => {
    const custList = customers || [];
    const creditCustomers = custList.filter(c => c.isCreditCustomer).length;
    const highLoyalty = custList.filter(c => (c.loyaltyWallet?.availablePoints || 0) > 500).length;
    const recentJoiners = custList.filter(c => {
        const joinDate = new Date(c.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joinDate > thirtyDaysAgo;
    }).length;
    
    return [
      { label: "Total Customers", value: custList.length, icon: Users, color: "text-blue-800" },
      { label: "Credit Active", value: creditCustomers, icon: CreditCard, color: "text-emerald-600" },
      { label: "Loyalty Tier", value: highLoyalty, icon: Trophy, color: "text-amber-600" },
      { label: "New (30d)", value: recentJoiners, icon: UserPlus, color: "text-purple-600" },
    ];
  }, [customers]);
  
  // Security Redirects
  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  const handleMultipleDelete = async (ids: string[]): Promise<AppResponse> => {
    // Implement multiple soft-delete logic here if needed
    return {
      success: true,
      message: `Archived ${ids.length} customers successfully`
    } as AppResponse;
  };

  if (!user || !hasAccess(user, "dashboard")) {
    return <div className="p-10 text-center">Unauthorized</div>;
  }

  return (
    <div className="h-fit min-h-screen bg-gray-5 rounded-2xl flex flex-col gap-4 p-4">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-base text-blue-950 md:text-2xl font-semibold flex items-center gap-2 uppercase tracking-tight">
          Customers <Handshake className="h-7 w-7 border-2 border-blue-950 p-1 rounded-full" />
        </h1>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-gray-500 text-sm md:text-base">Manage your customer relationships and credit limits</h1>

          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            {/* Add Customer Modal */}
            <GenericModal
              header="Register New Customer"
              description="Enter customer contact and credit details."
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              triggerBtn={
                <CustomButton
                  className="border-blue-900 text-blue-900 font-bold"
                  text="New Customer"
                  variant="outline"
                  customVariant="secondary"
                  icon={<Plus className="mr-2 h-4 w-4" />}
                />
              }
            >
              <CustomerForm
                onSuccess={() => {
                  setIsModalOpen(false);
                  fetchCustomers();
                }}
              />
            </GenericModal>

            {/* Bulk Import Modal */}
            <GenericModal
              width={width}
              header="Bulk Customer Import"
              description="Import your client list from a CSV file"
              isOpen={isBulkImportOpen}
              onOpenChange={() => {
                setIsBulkImportOpen(prev => !prev);
                setWidth("sm:max-w-137.5");
              }}
              triggerBtn={
                <CustomButton
                  text="Bulk Import"
                  customVariant="primary"
                  icon={<Upload className="mr-2 h-4 w-4" />}
                />
              }
            >
              <GenericExcelBulkImport
                config={customerImportConfig}
                additionalPayload={{ businessId: user.business.id }}
                onSuccess={() => {
                  setIsBulkImportOpen(false);
                  fetchCustomers();
                  setWidth("sm:max-w-137.5");
                }}
                onCancel={() => {
                  setIsBulkImportOpen(false);
                  setWidth("sm:max-w-137.5");
                }}
                onImportParsedSuccess={() => setWidth("sm:max-w-max")}
              />
            </GenericModal>
          </div>
        </header>
      </div>

      {/* Stats Grid */}
      <article className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="w-full h-28 shadow-lg border-none p-2">
            <CardHeader className="p-2 pb-2">
              <CardDescription className="flex gap-2 items-center text-gray-600">
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                <span className="text-xs md:text-sm font-medium uppercase truncate">{stat.label}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <p className="text-xl md:text-3xl font-bold text-blue-950">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </article>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <TableMain
          columns={customerColumns}
          data={customers || []}
          searchKey="fullName"
          columnVisibilityFilter={true}
          placeholder="Search by customer name..."
          loading={loading}
          onActionSuccess={() => fetchCustomers()}
          handleMultipleDelete={handleMultipleDelete}
        />
      </div>
    </div>
  );
}