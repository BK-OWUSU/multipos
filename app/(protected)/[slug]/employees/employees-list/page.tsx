"use client"
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import TableMain from "@/components/reusables/table/TableMain";
import { useParams, useRouter } from "next/navigation";
import hasAccess from "@/lib/accessPermissionSecurity";
import { GenericModal } from "@/components/reusables/GenericModal";
import AddEmployeeForm from "./AddEmployeeForm";
import GenericExcelBulkImport from "@/components/reusables/GenericExcelBulkImport";
import { employeeImportConfig } from "@/lib/configs/employee-config";
import { Users2, PersonStanding, UserCheck, ShieldAlert, Upload, Shield } from "lucide-react";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import CustomButton from "@/components/reusables/CustomButton";
import { useRoleStore } from "@/store/rolesStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { employeeColumns, EmployeeTableMeta } from "@/components/tablesColumnDef/business/employeeColumns";
import { AppResponse, Employee } from "@/types/auth/auth";
import { toggleMultipleUser } from "@/lib/actions/business/employeesActions";
import ManageEmployeeShopsSheet from "./ManageEmployeeShopsSheet";
import { useShopStore } from "@/store/shopStore";
import { AppSheet } from "@/components/reusables/AppSheet";
import { Button } from "@/components/ui/button";

export default function EmployeeList() {
  // Stores
  const { roles, fetchRoles } = useRoleStore();
  const { currentSlug, user } = useAuthStore();
  const { employees, loading, fetchEmployees } = useEmployeeStore();
    const { fetchShops, shops } = useShopStore();

  const router = useRouter();
  const { slug } = useParams();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [width, setWidth] = useState("sm:max-w-137.5")
  //Employee shop selection states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAppSheetOpen, setAppIsSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Fetching Roles
  useEffect(() => {
    if (roles.length === 0) fetchRoles();
    fetchEmployees();
    fetchShops();
  }, [fetchRoles, roles.length, fetchEmployees,fetchShops]);


  const handleOpenManageShops = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsSheetOpen(true);
  };

  const handleOpenEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAppIsSheetOpen(true)
  }

  // Stats calculated from REAL database data
  const stats = useMemo(() => {
    const empList = employees || [];
    const active = empList.filter(e => e.isActive).length;
    const admins = empList.filter(e => e.role?.name.toLowerCase().includes("admin")).length;
    const hasSystemAccess = empList.filter(e => e.hasSystemAccess).length;
    
    return [
      { label: "Total Staff", value: empList.length, icon: Users2, color: "text-blue-800" },
      { label: "Active", value: active, icon: UserCheck, color: "text-green-600" },
      { label: "With System Access", value: hasSystemAccess, icon: Shield, color: "text-blue-600" },
      { label: "Admins", value: admins, icon: ShieldAlert, color: "text-purple-600" },
    ];
  }, [employees]);
  
  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  const handleMultipleDelete = async (ids: string[]): Promise<AppResponse> => {
    return {
      success: true,
      message: `Delete ${ids.length} records`
    } as AppResponse;
  };

  if (!user || !hasAccess(user, "dashboard")) {
    return <div className="p-10 text-center">Unauthorized</div>;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 max-h-screen p-1">
      {/* Header Section */}
      <div className="w-full space-y-4">
        <h1 className="text-base text-blue-950 md:text-2xl font-semibold flex items-center gap-2 uppercase tracking-tight">
          Staff <PersonStanding className="h-7 w-7 border-2 border-blue-950 p-1 rounded-full" />
        </h1>

       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 min-w-0">
          <h1 className="text-gray-500 text-sm md:text-base">Manage your staff members</h1>

          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            <Button onClick={()=> setAppIsSheetOpen(true)}>Add Employee</Button>

            {/* Bulk Import Modal */}
            <GenericModal
              width={width}
              header="Bulk Employee Import"
              description="Import multiple employees from a CSV file"
              isOpen={isBulkImportOpen}
              onOpenChange={()=> {
                setIsBulkImportOpen(prev => !prev);
                setWidth("sm:max-w-137.5"); // Reset width when modal is closed
              }}
              triggerBtn={
                <CustomButton
                  // className="border-green-700 text-green-700 font-bold"
                  text="Bulk Import"
                  // variant="outline"
                  customVariant="primary"
                  icon={<Upload className="mr-2 h-4 w-4" />}
                />
              }
            >
              <GenericExcelBulkImport
                config={employeeImportConfig}
                additionalPayload={{ businessId: user.business.id }}
                onSuccess={(result) => {
                  setIsBulkImportOpen(false);
                  fetchEmployees();
                  setWidth("sm:max-w-137.5");
                }}
                onCancel={() => {
                  setIsBulkImportOpen(false);
                  setWidth("sm:max-w-137.5");
                }}
                onImportParsedSuccess={()=> {
                  setWidth("sm:max-w-max");                  
                }}
              />
            </GenericModal>
          </div>
        </header>
      </div>

      {/* Stats Grid */}
      <article className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
      <div className="bg-white rounded-xl h-fit shadow-sm border overflow-x-auto w-full max-w-full">
        <TableMain
          columns={employeeColumns}
          data={employees || []}
          searchKey="firstName"
          columnVisibilityFilter={true}
          placeholder="Search by name, email , role, etc..."
          loading={loading}
          onActionSuccess={() => fetchEmployees()}
          handleMultipleToggleStatus={toggleMultipleUser}
          handleMultipleDelete={handleMultipleDelete}

          meta={{
          onManageShops: handleOpenManageShops,
          onEditEmployee: handleOpenEditEmployee,
        } as EmployeeTableMeta}
        />
      </div>

      <ManageEmployeeShopsSheet 
        key={selectedEmployee?.id || "empty-sheet"}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        employee={selectedEmployee}
        allShops={shops}
        onSuccess={() => {
          // Re-triggers data synchronization across table lists upon mutation completion
          fetchEmployees(); 
        }}
      />

     <AppSheet
      title="Add New Employee"
      isOpen = {isAppSheetOpen}
      maxWidth="lg"
      onClose={()=> setAppIsSheetOpen(false)}
     >
     <AddEmployeeForm
        onSuccess={() => {
          setAppIsSheetOpen(false);
          fetchEmployees();
        }}
        initialData={selectedEmployee || undefined}
        roles={roles}
        shops={shops}
      />
     </AppSheet>
    </div>
  );
}