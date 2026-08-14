import { AppResponse } from "@/types/auth/auth";
import { prisma } from "@/lib/dbHelper";
import { AccountType } from "@/generated/prisma/enums";
import { CreateEmployeeSchema, createEmployeeSchema, UpdateEmployeeShopsInput } from "@/types/schema/auth.schema";
import { generateNextCustomId, generateRandomPassword } from "@/lib/utils";
import { hashPassword } from "@/lib/auths-functions";
import { sendTempPasswordEmail } from "@/lib/email";
import { EmployeeValidatedArray, EmployeeImportPayload } from "@/lib/configs/employee-config";
import { UserCreateManyInput } from "@/generated/prisma/models";
import { setCurrentShop, setCurrentShopInput } from "@/types/schema/shop.schema";

export class EmployeeService { 


static async createEmployee(
    data: CreateEmployeeSchema, 
    userId: string, 
    employeeId: string, 
    businessId: string
  ) {
    try {
      // 1. Structural schema parsing & structural safety validation
      const validatedData = createEmployeeSchema.parse(data);

      // 2. Multi-tenant uniqueness checkpoint verification
      const existingEmployee = await prisma.employee.findUnique({
        where: {
          email_businessId: {
            email: validatedData.email.toLowerCase().trim(),
            businessId: businessId
          }
        }
      });

      if (existingEmployee) {
        return { 
          error: "This email is already registered to an employee in your business.", 
          success: false, 
          status: 400 
        };
      }

      // Generate credential parameters prior to entering atomic execution block
      const tempPassword = generateRandomPassword();
      const hashed = await hashPassword(tempPassword);

      // 3. EXECUTE SAFELY BOUNDED ATOMIC TRANSACTION TRANSACTION
      const result = await prisma.$transaction(async (tx) => {
        
        // A. Multi-tenant Custom Sequence Counter Generator Context
        const employeeIdGen = await generateNextCustomId({
          tx,
          businessId, 
          sequenceType: "EMPLOYEE",
          prefix: "EMP"
        });

        // B. Atomic Document Provisioning (Merging parameters right away)
        const employee = await tx.employee.create({
          data: {
            customId: employeeIdGen,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email.toLowerCase().trim(),
            phone: validatedData.phone,
            imageUrl: validatedData.imageUrl || null,
            fileKey: validatedData.fileKey || null,
            designation: validatedData.designation || null,
            address: validatedData.address || null,
            dateOfBirth: validatedData.dateOfBirth || null,
            roleId: validatedData.roleId,
            currentShopId: validatedData.currentShopId || null,
            businessId: businessId,
            hasSystemAccess: validatedData.hasSystemAccess, // 👈 Directly apply correct initial state flag
          }
        });

        // C. 👉 CRITICAL FIX: Explicitly append to Junction table mapping array 
        if (validatedData.currentShopId) {
          await tx.employeeShop.create({
            data: {
              employeeId: employee.id,
              shopId: validatedData.currentShopId,
              businessId: businessId,
              assignedBy: employeeId // Tracking creator trace footprint
            }
          });
        }

        // D. Provision Account Node profile only if active toggle parameter matches true
        let newUser = null;
        if (validatedData.hasSystemAccess) {
          newUser = await tx.user.create({
            data: {
              employeeId: employee.id, 
              password: hashed,
              isVerified: false,
              accountType: AccountType.EMPLOYEE,
              needsPasswordChange: true,
              accessGrantedBy: employeeId,
              accessGrantedAt: new Date(),
              createdAt: new Date(),
            },
          });
        }

        // E. Audit Tracking Pipeline Block
        await tx.auditLog.create({
          data: {
            action: "CREATE",
            entity: "EMPLOYEE",
            entityId: employee.id,
            userId: userId,
            businessId: businessId,
            logType: "CREATE_EMPLOYEE",
            oldValue: "None",
            details: `Staff profile created (${employee.firstName} ${employee.lastName}). System Access: ${validatedData.hasSystemAccess}`
          }
        });
        
        // Fetch matching organizational tenant mapping metadata block
        const business = await tx.business.findUnique({ where: { id: businessId } });
        if (!business) throw new Error("Business tenant context validation failure.");

        return { employee, businessSlug: business.slug, newUser };
      });

      // 4. BEYOND DB TRANSACTION BOUNDARIES: Dispatch External Mail Triggers
      if (validatedData.hasSystemAccess) {
        try {
          await sendTempPasswordEmail(
            result.employee.email, 
            tempPassword, 
            result.employee.firstName,
            result.businessSlug
          );

          console.log("Email: ", result.employee.email)
          console.log("Password: ",  tempPassword)
        } catch (err) {
          // Soft-fail: Log execution break but do not discard successfully committed records
          console.error("ASYNC_ONBOARDING_MAIL_DISPATCH_FAILURE:", err);
        }
      }

      return { 
        success: true, 
        message: validatedData.hasSystemAccess ? 
          `Employee ${result.employee.firstName} created successfully and onboarding email sent!` : 
          `Employee ${result.employee.firstName} created successfully!`, 
        status: 200 
      };

    } catch (error: unknown) {
      console.error("EMPLOYEE_REGISTRATION_SERVICE_ERROR:", error);
      return { error: "Internal Server Error", success: false, status: 500 };
    }
  }    


//CREATE BULK EMPLOYEES
static async createBulkEmployeesService(
  payload: { data: EmployeeImportPayload[]; [key: string]: unknown },
  userId: string,
  employeeId: string,
  businessId: string,
  businessSlug: string
) {
  try {
    // 1. Validating the incoming data array first
    const validatedData = EmployeeValidatedArray.parse(payload.data);

    if (validatedData.length === 0) {
      return { error: "No employee data provided.", success: false, status: 400 } as AppResponse;
    }

    // 1. Collecting unique Role names from the CSV data
    const roleNamesToLookup = [...new Set(validatedData.map((emp) => emp.role))];

    // 2. Batch fetch Roles
    const rolesInDb = await prisma.role.findMany({
        where: { 
            businessId, 
            name: { in: roleNamesToLookup as string[] } 
        },
        select: { id: true, name: true },
    });
    
    // 3. Create Role Lookup Map
    const roleMap = new Map(rolesInDb.map((r) => [r.name, r.id]));
    
    // 4. Check for existing emails in this business to prevent unique constraint errors
    const existingEmails = await prisma.employee.findMany({
      where: {
        businessId: businessId,
        email: { in: validatedData.map((emp) => emp.email) },
      },
      select: { email: true },
    });

    const existingEmailSet = new Set(existingEmails.map((e) => e.email));

    // 5. Transform validated data
    const newEmployeesData = validatedData
    .filter((emp) => !existingEmailSet.has(emp.email))
    .map((emp) => {
        const roleIdFromName = roleMap.get(emp.role);
        
        if (!roleIdFromName) {
          throw new Error(`Role "${emp.role}" does not exist in this business.`);
        }

        // ✅ FIX: Extract the raw Shop ID value directly from the payload row safely
        const directShopId = (emp.currentShopId && emp.currentShopId !== "" && emp.currentShopId !== "null") ? emp.currentShopId.trim() : null;

        return {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email.toLowerCase(),
          phone: emp.phone || null,
          designation: emp.designation || null,
          address: emp.address || null,
          dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : null,
          businessId: businessId,
          roleId: roleIdFromName,
          currentShopId: directShopId,
          hasSystemAccess: emp.hasSystemAccess || false, 
        };
    });

    if (newEmployeesData.length === 0) {
      return { 
        error: "All provided employees already exist or have invalid roles.", 
        success: false, 
        status: 400 
      } as AppResponse;
    }
  
    const employeesWithAccess = newEmployeesData.filter(emp => emp.hasSystemAccess);
    const UserAccountsRequests = await Promise.all(employeesWithAccess.map(async (emp) => {
        const tempPassword = generateRandomPassword();
        const hashed = await hashPassword(tempPassword);
        return {
            password: hashed,
            firstName: emp.firstName,
            email: emp.email,
            tempPassword
        };
    }));

    //////////////////////////////////////////////////////////////////////////
    // 6. Execute Transaction: Insert Employees and Create Audit Logs
    const result = await prisma.$transaction(async (tx) => {
      // Bulk Insert
 
      const emailsToMapTo = new Map<string, string>();

       const totalImported = await prisma.$transaction(async (tx) => {
           let processedCount = 0;
           for (const employee of newEmployeesData) {
            const employeeIdGen = await generateNextCustomId({tx,businessId, sequenceType: "EMPLOYEE",prefix: "EMP"});
            const createdEmployee = await tx.employee.create({
                data:{
                    customId: employeeIdGen,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email,
                    phone: employee.phone,
                    designation: employee.designation,
                    address: employee.address,
                    dateOfBirth: employee.dateOfBirth,
                    businessId: businessId,
                    roleId: employee.roleId,
                    currentShopId: employee.currentShopId,
                    hasSystemAccess: employee.hasSystemAccess, 
                }
            });

             await tx.auditLog.create({
                    data: {
                        action: "CREATE",
                        entity: "EMPLOYEE",
                        entityId: createdEmployee.id,
                        userId: userId,
                        businessId: businessId,
                        logType: "CREATE_EMPLOYEE_BULK",
                        newValue: `Bulk imported employee: ${createdEmployee.firstName} ${createdEmployee.lastName}`,
                        oldValue: "None",
                        details: `New employee created via bulk import`
                    },
                });

                if (createdEmployee.email) {
                    emailsToMapTo.set(createdEmployee.email.toLowerCase(), createdEmployee.id);
                }
            processedCount++
           }
           return processedCount;
       });
 

     type UserCreateManyInputWithoutID = Omit<UserCreateManyInput, "id">;

     if (UserAccountsRequests.length > 0) {
      // Create User records using the Email-to-ID Map (SAFE)
      const userData = UserAccountsRequests.map((req) => {
        const empId = emailsToMapTo.get(req.email.toLowerCase());
        if (!empId) return null;

        return {
          employeeId: empId,
          password: req.password,
          needsPasswordChange: true,
          isVerified: false,
          accessGrantedBy: employeeId, 
          accessGrantedAt: new Date(),
        };
      }).filter(Boolean) as UserCreateManyInputWithoutID[];

      await tx.user.createMany({ data: userData });

      // Updating Employee hasSystemAccess status
      const employeeIdsToUpdate = userData.map(u => u.employeeId);
      await tx.employee.updateMany({
        where: { id: { in: employeeIdsToUpdate } },
        data: { hasSystemAccess: true }
      });

      // Log Access Grants
      await tx.auditLog.createMany({
        data: employeeIdsToUpdate.map(id => ({
            action: "UPDATE",
            entity: "USER",
            entityId: id,
            userId: userId,
            businessId: businessId,
            logType: "GRANT_ACCESS_BULK",
            newValue: `System access granted via bulk import.`,
            oldValue: "None",
            details: `Temporary password generate and sent to employee`
        }))
      });
    }

    return totalImported;
  });

  Promise.allSettled(UserAccountsRequests.map(req => 
      sendTempPasswordEmail(req.email, req.tempPassword, req.firstName, businessSlug)
  )).catch(err => console.error("Bulk Email Error:", err));

  return {
    success: true,
    message: UserAccountsRequests.length > 0 ? 
      `Successfully imported ${result} employees. Accounts created and emails sent to ${UserAccountsRequests.length} employees.` :
      `Successfully imported ${result} employees.`,
    status: 200,
    redirectTo: `/${businessSlug}/employees_list`,
  } as AppResponse;

  } catch (error: unknown) {
    console.error("BULK_EMPLOYEE_IMPORT_ERROR:", error);
    if (error instanceof Error) {
        return { error: error.message, success: false, status: 400 } as AppResponse;
    }
    return { error: "Failed to import employees. Check your file format.", success: false, status: 500 } as AppResponse;
  }
}


static async updateEmployee(
  targetEmployeeId: string,
  data: CreateEmployeeSchema, 
  userId: string, 
  operatorEmployeeId: string, 
  businessId: string
) {
  try {
    // 1. Structural schema parsing & validation
    const validatedData = createEmployeeSchema.parse(data);

    // 2. Multi-tenant target validation & fetch original record state
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId, businessId: businessId },
      include: { user: true }
    });

    if (!currentEmployee) {
      return { 
        error: "Employee profile not found within your business tenant.", 
        success: false, 
        status: 404 
      };
    }

    // Pre-calculate conditional onboarding parameters in case access is newly granted
    const tempPassword = generateRandomPassword();
    const hashed = await hashPassword(tempPassword);
    let shouldSendOnboardingEmail = false;

    // 3. EXECUTE SAFELY BOUNDED ATOMIC TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Atomic Document Profiling Update
      const updatedEmployee = await tx.employee.update({
        where: { id: targetEmployeeId },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          imageUrl: validatedData.imageUrl || null,
          fileKey: validatedData.fileKey || null,
          designation: validatedData.designation || null,
          address: validatedData.address || null,
          dateOfBirth: validatedData.dateOfBirth || null,
          roleId: validatedData.roleId,
          currentShopId: validatedData.currentShopId || null,
          hasSystemAccess: validatedData.hasSystemAccess,
        }
      });

      // B. Junction Table Synchronization Hook
      if (validatedData.currentShopId) {
        const existingAssignment = await tx.employeeShop.findUnique({
          where: {
            employeeId_shopId: {
              employeeId: targetEmployeeId,
              shopId: validatedData.currentShopId
            }
          }
        });

        // Seed relation seamlessly if this shop link doesn't already exist
        if (!existingAssignment) {
          await tx.employeeShop.create({
            data: {
              employeeId: targetEmployeeId,
              shopId: validatedData.currentShopId,
              businessId: businessId,
              assignedBy: operatorEmployeeId
            }
          });
        }
      }

      // C. Handle System Access Transitions (Grant, Revoke, or No-Op)
      let userActionMessage = "None";

      if (validatedData.hasSystemAccess && !currentEmployee.hasSystemAccess) {
          // CASE: Admin newly granted OR re-granted system access to this employee
          await tx.user.upsert({
            where: { 
              employeeId: targetEmployeeId 
            },
            update: {
              password: hashed,
              isVerified: false,
              accountType: AccountType.EMPLOYEE,
              needsPasswordChange: true,
              isActive: true, // Reactivate the account if it was deactivated
              accessGrantedBy: operatorEmployeeId,
              accessGrantedAt: new Date(),
            },
            create: {
              employeeId: targetEmployeeId,
              password: hashed,
              isVerified: false,
              accountType: AccountType.EMPLOYEE,
              needsPasswordChange: true,
              isActive: true,
              accessGrantedBy: operatorEmployeeId,
              accessGrantedAt: new Date(),
              createdAt: new Date(),
            },
          });
          shouldSendOnboardingEmail = true;
          userActionMessage = "GRANTED_SYSTEM_ACCESS";
        } else if (!validatedData.hasSystemAccess && currentEmployee.hasSystemAccess) {
          // CASE: Admin revoked system access for this employee
          await tx.user.update({
            where: { employeeId: targetEmployeeId },
            data: {
              password: "REVOKED_ACCESS_SUSPENDED_ACCOUNT", 
              isVerified: false,
              needsPasswordChange: true,
              isActive: false, 
            }
          });

          await tx.employee.update({
            where: { id: targetEmployeeId },
            data: {
              hasSystemAccess: false,
            }
          });
          userActionMessage = "REVOKED_SYSTEM_ACCESS";
        }


      // D. Audit Tracking Pipeline Block
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "EMPLOYEE",
          entityId: targetEmployeeId,
          userId: userId,
          businessId: businessId,
          logType: "UPDATE_EMPLOYEE",
          oldValue: JSON.stringify({
            name: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
            hasSystemAccess: currentEmployee.hasSystemAccess,
            currentShopId: currentEmployee.currentShopId
          }),
          details: `Staff profile updated (${updatedEmployee.firstName} ${updatedEmployee.lastName}). System Access Event: ${userActionMessage}`
        }
      });
      
      // Fetch organizational tenant metadata
      const business = await tx.business.findUnique({ where: { id: businessId } });
      if (!business) throw new Error("Business tenant context validation failure.");

      return { employee: updatedEmployee, businessSlug: business.slug };
    });

    // 4. BEYOND DB TRANSACTION BOUNDARIES: Dispatch External Mail Triggers if access was newly granted
    if (shouldSendOnboardingEmail) {
      try {
        await sendTempPasswordEmail(
          result.employee.email, 
          tempPassword, 
          result.employee.firstName,
          result.businessSlug
        );
         console.log("TEMP PASSWORD FRM UPDATE EMPLOYEE: ", tempPassword)
      } catch (err) {
        console.error("ASYNC_UPDATE_ONBOARDING_MAIL_DISPATCH_FAILURE:", err);
      }
    }

    return { 
      success: true, 
      message: shouldSendOnboardingEmail ? 
        `Employee ${result.employee.firstName} updated successfully and onboarding credentials emailed!` : 
        `Employee ${result.employee.firstName} updated successfully!`, 
      status: 200 
    };

  } catch (error: unknown) {
    console.error("EMPLOYEE_UPDATE_SERVICE_ERROR:", error);
    return { error: "Internal Server Error", success: false, status: 500 };
  }
}

