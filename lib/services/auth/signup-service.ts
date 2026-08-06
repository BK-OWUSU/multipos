import {hashPassword, setEmailVerificationSessionCookie } from "@/lib/auths-functions";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { AccountType, RoleName, RoleType } from "@/generated/prisma/enums";
import { generateOTP, saveOTP } from "@/lib/otp";
import { generateUniqueBusinessSlug, generateUniqueShopSlug } from "@/lib/slugGenerator";
import { NextResponse } from "next/server";
import { seedRoles } from "@/lib/services/seed/roles.seed";
import { getAllInfoByISO } from 'iso-country-currency';
import { SignUpFormSchema, signupSchema } from "@/types/schema/auth.schema";
import { generateNextCustomId } from "@/lib/utils";

export class SignUpService {
static async signUp(rawData: SignUpFormSchema) {
    try {

        const validatedData = signupSchema.parse(rawData);
        const { 
        businessName, 
        email, 
        password, 
        firstName, 
        lastName, 
        countryCode,
        shopName,
        shopAddress,
        shopPhone 
      } = validatedData;

        // Get the rich metadata from the latest library version
        const countryData = getAllInfoByISO(countryCode);
        if (!countryData) throw new Error("Unsupported country selected.");
        //Generate unique slug for the business and password hash
        const subdomainSlug = await generateUniqueBusinessSlug(businessName);
        const hashedPassword = await hashPassword(password);
        
        //Check if user already exists
        const existingEmployeeInBusiness = await prisma.employee.findFirst({
            where: {
                email: email.toLowerCase(),
                business: { slug: subdomainSlug }
            }
        });
        
        if (existingEmployeeInBusiness) {
            return NextResponse.json({ 
                error: "An account with this email already exists for this business name.", 
                success: false 
            }, { status: 400 });
        }
        
        //using transactions to register the new tenant
        const {user, otpCode, ownerEmployee} = await prisma.$transaction(async(transact)=> {
            // 1️ Creating Business
            const business = await transact.business.create({
                data : {
                    name: businessName, 
                    slug: subdomainSlug, 
                    email: email.toLowerCase(),
                    countryCode: validatedData.countryCode,
                    currencyCode: countryData.currency,
                    currencySymbol: countryData.symbol,
                    dateFormat: countryData.dateFormat,
                    locale: validatedData.countryCode === 'GH' ? 'en-GH' : 'en-US',
                    termsAgreement: validatedData.termsAgreement
                }
            });
            
            // Generate unique slug for the initial shop
            const shopSlug = await generateUniqueShopSlug(shopName, business.id);
            const employeeIdGen = await generateNextCustomId({tx: transact,businessId: business.id, sequenceType: "EMPLOYEE",prefix: "EMP"});

            // 2 Creating Owner Role for the new business
            const ownerRole = await transact.role.create({
                data: {
                    name: RoleName.OWNER,
                    permissions: ["*"],
                    access: ["*"],
                    businessId: business.id,
                    isSystem: true,
                    type: RoleType.SYSTEM,
                    createdById: null, 
                    updatedById: null
                }
            }); 

            // 3. Creating OWNER Employee Account
            const ownerEmployee = await transact.employee.create({
            data: {
                customId: employeeIdGen,
                firstName: firstName,
                lastName: lastName,
                email: email.toLowerCase(),
                phone: shopPhone || null, // Leverage shop phone if no main identity phone is explicitly captured
                roleId: ownerRole.id,
                businessId: business.id,
                hasSystemAccess: true, 
            }
            });

            // 4 Creating OWNER User Account
             const user = await transact.user.create({
                data: {
                    accountType: AccountType.OWNER,
                    password: hashedPassword,
                    employeeId: ownerEmployee.id,
                    needsPasswordChange: false
                },
            });

            //Update the role fields safely INSIDE the transaction block
            await transact.role.update({
                where: {id: ownerRole.id, businessId: business.id},
                data: {
                createdById: user.id, 
                updatedById: user.id  
              }
            })

            // 5. Creating First Shop Location (Aligned with your exact Prisma Schema)
            const shop = await transact.shop.create({
            data: {
                name: shopName,
                slug: shopSlug,
                address: shopAddress || null,
                phone: shopPhone || null,
                businessId: business.id,
                isActive: true,
                isDeleted: false
            }
            });

            // 6. Associating the Owner Employee to this Specific Initial Shop Context
            await transact.employeeShop.create({
            data: {
                employeeId: ownerEmployee.id,
                shopId: shop.id,
                businessId: business.id,
                assignedBy: ownerEmployee.id
            }
            });

            //Creating Other Roles for the new Business
            await seedRoles(user.id, business.id, transact);

           // 7. Generating Verification OTP
            const otpCode = generateOTP();
            await saveOTP(user.id, otpCode, transact);
            
            //CREATING AUDIT LOGS
             await transact.auditLog.create({
                data: {
                    action: `USER_SIGN_UP`,
                    entity: "USER",
                    entityId: user.id,
                    oldValue: null,
                    newValue: JSON.stringify({ email: email.toLowerCase(), businessId: business.id }),
                    userId: user.id, 
                    businessId: business.id,
                    details: `System Owner account initialized successfully for ${firstName} ${lastName}.`
                }
            });
            return { user, otpCode, ownerEmployee, ownerRole, business, shop };
        })


        const ownerEmail = ownerEmployee.email.toLowerCase();
        const userID = user.id;
        const userName = ownerEmployee.firstName;
        const userOtpCode = otpCode;
        const businessID = ownerEmployee.businessId;

        const response = NextResponse.json({
            success: true, 
            message: "Registration successful. Please verify your email.",
            redirectTo: `/verify-email?email=${encodeURIComponent(ownerEmail)}`,
            }, 
            {status: 200})

        const verify_Token_Object = {
            userId: userID, 
            email: ownerEmail,
            purpose: "First time OTP Verification vai Signup",
            businessId: businessID
        }    

        setEmailVerificationSessionCookie(response, verify_Token_Object)
    
        //Send email
        try {
        await sendOTPEmail(
            ownerEmail,
            userName,
            userOtpCode
        );
        } catch (err) {
        console.error("Email sending failed:", err);
        }
        return response;

    } catch (error) {
        console.log("Error registration: ", error)
        return NextResponse.json({error: "Error registering", success: false}, {status: 500})
    }
}
}