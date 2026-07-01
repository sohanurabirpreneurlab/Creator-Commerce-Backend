import { Pool } from "pg";
import {
  NotificationPreference,
  UpdateNotificationPreferencesDto,
} from "../interfaces/notification-preference.interface.js";

export class NotificationPreferenceRepository {
  constructor(private readonly databasePool: Pool) {}

  public async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.notification_preferences
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async createDefault(userId: string): Promise<NotificationPreference> {
    const result = await this.databasePool.query(
      `
        insert into public.notification_preferences (user_id)
        values ($1)
        on conflict (user_id) do update
          set updated_at = public.notification_preferences.updated_at
        returning *
      `,
      [userId],
    );

    return this.mapRow(result.rows[0]);
  }

  public async upsertForUser(
    userId: string,
    data: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    const result = await this.databasePool.query(
      `
        insert into public.notification_preferences (
          user_id,
          in_app_enabled,
          email_enabled,
          campaign_updates_enabled,
          payout_updates_enabled,
          security_updates_enabled
        )
        values ($1, $2, $3, $4, $5, $6)
        on conflict (user_id) do update
        set
          in_app_enabled = excluded.in_app_enabled,
          email_enabled = excluded.email_enabled,
          campaign_updates_enabled = excluded.campaign_updates_enabled,
          payout_updates_enabled = excluded.payout_updates_enabled,
          security_updates_enabled = excluded.security_updates_enabled,
          updated_at = now()
        returning *
      `,
      [
        userId,
        data.inAppEnabled ?? true,
        data.emailEnabled ?? true,
        data.campaignUpdatesEnabled ?? true,
        data.payoutUpdatesEnabled ?? true,
        data.securityUpdatesEnabled ?? true,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async updateForUser(
    userId: string,
    data: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference | null> {
    const values: Array<boolean | string> = [];
    const updates: string[] = [];

    if (data.inAppEnabled !== undefined) {
      values.push(data.inAppEnabled);
      updates.push(`in_app_enabled = $${values.length}`);
    }
    if (data.emailEnabled !== undefined) {
      values.push(data.emailEnabled);
      updates.push(`email_enabled = $${values.length}`);
    }
    if (data.campaignUpdatesEnabled !== undefined) {
      values.push(data.campaignUpdatesEnabled);
      updates.push(`campaign_updates_enabled = $${values.length}`);
    }
    if (data.payoutUpdatesEnabled !== undefined) {
      values.push(data.payoutUpdatesEnabled);
      updates.push(`payout_updates_enabled = $${values.length}`);
    }
    if (data.securityUpdatesEnabled !== undefined) {
      values.push(data.securityUpdatesEnabled);
      updates.push(`security_updates_enabled = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findByUserId(userId);
    }

    values.push(userId);

    const result = await this.databasePool.query(
      `
        update public.notification_preferences
        set
          ${updates.join(", ")},
          updated_at = now()
        where user_id = $${values.length}
        returning *
      `,
      values,
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  private mapRow(row: Record<string, unknown>): NotificationPreference {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      inAppEnabled: Boolean(row.in_app_enabled),
      emailEnabled: Boolean(row.email_enabled),
      campaignUpdatesEnabled: Boolean(row.campaign_updates_enabled),
      payoutUpdatesEnabled: Boolean(row.payout_updates_enabled),
      securityUpdatesEnabled: Boolean(row.security_updates_enabled),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at),
    };
  }
}
