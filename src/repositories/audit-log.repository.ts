import { Pool } from "pg";

export class AuditLogRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    actorUserId: string;
    targetUserId: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
  }) {
    await this.databasePool.query(
      `
        insert into public.audit_logs (
          actor_user_id,
          target_user_id,
          action,
          old_value,
          new_value
        )
        values ($1, $2, $3, $4, $5)
      `,
      [
        data.actorUserId,
        data.targetUserId,
        data.action,
        data.oldValue,
        data.newValue,
      ],
    );
  }
}
