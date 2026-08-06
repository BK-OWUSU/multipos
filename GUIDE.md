// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Get a free hosted Postgres database in seconds: `npx create-db`

generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}


// ── BUSINESS (Tenant) ──────────────────────────────
model Business {
  id          String     @id @default(cuid())
  name        String
  email       String     @unique
  phone       String?
  address     String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // relations
  users       User[]
  shops       Shop[]
  products    Product[]
  customers   Customer[]
  sales       Sale[]
  categories  Category[]
  roles       Role[]
  discounts   Discount[]
  auditLogs   AuditLog[]

  @@map("businesses")
}

// ── SHOP (Branch) ──────────────────────────────────
model Shop {
  id         String    @id @default(cuid())
  name       String
  address    String?
  phone      String?
  isActive   Boolean   @default(true)
  businessId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  // relations
  business   Business  @relation(fields: [businessId], references: [id])
  users      User[]
  sales      Sale[]

  @@map("shops")
}

// ── ROLE ───────────────────────────────────────────
model Role {
  id          String   @id @default(cuid())
  name        String
  permissions String[] // e.g ["pos:view", "product:view"]
  businessId  String
  createdAt   DateTime @default(now())

  // relations
  business    Business @relation(fields: [businessId], references: [id])
  users       User[]

  @@map("roles")
}

// ── USER (Employee) ────────────────────────────────
model User {
  id         String     @id @default(cuid())
  firstName  String
  lastName   String
  email      String     @unique
  password   String
  phone      String?
  businessId String
  roleId     String
  shopId     String?
  isActive   Boolean    @default(true)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  // relations
  business   Business   @relation(fields: [businessId], references: [id])
  role       Role       @relation(fields: [roleId], references: [id])
  shop       Shop?      @relation(fields: [shopId], references: [id])
  sales      Sale[]
  stockLogs  StockLog[]
  timeCards  TimeCard[]
  auditLogs  AuditLog[]

  @@map("users")
}

// ── TIME CARD ──────────────────────────────────────
model TimeCard {
  id         String    @id @default(cuid())
  userId     String
  clockIn    DateTime
  clockOut   DateTime?
  totalHours Float?
  date       DateTime  @default(now())
  createdAt  DateTime  @default(now())

  // relations
  user       User      @relation(fields: [userId], references: [id])

  @@map("time_cards")
}

// ── CATEGORY ───────────────────────────────────────
model Category {
  id         String    @id @default(cuid())
  name       String
  businessId String
  createdAt  DateTime  @default(now())

  // relations
  business   Business  @relation(fields: [businessId], references: [id])
  products   Product[]

  @@map("categories")
}

// ── DISCOUNT ───────────────────────────────────────
model Discount {
  id         String       @id @default(cuid())
  name       String
  type       DiscountType @default(PERCENTAGE)
  value      Decimal    @db.Decimal(10, 2)
  isActive   Boolean      @default(true)
  startDate  DateTime?
  endDate    DateTime?
  businessId String
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  // relations
  business   Business     @relation(fields: [businessId], references: [id])
  products   Product[]
  sales      Sale[]

  @@map("discounts")
}

// ── PRODUCT ────────────────────────────────────────
model Product {
  id            String     @id @default(cuid())
  name          String
  price         Decimal    @db.Decimal(10, 2)
  costPrice     Decimal    @db.Decimal(10, 2)
  stock         Int        @default(0)
  lowStockAlert Int        @default(5)
  isActive      Boolean    @default(true)
  businessId    String
  categoryId    String?
  discountId    String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // relations
  business      Business   @relation(fields: [businessId], references: [id])
  category      Category?  @relation(fields: [categoryId], references: [id])
  discount      Discount?  @relation(fields: [discountId], references: [id])
  saleItems     SaleItem[]
  stockLogs     StockLog[]

  @@map("products")
}