//GET EMPLOYEES SERVICE
static async getAllEmployees(businessId: string, userId: string, employeeId: string) {
    try {
        const employees = await prisma.employee.findMany({
            where: {
                businessId: businessId,
                isDeleted: false,
                // Use AND with NOT to ensure we exclude based on multiple specific criteria
                AND: [
                    {
                        NOT: { id: employeeId } // Exclude the specific Employee record of the requester
                    },
                    {
                        NOT: {
                            user: {
                                accountType: AccountType.OWNER
                            }
                        }
                    }
                ]
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                currentShop: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        isVerified: true,
                        needsPasswordChange: true,
                        accountType: true, 
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            employees 
        };

    } catch (error) {
        console.error("GET_EMPLOYEES_SERVICE_ERROR:", error);
        return { 
            success: false, 
            error: "Failed to fetch employees list" 
        };
    }
}

// SOFT DELETE SINGLE EMPLOYEE
static async softDeleteSingleEmployee(
  employeeId: string, 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    if (!employeeId) {
      return { success: false, error: "Employee ID is required", status: 400 } as AppResponse;
    }

    await prisma.$transaction(async (tx) => {
      // 1. FIX: Fetch employee and include their user state snapshot
      const employee = await tx.employee.findFirst({
        where: { 
          id: employeeId, 
          businessId: businessId,
          isDeleted: false 
        },
        include: { user: true }
      });

      if (!employee) {
        throw new Error("Employee not found.");
      }

      // 2. Create Audit Log capturing the snapshot in oldValue
      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "EMPLOYEE",
          entityId: employeeId,
          logType: "SOFT_DELETE_EMPLOYEE",
          oldValue: JSON.stringify(employee),
          userId: userId,
          businessId: businessId,
        },
      });

      // 3. FIX: If they have system access, suspend their User record too
      if (employee.user && employee.user.isActive) {
        await tx.user.update({
          where: { employeeId: employeeId },
          data: {
            password: "REVOKED_ACCESS_DELETED_EMPLOYEE", 
            isVerified: false,
            needsPasswordChange: true,
            isActive: false, // Prevents subsequent active login attempts
          }
        });
      }

      // 4. Update Employee to mark as soft-deleted
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          isDeleted: true,
          isActive: false,
          hasSystemAccess: false, // Update the status flag to match
          deletedAt: new Date(),
        },
      });
    });

    return {
      success: true,
      message: "Employee successfully deleted.",
      redirectTo: `/${businessSlug}/employees_list`,
      status: 200
    } as AppResponse;

  } catch (error) {
    console.error(`EMPLOYEE_SOFT_DELETION_ERROR [ID: ${employeeId}]:`, error);

    if ((error as Error).message === "Employee not found.") {
      return { success: false, error: "Employee not found or already deleted.", status: 404 } as AppResponse;
    }

    return { 
      success: false, 
      error: "Could not delete the employee. They may have active transaction records.", 
      status: 500 
    } as AppResponse;
  }
}


