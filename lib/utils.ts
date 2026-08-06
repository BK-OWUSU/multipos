import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto";
import { format, formatRelative } from "date-fns";
import { Prisma } from "@/generated/prisma/client";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}


export const formatStandardDateTime = (dateValue: string | Date | number | undefined | null): string => {
  if (!dateValue) return "—";
  
  const date = new Date(dateValue);
  
  // Guard against invalid date values passed in
  if (isNaN(date.getTime())) return "—";

  const pad = (num: number) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  
  // 12-Hour conversion math
  const rawHours = date.getHours();
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12; // Converts 0 to 12 for Midnight

  const hours = pad(hours12);
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm}`;
};


export function formatDate(date: Date | string, locale: string = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date, locale: string = "en-US"): string {
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function formatTime(date: Date, locale: string = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatTime12Hours (dateString: string | null | undefined): string  {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function formatPercentage(value: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value)
}


/**
 * Formats a numeric value into a currency string based on business settings.
 */
export function formatBusinessCurrency(
  amount: number | string, 
  currency: string = 'USD', 
  locale: string = 'en-US'
) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
}


//Converts ISO strings into relative formats (Today, Yesterday, or full date)

export const formatSessionDate = (dateString: string | Date | null | undefined) => {
  const fallback = { relative: "—", precise: "—" };
  
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is actually valid
    if (isNaN(date.getTime())) return fallback;

    const relative = formatRelative(date, new Date());
    const capitalizedRelative = relative.charAt(0).toUpperCase() + relative.slice(1);

    return {
      relative: capitalizedRelative.replace(" at ", " "),
      precise: format(date, "eeee d, yyyy 'at' p")
    };
  } catch (error) {
    console.log("Error Session Time Formatting: ",error)
    return fallback;
  }
};

export const parseUserAgent = (ua: string | null | undefined) => {
  if (!ua) return "Unknown Device";
  
  if (ua.includes("Chrome")) return "Chrome on Windows";
  if (ua.includes("Firefox")) return "Firefox on Windows";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari on macOS";
  if (ua.includes("iPhone")) return "Safari on iPhone";
  
  return "Desktop Browser"; // Fallback
};

export const formatIP = (ip: string | null | undefined) => {
  if (!ip) return "Unknown IP";
  // Convert IPv6 localhost to standard format
  return ip === "::1" ? "127.0.0.1 (Local)" : ip;
};

export const humanize = (text: string) => {
  return text
    .replace(/([A-Z])/g, ' $1') // Add space before caps
    .replace(/[_-]/g, ' ')      // Replace _ or - with spaces
    .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
    .trim();
};

export function generateRandomPassword(): string {
  return crypto.randomBytes(4).toString("hex");
}

// 1. If any MoMo is involved, generate a secure reference string
   export function paystackReferenceGenerator (paymentMethod: string): string| null {
      if (paymentMethod === "CASH") {
    return null;
  }
  const uniqueId = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `POS-${paymentMethod}-${Date.now()}-${uniqueId}`; 
  }



//FUNCTION TO GENERATE CUSTOM IDS:

interface GenerateCustomIdArgs {
  tx: Prisma.TransactionClient;
  businessId: string;
  sequenceType: string;
  prefix: string;
}

export async function generateNextCustomId({
  tx,
  businessId,
  sequenceType,
  prefix,
}: GenerateCustomIdArgs): Promise<string> {
  const today = new Date();

  const dateString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");

  const sequence = await tx.sequence.upsert({
    where: {
      businessId_type: {
        businessId,
        type: sequenceType,
      },
    },
    update: {
      currentNo: {
        increment: 1,
      },
    },
    create: {
      businessId,
      type: sequenceType,
      currentNo: 1,
    },
  });

  const sequenceNumber = String(sequence.currentNo).padStart(8, "0");

  return `${prefix}-${dateString}-${sequenceNumber}`;
}