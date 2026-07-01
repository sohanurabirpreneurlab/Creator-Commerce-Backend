import { Pool } from "pg";
import { UserRole } from "../constants/roles.js";
import { UserStatus } from "../constants/profile.constants.js";
import {
  RoleBreakdownItem,
  User,
  UserListFilters,
  UserSummary,
} from "../interfaces/user.interface.js";

export class UserRepository {
  constructor(private readonly databasePool: Pool) {}

  public async findById(id: string): Promise<User | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          email,
          role,
          status,
          mobile_number,
          address,
          gender,
          date_of_birth,
          created_at,
          updated_at
        from public.users
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          email,
          role,
          status,
          mobile_number,
          address,
          gender,
          date_of_birth,
          created_at,
          updated_at
        from public.users
        where lower(email) = lower($1)
        limit 1
      `,
      [email.trim()],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  public async existsById(id: string): Promise<boolean> {
    const result = await this.databasePool.query(
      `
        select 1
        from public.users
        where id = $1
        limit 1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  public async findMany(
    filters: UserListFilters,
  ): Promise<{ data: UserSummary[]; total: number }> {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(
        `(u.name ilike ${placeholder} or u.email ilike ${placeholder})`,
      );
    }

    if (filters.role) {
      values.push(filters.role);
      whereClauses.push(`u.role = $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`u.status = $${values.length}`);
    }

    const whereSql =
      whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : "";

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.created_at,
          u.updated_at,
          cp.id as creator_profile_id,
          bm.id as brand_manager_id,
          bm.brand_id,
          count(*) over() as total_count
        from public.users u
        left join public.creator_profiles cp
          on cp.user_id = u.id
        left join lateral (
          select
            id,
            brand_id
          from public.brand_managers
          where user_id = u.id
            and status = 'ACTIVE'
          order by created_at desc
          limit 1
        ) bm on true
        ${whereSql}
        order by u.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToUserSummary(row)),
      total: this.getTotalFromRows(result.rows),
    };
  }

  public async updateBasicProfile(
    id: string,
    data: Partial<{
      name: string;
      mobileNumber: string;
      address: string;
      gender: string;
      dateOfBirth: string;
    }>,
  ): Promise<User | null> {
    const values: string[] = [];
    const updates: string[] = [];

    if (data.name !== undefined) {
      values.push(data.name);
      updates.push(`name = $${values.length}`);
    }

    if (data.mobileNumber !== undefined) {
      values.push(data.mobileNumber);
      updates.push(`mobile_number = $${values.length}`);
    }

    if (data.address !== undefined) {
      values.push(data.address);
      updates.push(`address = $${values.length}`);
    }

    if (data.gender !== undefined) {
      values.push(data.gender);
      updates.push(`gender = $${values.length}`);
    }

    if (data.dateOfBirth !== undefined) {
      values.push(data.dateOfBirth);
      updates.push(`date_of_birth = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.users
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning
          id,
          name,
          email,
          role,
          status,
          mobile_number,
          address,
          gender,
          date_of_birth,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  public async updateRole(id: string, role: UserRole): Promise<User | null> {
    const result = await this.databasePool.query(
      `
        update public.users
        set
          role = $2,
          updated_at = now()
        where id = $1
        returning
          id,
          name,
          email,
          role,
          status,
          mobile_number,
          address,
          gender,
          date_of_birth,
          created_at,
          updated_at
      `,
      [id, role],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  public async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const result = await this.databasePool.query(
      `
        update public.users
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning
          id,
          name,
          email,
          role,
          status,
          mobile_number,
          address,
          gender,
          date_of_birth,
          created_at,
          updated_at
      `,
      [id, status],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  public async countAll(): Promise<number> {
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.users
      `,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  public async getRoleBreakdown(): Promise<RoleBreakdownItem[]> {
    const result = await this.databasePool.query(
      `
        select
          role,
          count(*)::int as total
        from public.users
        group by role
        order by role asc
      `,
    );

    return result.rows.map((row) => ({
      role: String(row.role) as UserRole,
      total: Number(row.total),
    }));
  }

  private getTotalFromRows(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) {
      return 0;
    }

    return Number(rows[0].total_count ?? 0);
  }

  private mapRowToUser(row: Record<string, unknown>): User {
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role) as UserRole,
      status: String(row.status) as UserStatus,
      mobileNumber: String(row.mobile_number),
      address: String(row.address),
      gender: String(row.gender),
      dateOfBirth:
        row.date_of_birth instanceof Date
          ? row.date_of_birth.toISOString().slice(0, 10)
          : String(row.date_of_birth),
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

  private mapRowToUserSummary(row: Record<string, unknown>): UserSummary {
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role) as UserRole,
      status: String(row.status) as UserStatus,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at),
      relatedProfileSummary: {
        creatorProfileId:
          row.creator_profile_id === null ? null : String(row.creator_profile_id),
        brandManagerId:
          row.brand_manager_id === null ? null : String(row.brand_manager_id),
        brandId: row.brand_id === null ? null : String(row.brand_id),
      },
    };
  }
}