//SOFT DELETE MULTIPLE EMPLOYEES 
static async softDeleteMultipleUserService(ids: string[], userId: string, businessId: string, businessSlug: string) {
  
    try {
        if (!ids || ids.length === 0) {
            return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
        }

        // Using Transaction
        await prisma.$transaction(async (tx) => {
            // 1. FIX: Fetch employees including user account records
            const employeesToDelete = await tx.employee.findMany({
                where: { id: { in: ids }, businessId: businessId },
                include: { user: true }
            });

            if (employeesToDelete.length === 0) {
                throw new Error("No matching employees found.");
            }

            const validEmployeeIds = employeesToDelete.map(emp => emp.id);

            // 2. Audit Log Creation
            await tx.auditLog.createMany({
                data: employeesToDelete.map((employee) => ({
                    action: "DELETE",
                    entity: "EMPLOYEE",
                    entityId: employee.id,
                    logType: "SOFT_DELETE_EMPLOYEE_BULK",
                    oldValue: JSON.stringify(employee),
                    userId: userId,
                    businessId: businessId,
                })),
            });

            // 3. FIX: Suspend system access in bulk for any selected employee who has an active account
            await tx.user.updateMany({
                where: { 
                    employeeId: { in: validEmployeeIds },
                    isActive: true 
                },
                data: {
                    password: "REVOKED_ACCESS_DELETED_EMPLOYEE", 
                    isVerified: false,
                    needsPasswordChange: true,
                    isActive: false, // Disables login access immediately
                }
            });

            // 4. FIX: Use a highly efficient single updateMany instead of map + Promise.all
            await tx.employee.updateMany({
                where: { id: { in: validEmployeeIds } },
                data: {
                    isDeleted: true,
                    isActive: false, // Ensure they are marked inactive in the business
                    hasSystemAccess: false, // Ensure flag aligns with the user row deactivation
                    deletedAt: new Date(),
                },
            });

            return employeesToDelete;
        });

        return {
            success: true,
            message: `Deleted ${ids.length} employees and revoked system access where applicable.`,
            redirectTo: `/${businessSlug}/employees_list`,
            status: 200
        } as AppResponse;
        
    } catch (error) {
        console.log("EMPLOYEE BULK_SOFT_DELETION_ERROR: ", error);
        return { 
            success: false, 
            error: (error as Error).message || "Could not delete employees. They may have active transaction records.",
            status: 400 
        } as AppResponse;
    }
}

