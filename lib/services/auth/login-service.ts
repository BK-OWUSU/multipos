import { 
    verifyPassword, 
    setPOSAppSessionCookie,
    setPasswordResetSessionCookie,
    setEmailVerificationSessionCookie
} from "@/lib/auths-functions";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, saveOTP } from "@/lib/otp";
import { JwtPayload } from "@/types/auth/auth";
import { NextResponse } from "next/server";

export class LoginService {
static async login(email: string, password: string, ipAddress?: string, userAgent?: string ) {
    try {
        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
        }

        // 1. Find ALL active user instances linked to this email across all businesses
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                employee: {
                    email: email,
                    isActive: true,
                    isDeleted: false,
                    hasSystemAccess: true,
                }
            },
            include: {
                employee: {
                    include: {
                        business: true,
                        role: true,
                        currentShop:true,
                        assignedShops: {
                            include: {
                                shop: true
                            }
                        }
                    },
                },
                userSessionLogs: {
                    orderBy: {
                        loginAt: "desc",
                    },
                    take: 1,
                },
            }
        });

        if (users.length === 0) {
            console.log("STAGE ====>  1")
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // 2. Filter for users with the correct password
        const validUsers = [];
        for (const user of users) {
            const isValidPassword = await verifyPassword(password, user.password);
            if (isValidPassword) {
                validUsers.push(user);
            }
        }
        // console.log(users)
        const u = users[0];
        const isValidPassword = await verifyPassword(password, u.password);

        console.log("PASS MATCH:  ", isValidPassword)
        
        if (validUsers.length === 0) {
            console.log("STAGE ====>  2")
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }
        
        // 3. Handle specific scenario: Only ONE valid business found
        if (validUsers.length === 1) {
            const user = validUsers[0];
            const emp = user.employee;
            
            // Check if email is verified
            if (!user.isVerified) {
                const verifyEmail_token = {
                    userId: user.id, 
                    email: emp.email,
                    purpose: "OTP Verification via email",
                    businessId: emp.businessId 
                }
                const response = NextResponse.json({ message: "Please verify your email first", isVerified: false, redirectTo: `/verify-email?email=${encodeURIComponent(emp.email)}`, success: false },{ status: 201 });

                const otpCode = await prisma.$transaction(async (tx) => {
                    const code = generateOTP();
                    await saveOTP(user.id, code, tx);
                    return code;
                });

                
                try {
                    await sendOTPEmail(emp.email, emp.firstName, otpCode);
                    console.log("OTP VERIFICATION VIA LOGIN: ", otpCode)
                } catch (err) {
                    console.error("Email sending failed:", err);
                }
                
                setEmailVerificationSessionCookie(response, verifyEmail_token);
                return response;
            }
            
            console.log("NEED PASSWORD CHANGE")
            console.log("STAGE ====>  3")
            console.log(emp)
            // Check if password change is required (e.g., first-time login for staff)
            if (user.needsPasswordChange) {
                const passwordToken_object = {
                    userId: user.id,
                    email: emp.email,
                    purpose: "password_reset",
                    businessId: emp.businessId
                }
                
                const response = NextResponse.json({ message: "Password change required", success: false, requiresPasswordChange: true, redirectTo: `/${emp.business.slug}/reset-password` },{ status: 201 });
                setPasswordResetSessionCookie(response, passwordToken_object)
                return response;
            }

            
            // 4. Successful Login - 
            // Creating session log
             const session = await prisma.userSessionLog.create({
             data: {
                 userId: user.id,
                 businessId: emp.businessId,
                 ipAddress: ipAddress,
                 userAgent: userAgent,
                 },
             });

                //TEMPORAL TESTING 
                let shops: {id:string, name: string, slug: string}[] = [];
                if (user.accountType === "OWNER") {
                    shops = emp.assignedShops.map((assignedShop) => ({
                        id: assignedShop.shop.id,
                        name: assignedShop.shop.name,
                        slug: assignedShop.shop.slug,
                    }));
                } else if (emp.currentShop) {
                    shops = [{
                        id: emp.currentShop.id,
                        name: emp.currentShop.name,
                        slug: emp.currentShop.slug,
                    }];
                }
                //TEMPORAL TESTING

           // Generate Session 
            const tokenObject: JwtPayload = {
                userId: user.id,
                employeeId: emp.id,
                businessId: emp.businessId,
                sessionLogId: session.id,
                businessSlug: emp.business.slug,
                roleName: emp.role.name,
                roleId: emp.role.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                access: emp.role.access,
                shopId: shops[0]?.id || undefined,
                shopSlug: shops[0]?.slug || undefined
            };
            
            const response = NextResponse.json({ success: true, redirectTo: `/${emp.business.slug}/dashboard`, user: tokenObject }, { status: 200 });
            setPOSAppSessionCookie(response, tokenObject);
            return response;
        }
        
        // 5. Handle Multiple Businesses: Return choices to the frontend
        return NextResponse.json({
            success: true,
            multipleBusinesses: true,
            businesses: validUsers.map((u) => ({
                name: u.employee.business.name,
                slug: u.employee.business.slug,
            })),
        }, { status: 200 });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


}