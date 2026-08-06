import { Prisma } from "@/generated/prisma/client";

// 1. Base payload type for standard notification fetches
export type NotificationItem = Prisma.NotificationGetPayload<object>;

// 2. Extended payload type if you want to include related shop or employee details
export type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: {
    shop: {
      select: { id: true; name: true };
    };
    employee: {
      select: { id: true; firstName: true; lastName: true };
    };
  };
}>;

// 3. Helper type for your API response wrapper
export interface NotificationListResponse {
  success: boolean;
  data: NotificationWithRelations[];
  unreadCount: number;
  status: number;
}