// TOGGLE SINGLE EMPLOYEE STATUS
static async toggleSingleEmployeeStatus(
  employeeId: string, 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    if (!employeeId) {
      return { success: false, error: "Employee ID is required", status: 400 } as AppResponse;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. FIX: Find employee cleanly, checking for soft-delete, and include user relation state
      const employee = await tx.employee.findFirst({
        where: { 
          id: employeeId, 
          businessId: businessId, 
          isDeleted: false // Prevent modifying archived entities
        },
        include: {
          user: true // Load the relation data safely
        }
      });

      if (!employee) {
        throw new Error("Employee not found.");
      }

      const nextStatus = !employee.isActive;

      // 2. Update employee status record
      await tx.employee.update({
        where: { id: employeeId },
        data: { isActive: nextStatus },
      });

      // 3. FIX: Sync the User access state if a login profile exists
      if (employee.user) {
        await tx.user.update({
          where: { employeeId: employeeId },
          data: { 
            isActive: nextStatus,
            // Security extra: scramble password slightly if deactivating to kill active sessions
            ...(nextStatus === false && {
              password: "SUSPENDED_VIA_EMPLOYEE_STATUS_TOGGLE",
              isVerified: false,
              needsPasswordChange: true
            })
          }
        });
      }

      // 4. Create Audit Log entry
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "EMPLOYEE",
          entityId: employeeId,
          oldValue: JSON.stringify({ isActive: employee.isActive }),
          newValue: JSON.stringify({ isActive: nextStatus }),
          userId: userId,
          logType: "TOGGLE_EMPLOYEE_STATUS",
          businessId: businessId,
          details: `Toggled status for employee ${employee.firstName + " " + employee.lastName || employeeId} to ${nextStatus ? 'Active' : 'Inactive'}. User row synchronized.`
        },
      });
      return nextStatus;
    });

    return {
      success: true,
      message: `Successfully changed employee status to ${result ? 'Active' : 'Inactive'}.`,
      redirectTo: `/${businessSlug}/employees_list`,
      status: 200
    } as AppResponse;

  } catch (error) {
    console.error(`TOGGLE_EMPLOYEE_STATUS_ERROR [ID: ${employeeId}]:`, error);
    
    if ((error as Error).message === "Employee not found.") {
      return { success: false, error: "Employee not found or archived.", status: 404 } as AppResponse;
    }
    
    return { success: false, error: "Failed to update employee status.", status: 500 } as AppResponse;
  }
}