// ── STOCK LOG ──────────────────────────────────────
model StockLog {
  id        String   @id @default(cuid())
  productId String
  userId    String
  change    Int
  reason    String?
  createdAt DateTime @default(now())

  // relations
  product   Product  @relation(fields: [productId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@map("stock_logs")
}

// ── CUSTOMER ───────────────────────────────────────
model Customer {
  id               String   @id @default(cuid())
  firstName        String
  lastName         String
  email            String?
  phone            String?
  address          String?
  isCreditCustomer Boolean  @default(false)
  creditLimit      Decimal    @db.Decimal(10, 2)    @default(0)
  businessId       String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // relations
  business         Business  @relation(fields: [businessId], references: [id])
  sales            Sale[]
  loyalty          Loyalty?

  @@map("customers")
}

// ── LOYALTY ────────────────────────────────────────
model Loyalty {
  id          String   @id @default(cuid())
  customerId  String   @unique
  points      Int      @default(0)
  totalEarned Int      @default(0)
  totalSpent  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // relations
  customer    Customer @relation(fields: [customerId], references: [id])

  @@map("loyalty")
}

// ── SALE ───────────────────────────────────────────
model Sale {
  id                String      @id @default(cuid())
  totalAmount       Decimal    @db.Decimal(10, 2)
  discountAmount    Decimal    @db.Decimal(10, 2)       @default(0)
  paymentType       PaymentType @default(CASH)
  status            SaleStatus  @default(COMPLETED)
  businessId        String
  shopId            String?
  userId            String
  customerId        String?
  discountId        String?
  createdAt         DateTime    @default(now())

  // relations
  business          Business    @relation(fields: [businessId], references: [id])
  shop              Shop?       @relation(fields: [shopId], references: [id])
  user              User        @relation(fields: [userId], references: [id])
  customer          Customer?   @relation(fields: [customerId], references: [id])
  discount          Discount?   @relation(fields: [discountId], references: [id])
  items             SaleItem[]
  invoice           Invoice?

  @@map("sales")
}

// ── SALE ITEM ──────────────────────────────────────
model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Decimal    @db.Decimal(10, 2)
  subtotal  Decimal    @db.Decimal(10, 2)

  // relations
  sale      Sale    @relation(fields: [saleId], references: [id])
  product   Product @relation(fields: [productId], references: [id])

  @@map("sale_items")
}

// ── INVOICE ────────────────────────────────────────
model Invoice {
  id        String   @id @default(cuid())
  invoiceNo String   @unique
  issuedAt  DateTime @default(now())
  saleId    String   @unique

  // relations
  sale      Sale     @relation(fields: [saleId], references: [id])

  @@map("invoices")
}

// ── AUDIT LOG ──────────────────────────────────────
model AuditLog {
  id         String   @id @default(cuid())
  action     String   // e.g "CREATED_PRODUCT", "UPDATED_STOCK"
  entity     String   // e.g "Product", "User", "Sale"
  entityId   String   // id of the affected record
  oldValue   String?  // JSON string of old data
  newValue   String?  // JSON string of new data
  userId     String
  businessId String
  createdAt  DateTime @default(now())

  // relations
  user       User     @relation(fields: [userId], references: [id])
  business   Business @relation(fields: [businessId], references: [id])

  @@map("audit_logs")
}

// ── ENUMS ──────────────────────────────────────────
enum PaymentType {
  CASH
  MOBILE_MONEY
  CREDIT
}

enum SaleStatus {
  COMPLETED
  REFUNDED
  PENDING
}

enum DiscountType {
  PERCENTAGE
  FIXED
}




///middl
import { NextRequest, NextResponse } from "next/server";
import { verifyPOSTokenEdge } from "./lib/auths";
import { JwtPayload } from "./types/auth";

const POS_COOKIE_NAME = "pos_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";
export async function proxy(request: NextRequest ) {
    const { pathname } = request.nextUrl;
  // 1. SKIP STATIC FILES & ASSETS
    if (
      pathname.startsWith('/_next') || 
      pathname.includes('.') ||
      pathname.startsWith('/api')
    ) {
      return NextResponse.next();
    }

    const token = request.cookies.get(POS_COOKIE_NAME)?.value;
    const reset_pass_token = request.cookies.get(PASSWORD_RESET_COOKIE_NAME)?.value;
    let session = null;

    if (token) {
      session = (await verifyPOSTokenEdge(token)) as JwtPayload;
    }

    // If user is logged in but needs to change password
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
      if (pathname !== resetPath) {
        return NextResponse.redirect(new URL(resetPath, request.url));
      }
      return NextResponse.next();
    }

    // 2. CHECK PUBLIC PATHS
    const publicPaths = ["/login", "/signup", "/verify-email", "/"];
    const isPublicPath = publicPaths.includes(pathname);

    /// Regex for /[businessSlug]/[route]
    const isTenantPath = /^\/[^/]+\/[^/]+/.test(pathname);
    //Slug and RouteKey
    const urlSlug = pathname.split("/")[1];
    const routeKey = pathname.split("/")[2];

    console.log(`Path: ${pathname} | Public: ${isPublicPath} | Protected: ${isTenantPath}`);


  // 3. UNAUTHORIZED ACCESS
  if (isTenantPath && !session) {
    // SPECIAL CASE: Allow access to reset-password if they have a verifyToken
    if (routeKey === "reset-password" && reset_pass_token) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Logged in user trying to access public pages
  if (session && isPublicPath) {
    return NextResponse.redirect(
      new URL(`/${session.businessSlug}/dashboard`, request.url)
    );
  }

 
  // 5. MULTI-TENANT PROTECTION (VERY IMPORTANT)
  if (session && isTenantPath) {
    // User trying to access another tenant
    if (urlSlug !== session.businessSlug) {
      return NextResponse.redirect(
        new URL(`/${session.businessSlug}/dashboard`, request.url)
      );
    }
  }

  //Full Access to Business Owner
  if (session?.access.includes("*")) {
    return NextResponse.next();
  }

  //Checking if user has Access to the requested route
  if(routeKey && session?.access.includes(routeKey)) {
    return NextResponse.redirect(
      new URL(`/${session.businessSlug}/dashboard`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/verify-otp",
    "/:slug/:path*",
  ],
};