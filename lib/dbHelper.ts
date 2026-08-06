import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

//Creating and Exporting Client
export const prisma = new PrismaClient({adapter});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}