static async toggleBulkEmployeeStatusService(ids: string[], userId: string, businessId: string, businessSlug: string) {
  try {
    if (!ids || ids.length === 0) {
        return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
    }

    await prisma.$transaction(async (tx) => {
      // 1. FIX: Fetch employees using only businessId and isDeleted constraints, including user state
      const employees = await tx.employee.findMany({
        where: { 
            id: { in: ids }, 
            businessId: businessId,
            isDeleted: false 
        },
        include: { user: true }
      });

      if (employees.length === 0) throw new Error("No employee found.");

      // Distinguish targets into arrays to use high-performance batch updates
      const activatingEmployeeIds: string[] = [];
      const deactivatingEmployeeIds: string[] = [];

      employees.forEach((emp) => {
          if (emp.isActive) {
              deactivatingEmployeeIds.push(emp.id);
          } else {
              activatingEmployeeIds.push(emp.id);
          }
      });

      // 2. Perform Batch Employee Updates (Optimized single execution queries instead of individual map/Promise.all statements)
      if (activatingEmployeeIds.length > 0) {
          await tx.employee.updateMany({
              where: { id: { in: activatingEmployeeIds } },
              data: { isActive: true }
          });

          // Sync User rows to active
          await tx.user.updateMany({
              where: { employeeId: { in: activatingEmployeeIds } },
              data: { isActive: true }
          });
      }

      if (deactivatingEmployeeIds.length > 0) {
          await tx.employee.updateMany({
              where: { id: { in: deactivatingEmployeeIds } },
              data: { isActive: false }
          });

          // Sync User rows to inactive + suspend credentials immediately to break active sessions
          await tx.user.updateMany({
              where: { employeeId: { in: deactivatingEmployeeIds } },
              data: { 
                  isActive: false,
                  password: "SUSPENDED_VIA_BULK_EMPLOYEE_STATUS_TOGGLE",
                  isVerified: false,
                  needsPasswordChange: true
              }
          });
      }

      // 3. Audit Log Creation
      await tx.auditLog.createMany({
        data: employees.map((emp) => ({
          action: "UPDATE",
          entity: "EMPLOYEE",
          entityId: emp.id,
          oldValue: JSON.stringify({ isActive: emp.isActive }),
          newValue: JSON.stringify({ isActive: !emp.isActive }),
          userId: userId,
          businessId: businessId,
          logType: "TOGGLE_EMPLOYEE_STATUS_BULK",
          details: `Bulk status toggled to ${!emp.isActive ? 'Active' : 'Inactive'}. User row synchronized where applicable.`
        })),
      });
    });

    return {
      success: true,
      message: `Successfully updated status for ${ids.length} employees.`,
      redirectTo: `/${businessSlug}/employees_list`,
      status: 200
    } as AppResponse;
  } catch (error) {
    console.error("BULK_STATUS_EMPLOYEES_ERROR:", error);
    return { 
        success: false, 
        error: (error as Error).message || "Failed to update employees.",
        status: 400 
    } as AppResponse;
  }
}


