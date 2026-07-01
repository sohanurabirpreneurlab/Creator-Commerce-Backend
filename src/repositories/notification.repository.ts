import { Pool } from "pg";
import { NotificationType } from "../constants/notification.constants.js";
import {
  Notification,
  NotificationListFilters,
} from "../interfaces/notification.interface.js";

export class NotificationRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    entityType: string | null;
    entityId: string | null;
  }): Promise<Notification> {
    const result = await this.databasePool.query(
      `
        insert into public.notifications (
          user_id,
          title,
          message,
          type,
          entity_type,
          entity_id
        )
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [
        data.userId,
        data.title,
        data.message,
        data.type,
        data.entityType,
        data.entityId,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async findManyByUserId(
    userId: string,
    filters: NotificationListFilters,
  ): Promise<{ data: Notification[]; total: number }> {
    const values: Array<string | number | boolean> = [userId];
    const whereClauses = ["user_id = $1"];

    if (filters.isRead !== undefined) {
      values.push(filters.isRead);
      whereClauses.push(`is_read = $${values.length}`);
    }
    if (filters.type) {
      values.push(filters.type);
      whereClauses.push(`type = $${values.length}`);
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          *,
          count(*) over() as total_count
        from public.notifications
        where ${whereClauses.join(" and ")}
        order by created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRow(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  public async findById(id: string): Promise<Notification | null> {
    const result = await this.databasePool.query(
      `select * from public.notifications where id = $1 limit 1`,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const result = await this.databasePool.query(
      `
        update public.notifications
        set
          is_read = true,
          updated_at = now()
        where id = $1
          and user_id = $2
        returning *
      `,
      [id, userId],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const result = await this.databasePool.query(
      `
        update public.notifications
        set
          is_read = true,
          updated_at = now()
        where user_id = $1
          and is_read = false
      `,
      [userId],
    );

    return result.rowCount ?? 0;
  }

  public async countUnread(userId: string): Promise<number> {
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.notifications
        where user_id = $1
          and is_read = false
      `,
      [userId],
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private mapRow(row: Record<string, unknown>): Notification {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      title: String(row.title),
      message: String(row.message),
      type: String(row.type) as NotificationType,
      entityType: row.entity_type === null ? null : String(row.entity_type),
      entityId: row.entity_id === null ? null : String(row.entity_id),
      isRead: Boolean(row.is_read),
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
