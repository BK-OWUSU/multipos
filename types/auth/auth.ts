import { Prisma } from "@/generated/prisma/client";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    employee: {
      include: {
        business: true,
        role: true,
        currentShop: true,
        assignedShops: {
          include: {
            shop: true
          }
        }
      },
    },
    userSessionLogs: {
      orderBy: { loginAt: "desc" },
      take: 2
    }
  }
}>

//User  
export type User = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  imageUrl?:  string | null;
  fileKey?:   string | null;
  needsPasswordChange: boolean;
  isActive: boolean;
  isVerified: boolean;

  // Employment Details
  designation?: string | null;
  address?:     string | null;
  dateOfBirth?: Date | null;
  hireDate?:    Date | null;
  //Role Details
  role: {
    name: string;
    permissions: string[];
    access: string[];
  };
  //Business Details
  business: {
    id: string;
    name: string;
    slug: string;
    currencyCode: string;
    currencySymbol: string;
    locale: string;
    countryCode?: string;
    logoUrl?: string | null;
  };
  //Shop Details
  currentShop?: {
    id:        string;
    name?:     string | null;
    shopSlug:  string;
    address?:  string | null;
    phone?:    string | null;
  };

  assignedShops?: {
          shop: {
              id: string;
              name: string;
              shopSlug: string;
              phone: string | null;
              address: string | null;
        }
  }[];

  //Session Details
  session?: {
    currentLoginAt: Date;
    lastLoginAt?: Date | null;
    logoutAt?:    Date | null;
    ipAddress?:   string | null;
    userAgent?:   string | null;
  } 
}

export type Session = {
    currentLoginAt: Date;
    lastLoginAt?: Date | null;
    logoutAt?:    Date | null;
    ipAddress?:   string | null;
    userAgent?:   string | null;
  }

export type Employee = {
  id: string;
  customId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string | null;
  fileKey: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  designation: string | null;
  hasSystemAccess: boolean;
  isActive: boolean;
  createdAt: Date | string;

  roleId: string;
  currentShopId: string | null;

  role: {
    id: string;
    name: string;
  };
  
  currentShop: {
    id: string;
    name: string;
  } | null;

  user: {
    id: string;
    isVerified: boolean;
    needsPasswordChange: boolean;
  } | null; 
};

// types/customer.ts
export interface Customer {
  id: string;
  customId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  
  // Analytics
  firstVisit: Date | string | null;
  lastVisit: Date | string | null;
  totalVisit: number;

  // Financial
  isCreditCustomer: boolean;
  creditLimit: number | string; 
  businessId: string;
  registeredAtShopId: string | null;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  isDeleted: boolean;
  deletedAt: Date | string | null;

  // Relations (Optional loads)
  registeredAtShop?: {
    id: string;
    name: string;
  } | null;

  // 👇 NEW: Loyalty Tier Relation
  loyaltyTierId: string | null;
  loyaltyTier?: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    earnMultiplier: number | string;
    redemptionMultiplier: number | string;
    priority: number;
    isDefault: boolean;
    isActive: boolean;
  } | null;

  // 👇 NEW: Loyalty Wallet Relation
  loyaltyWallet?: {
    id: string;
    customerId: string;
    businessId: string;
    availablePoints: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    lifetimeExpired: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  } | null;

  // 👇 NEW: Loyalty History Relation (loaded in single customer view)
  loyaltyHistory?: Array<{
    id: string;
    walletId: string;
    customerId: string;
    businessId: string;
    shopId: string | null;
    saleId: string | null;
    rewardId: string | null;
    performedById: string | null;
    points: number;
    type: string; // Or a specific string literal union / enum like LoyaltyActionType
    reason: string | null;
    createdAt: Date | string;
    shop?: { name: string } | null;
    reward?: { title: string } | null;
  }>;

  // Extra Helper Info
  fullName?: string;
  _count?: {
    sales: number;
    loyaltyHistory?: number; // Added this since it's an option in your count block now
  }; 
}

export type JwtPayload = {
  userId: string;
  businessId: string;
  employeeId?: string;
  sessionLogId?: string;
  businessSlug: string;
  roleName: string;
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  access: string[];
  needsPasswordChange?: boolean;
  shopId?: string;
  shopSlug?: string;
};

export type EmailVerificationPayload = {
  userId: string, 
  email: string, 
  purpose?: string, 
  businessId?: string 
} 

export type PosPayload = {
  userId: string;
  businessId: string;
  businessSlug: string;
  employeeId: string;     
  cashSessionId: string;  
  shopId: string;         
  shopSlug: string;      
};
//Token
export type Token = {
  userId: string;
  businessId: string;
  email?: string
}

export type OTPResponse = {
    valid?: boolean;
    message?: string;
    success?: boolean;
    redirectTo?: string;
    error?: string;
    status?: number;
    businessesSlug?: string;
    requiresPasswordChange?: boolean;
}


export type LoginResponse = {
    success?: boolean;
    redirectTo?: string;
    isVerified?: boolean;
    error?: string;
    status: number;
    multipleBusinesses?: boolean;
    requiresPasswordChange?: boolean;
    businesses?: {
        name: string;
        slug: string;
    }[];
    businessesSlug?: string;
    shopSlug?: string;
}

export type SignUpResponse = {
    success?: boolean;
    redirectTo?: string;
    message?: string;
    error?: string;
    status?: number;
}

export type AppResponse = {
    success?: boolean;
    redirectTo?: string;
    message?: string;
    error?: string;
    status?: number;
    data?: unknown;
    meta?: unknown;
}