static async grantEmployeeSystemAccess(empId: string, userId: string, employeeId: string, businessId: string, businessSlug: string) {
    try {
        const tempPassword = generateRandomPassword();
        const hashTempPassword = await hashPassword(tempPassword);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch employee and business slug
            const employee = await tx.employee.findFirst({
                where: { id: empId, businessId: businessId },
                include: { business: true, user: true }
            });

            if (!employee) throw new Error("Employee not found.");

            // FIX: Only block if the user account exists AND is active
            if (employee.user && employee.user.isActive) {
                throw new Error("This employee already has system access.");
            }

            // 2. Safely create or reactivate the User record
            const targetUser = await tx.user.upsert({
                where: { 
                    employeeId: employee.id 
                },
                update: {
                    password: hashTempPassword,
                    isVerified: false,
                    needsPasswordChange: true,
                    isActive: true, // Reactivate the suspended account
                    accessGrantedBy: employeeId,
                    accessGrantedAt: new Date(),
                },
                create: {
                    employeeId: employee.id,
                    password: hashTempPassword,
                    accountType: AccountType.EMPLOYEE,
                    needsPasswordChange: true,
                    isVerified: false,
                    isActive: true,
                    accessGrantedBy: employeeId,
                    accessGrantedAt: new Date(),
                    createdAt: new Date(),
                }
            });

            // 3. Update the Employee status flag
            await tx.employee.update({
                where: { id: empId },
                data: { hasSystemAccess: true }
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    action: targetUser.createdAt.getTime() === targetUser.accessGrantedAt.getTime() 
                        ? "GRANT_ACCESS" 
                        : "REACTIVATE_ACCESS", // Accurate audit labeling
                    entity: "USER",
                    entityId: targetUser.id,
                    userId: userId,
                    businessId: businessId,
                    logType: "GRANT_EMPLOYEE_ACCESS",
                    newValue: `System access granted to employee. User ID: ${targetUser.id}`
                }
            });

            return { employee };
        });

        // 5. Send onboarding email
        try {
            await sendTempPasswordEmail(
                result.employee.email, 
                tempPassword, 
                result.employee.firstName,
                businessSlug
            );
            console.log("TEMP PASSWORD FRM GRANT ACESS: ", tempPassword)
        } catch (err) {
            console.error("Email sending failed:", err);
            // Non-blocking catch preserves the database transaction state
        }

        return { 
            success: true, 
            message: `Access granted to ${result.employee.firstName}. Credentials sent to email.`,
            redirectTo: `/${businessSlug}/employees_list`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Grant access error:", error);
        return { success: false, error: (error as Error).message || "Failed to grant access.", status: 400 } as AppResponse;
    }
}


static async revokeEmployeeSystemAccess(empId: string, userId: string, businessId: string, businessSlug: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Verify employee exists and has a user account
            const employee = await tx.employee.findFirst({
                where: { id: empId, businessId: businessId },
                include: { user: true }
            });

            if (!employee) throw new Error("Employee not found.");
            
            // FIX: Block if they have no user row OR if that row is already deactivated
            if (!employee.user || !employee.user.isActive) {
                throw new Error("This employee does not have active system access.");
            }

            // 2. FIX: Soft-delete the User record (Suspends login capabilities safely)
            await tx.user.update({
                where: { employeeId: empId },
                data: {
                    password: "REVOKED_ACCESS_SUSPENDED_ACCOUNT", 
                    isVerified: false,
                    needsPasswordChange: true,
                    isActive: false, 
                }
            });

            // 3. Update the Employee flag
            await tx.employee.update({
                where: { id: empId },
                data: { hasSystemAccess: false }
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    action: "UPDATE",
                    entity: "EMPLOYEE",
                    entityId: empId,
                    userId: userId,
                    businessId: businessId,
                    logType: "REVOKE_EMPLOYEE_ACCESS",
                    newValue: "System access revoked; user record deactivated."
                }
            });
        });

        return { 
            success: true, 
            message: "Access revoked successfully. The employee account has been suspended.",
            redirectTo: `/${businessSlug}/employees_list`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Revoke access error:", error);
        return { success: false, error: (error as Error).message || "Failed to revoke access.", status: 400 } as AppResponse;
    }
}



