import { NotificationType } from "../constants/notification.constants.js";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  entityType?: string;
  entityId?: string;
}

export interface NotificationQueryDto {
  page?: string;
  limit?: string;
  isRead?: string;
  type?: string;
}

export interface NotificationListFilters {
  page: number;
  limit: number;
  isRead?: boolean;
  type?: NotificationType;
}
