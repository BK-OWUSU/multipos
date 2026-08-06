import { create } from "zustand";
import apiClient from "@/lib/api-client";
import { NotificationWithRelations } from "@/types/notification.type";
import { NotificationCategory } from "@/generated/prisma/browser";


type NotificationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type NotificationStore = {
  // States
  notifications: NotificationWithRelations[] | null;
  meta: NotificationMeta | null;
  isLoading: boolean;

  // Actions
  fetchNotifications: (filters?: {
    isRead?: boolean;
    category?: NotificationCategory;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  // Initial States
  notifications: null,
  meta: null,
  isLoading: false,

  // Fetch Paginated / Filtered Notifications
  fetchNotifications: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (typeof filters?.isRead === "boolean") {
        params.append("isRead", String(filters.isRead));
      }
      if (filters?.category) {
        params.append("category", filters.category);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.page) {
        params.append("page", String(filters.page));
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/business/notifications?${queryString}` : `/business/notifications`;

      const response = await apiClient.get(endpoint);
      const notificationsData = response.data.data as NotificationWithRelations[];
      const metaData = response.data.meta as NotificationMeta;
   
      set({
        notifications: notificationsData,
        meta: metaData,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ notifications: null, meta: null, isLoading: false });
    }
  },
}));