static async grantBulkEmployeesSystemAccess(employeeIds: string[], userId: string, employeeId: string, businessId: string) {
    try {
        if (!employeeIds || employeeIds.length === 0) {
            return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
        }

        // 1. FIX: Fetch employees including their user accounts to check soft-delete state
        const employees = await prisma.employee.findMany({
            where: { 
                id: { in: employeeIds }, 
                businessId: businessId,
            },
            include: { 
                business: true,
                user: true
            }
        });

        // Filter for employees who truly need access (no user row OR user row is inactive)
        const eligibleEmployees = employees.filter(emp => !emp.user || !emp.user.isActive);

        if (eligibleEmployees.length === 0) {
            return { error: "Selected employees already have active accounts or do not exist.", success: false, status: 400 } as AppResponse;
        }

        const businessSlug = eligibleEmployees[0].business.slug;

        // 2. Preparing User data and Passwords
        const accountRequests = await Promise.all(eligibleEmployees.map(async (emp) => {
            const tempPassword = generateRandomPassword();
            const hashed = await hashPassword(tempPassword);
            return {
                employeeId: emp.id,
                password: hashed,
                firstName: emp.firstName,
                email: emp.email,
                tempPassword,
                hasExistingUserRow: !!emp.user // Track if we need to update or create
            };
        }));

        // Separate requests into inserts vs updates
        const requestsToCreate = accountRequests.filter(r => !r.hasExistingUserRow);
        const requestsToUpdate = accountRequests.filter(r => r.hasExistingUserRow);

        // 3. Executing DB updates in a Transaction
        await prisma.$transaction(async (tx) => {
            // Group A: Create fresh User rows
            if (requestsToCreate.length > 0) {
                await tx.user.createMany({
                    data: requestsToCreate.map(req => ({
                        employeeId: req.employeeId,
                        password: req.password,
                        needsPasswordChange: true,
                        isVerified: false,
                        isActive: true,
                        accountType: AccountType.EMPLOYEE,
                        accessGrantedBy: employeeId,
                        accessGrantedAt: new Date(),
                        createdAt: new Date(),
                    }))
                });
            }

            // Group B: Reactivate existing soft-deleted User rows
            // Since Prisma has no updateMany by unique ID mapping, we execute individual updates concurrently
            if (requestsToUpdate.length > 0) {
                await Promise.all(
                    requestsToUpdate.map(req => 
                        tx.user.update({
                            where: { employeeId: req.employeeId },
                            data: {
                                password: req.password,
                                needsPasswordChange: true,
                                isVerified: false,
                                isActive: true, // Reactivate
                                accessGrantedBy: employeeId,
                                accessGrantedAt: new Date(),
                            }
                        })
                    )
                );
            }

            // Mark Employees as having system access
            await tx.employee.updateMany({
                where: { id: { in: eligibleEmployees.map(e => e.id) } },
                data: { hasSystemAccess: true }
            });

            // Create Audit Logs
            await tx.auditLog.createMany({
                data: eligibleEmployees.map(emp => ({
                    action: "GRANT_ACCESS_BULK",
                    entity: "USER",
                    entityId: emp.id,
                    userId: userId,
                    businessId: businessId,
                    logType: "GRANT_EMPLOYEE_ACCESS_BULK",
                    newValue: emp.user 
                        ? `System access reactivated via bulk action.` 
                        : `System access newly granted via bulk action.`
                }))
            });
        });

        // 4. Send Emails (Asynchronous)
        Promise.allSettled(accountRequests.map(req => 
            sendTempPasswordEmail(req.email, req.tempPassword, req.firstName, businessSlug)
        )).catch(err => console.error("Bulk Email Error:", err));

        return { 
            success: true, 
            message: `Successfully set up accounts and sent emails to ${accountRequests.length} employees.`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_ACCESS_GRANT_ERROR:", error);
        return { error: "Internal Server Error during bulk grant.", success: false, status: 500 } as AppResponse;
    }
}


static async revokeBulkEmployeesSystemAccess(employeeIds: string[], userId: string, businessId: string) {
    try {
        if (!employeeIds || employeeIds.length === 0) {
            return { error: "No employees selected.", success: false, status: 400 } as AppResponse;
        }

        await prisma.$transaction(async (tx) => {
            // 1. Verify that these employees belong to this business and have access
            const employeesToRevoke = await tx.employee.findMany({
                where: { 
                    id: { in: employeeIds }, 
                    businessId: businessId,
                    hasSystemAccess: true 
                },
                select: { id: true, firstName: true, lastName: true }
            });

            if (employeesToRevoke.length === 0) {
                throw new Error("None of the selected employees have active system access.");
            }

            const validIds = employeesToRevoke.map(emp => emp.id);

            // 2. FIX: Soft-delete the User records in bulk instead of hard deleting
            await tx.user.updateMany({
                where: { employeeId: { in: validIds } },
                data: {
                    password: "REVOKED_ACCESS_SUSPENDED_ACCOUNT", 
                    isVerified: false,
                    needsPasswordChange: true,
                    isActive: false, // Suspends login capabilities safely
                }
            });

            // 3. Update the Employee flags back to false
            await tx.employee.updateMany({
                where: { id: { in: validIds } },
                data: { hasSystemAccess: false }
            });

            // 4. Create Audit Logs for the bulk action
            await tx.auditLog.createMany({
                data: employeesToRevoke.map(emp => ({
                    action: "UPDATE",
                    entity: "EMPLOYEE",
                    entityId: emp.id,
                    userId: userId,
                    businessId: businessId,
                    logType: "REVOKE_EMPLOYEE_ACCESS_BULK",
                    newValue: `System access soft-revoked via bulk action by admin.`
                }))
            });
        });

        return { 
            success: true, 
            message: `Successfully deactivated accounts for ${employeeIds.length} employees.`, 
            status: 200 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_ACCESS_REVOKE_ERROR:", error);
        return { 
            success: false, 
            error: (error as Error).message || "Failed to revoke access in bulk.", 
            status: 400 
        } as AppResponse;
    }
}



 /**
   * Switches the active terminal operational workspace context for an employee record
   * Scopes mutations strictly via multi-tenant architecture validation layers.
   */
  static async switchCurrentShop(
    payload: setCurrentShopInput,
    employeeId: string,
    businessId: string,
    userId: string
  ) {
    try {
      // 1. Structural Schema Validation using pnpm package dependencies
      const validateData = setCurrentShop.parse(payload);

      if (!validateData.shopId) {
        return { error: "Target shop identifier is required", success: false, status: 400 };
      }

      // 2. Transaction Scope for Database Integrity Operations
      const result = await prisma.$transaction(async (tx) => {
        
        // Fetch current employee data profile to evaluate identity state and verify tenant matching bounds
        const existingEmployee = await tx.employee.findUnique({
          where: { id: employeeId, businessId: businessId },
          include: { currentShop: true }
        });

        if (!existingEmployee) {
          throw new Error("Target employee record not found or unauthorized access scoping.");
        }

        // Security Check: Verify that this employee profile is explicitly mapped via Junction Table
        const assignedShopRelation = await tx.employeeShop.findUnique({
          where: {
            employeeId_shopId: {
              employeeId: employeeId,
              shopId: validateData.shopId,
            }
          }
        });

        if (!assignedShopRelation) {
          throw new Error("Access Denied: Selected employee is not explicitly assigned to this shop branch location.");
        }


        // 1. Execute Update Context Mutation Track (This updates the foreign key)
        const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
            currentShopId: validateData.shopId,
        },
        });

        // 2. Explicitly query the fresh target shop data inside the transaction block
        const freshShop = await tx.shop.findUnique({
        where: { id: validateData.shopId },

        });

        if (!freshShop) {
        throw new Error("Target shop properties could not be resolved.");
        }

        // Write Structural Audit Trail Tracking Entry with stringified states
        await tx.auditLog.create({
          data: {
            action: `UPDATE`,
            entity: "EMPLOYEE",
            entityId: updatedEmployee.id,
            userId: userId,
            businessId: businessId,
            oldValue: JSON.stringify({
              currentShopId: existingEmployee.currentShopId,
              currentShopName: existingEmployee.currentShop?.name || "Floating / None"
            }),
            details: `Switched operational context workspace for staff member: ${updatedEmployee.firstName} ${updatedEmployee.lastName} to branch location: ${freshShop.name || "Unknown"}`
          }
        });

        // 4. Return the fresh unified composite object explicitly
        return {
        ...updatedEmployee,
        currentShop: freshShop
        };
      });

      return {
        success: true,
        data: {
          currentShopId: result.currentShopId,
          currentShopSlug: result.currentShop?.slug,
          currentShopName: result.currentShop?.name
        },
        message: `Successfully switched active workspace to ${result.currentShop?.name || "selected branch"}`,
        status: 200
      }

    } catch (error: unknown) {
      console.error("Employee Workplace Switch Error Exception Trace:", error);
      return {
        error: (error as Error).message || "An unexpected error occurred during active workplace context shifting",
        success: false,
        status: 500
      };
    }
  }


  static async updateEmployeeShops(
    payload: UpdateEmployeeShopsInput,
    userId: string,
    businessId: string,
) {
  try {

    // Execute atomic rewrite assignment inside transaction bounds
    const targetEmployee = await prisma.$transaction(async (tx) => {
      
      // 1. Verify target employee explicitly belongs to this business tenant
      const targetEmployee = await tx.employee.findUnique({
        where: { id: payload.employeeId, businessId }
      });

      if (!targetEmployee) {
        throw new Error("Target staff profile record not found inside this tenant.");
      }

      // 2. Wipe old mapping rows completely to build a clean slate
      await tx.employeeShop.deleteMany({
        where: { employeeId: payload.employeeId, businessId }
      });

      // 3. Write out new explicit mapping rows if entries are checked
      if (payload.shopIds.length > 0) {
        
        // Ensure all target shops belong to this business
        const validShops = await tx.shop.findMany({
          where: { id: { in: payload.shopIds }, businessId, isDeleted: false },
          select: { id: true }
        });
        
       const validShopIds = validShops.map(s => s.id);

        await tx.employeeShop.createMany({
          data: validShopIds.map((id) => ({
            employeeId: payload.employeeId,
            shopId: id,
            businessId: businessId,
            assignedBy: targetEmployee.id // Track system creator context tags
          }))
        });

        // 4. Edge-Case Polish: If employee's active currentShopId isn't inside 
        // the new array selection list anymore, reset it to the first valid one or null
        if (targetEmployee.currentShopId && !validShopIds.includes(targetEmployee.currentShopId)) {
          await tx.employee.update({
            where: { id: payload.employeeId },
            data: { currentShopId: validShopIds[0] || null }
          });
        }
      } else {
        // If unassigned from everything, clear out active workspace coordinates
        await tx.employee.update({
          where: { id: payload.employeeId },
          data: { currentShopId: null }
        });
      }

      // 5. Build Audit Log Profile entry
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "EMPLOYEE",
          entityId: payload.employeeId,
          userId,
          businessId,
          oldValue: "Previous Assignments Wiped",
          details: `Synchronized access mappings to ${payload.shopIds.length} branches for employee: ${targetEmployee.firstName}`
        }
      });

      return targetEmployee;
    });

    return { 
        success: true, 
        message: `${payload.shopIds.length} assigned successfully to ${targetEmployee.firstName + " " + targetEmployee.lastName}`,
        status: 200 
    };

  } catch (error: unknown) {
    console.error("CRITICAL_MAPPING_MUTATION_ERROR:", error);
    return { success: false, error: (error as Error).message || "Failed to update assignments", status: 500 };
  }
}

}