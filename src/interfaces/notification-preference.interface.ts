export interface NotificationPreference {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  campaignUpdatesEnabled: boolean;
  payoutUpdatesEnabled: boolean;
  securityUpdatesEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesDto {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  campaignUpdatesEnabled?: boolean;
  payoutUpdatesEnabled?: boolean;
  securityUpdatesEnabled?: boolean;
}
