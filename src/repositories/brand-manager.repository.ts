import { Pool } from "pg";
import { BrandManagerStatus } from "../constants/brand-manager-status.js";
import {
  BrandManager,
  BrandManagerListFilters,
  BrandManagerRepositoryContract,
} from "../interfaces/brand-manager.interface.js";

export class BrandManagerRepository implements BrandManagerRepositoryContract {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    userId: string;
    brandId: string;
    designation: string | null;
    status: BrandManagerStatus;
    assignedBy: string | null;
  }): Promise<BrandManager> {
    const result = await this.databasePool.query(
      `
        insert into public.brand_managers (
          user_id,
          brand_id,
          designation,
          status,
          assigned_by
        )
        values ($1, $2, $3, $4, $5)
        returning
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
      `,
      [
        data.userId,
        data.brandId,
        data.designation,
        data.status,
        data.assignedBy,
      ],
    );

    return this.mapRowToBrandManager(result.rows[0]);
  }

  public async findById(id: string): Promise<BrandManager | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
        from public.brand_managers
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrandManager(result.rows[0]);
  }

  public async findByUserId(userId: string): Promise<BrandManager[]> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
        from public.brand_managers
        where user_id = $1
        order by created_at desc
      `,
      [userId],
    );

    return result.rows.map((row) => this.mapRowToBrandManager(row));
  }

  public async findManyByBrandId(brandId: string): Promise<BrandManager[]> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
        from public.brand_managers
        where brand_id = $1
        order by created_at desc
      `,
      [brandId],
    );

    return result.rows.map((row) => this.mapRowToBrandManager(row));
  }

  public async findMany(
    filters: BrandManagerListFilters,
  ): Promise<{ data: BrandManager[]; total: number }> {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
    }

    if (filters.brandId) {
      values.push(filters.brandId);
      whereClauses.push(`brand_id = $${values.length}`);
    }

    if (filters.userId) {
      values.push(filters.userId);
      whereClauses.push(`user_id = $${values.length}`);
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
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at,
          count(*) over() as total_count
        from public.brand_managers
        ${whereSql}
        order by created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToBrandManager(row)),
      total: this.getTotalFromRows(result.rows),
    };
  }

  public async findByUserAndBrand(
    userId: string,
    brandId: string,
  ): Promise<BrandManager | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
        from public.brand_managers
        where user_id = $1
          and brand_id = $2
        limit 1
      `,
      [userId, brandId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrandManager(result.rows[0]);
  }

  public async update(
    id: string,
    data: Partial<{
      designation: string | null;
      status: BrandManagerStatus;
    }>,
  ): Promise<BrandManager | null> {
    const values: Array<string | null> = [];
    const updates: string[] = [];

    if (data.designation !== undefined) {
      values.push(data.designation);
      updates.push(`designation = $${values.length}`);
    }

    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.brand_managers
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrandManager(result.rows[0]);
  }

  public async updateStatus(
    id: string,
    status: BrandManagerStatus,
  ): Promise<BrandManager | null> {
    const result = await this.databasePool.query(
      `
        update public.brand_managers
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning
          id,
          user_id,
          brand_id,
          designation,
          status,
          assigned_by,
          created_at,
          updated_at
      `,
      [id, status],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrandManager(result.rows[0]);
  }

  public async countAll(): Promise<number> {
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.brand_managers
        where status <> 'REMOVED'
      `,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private getTotalFromRows(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) {
      return 0;
    }

    return Number(rows[0].total_count ?? 0);
  }

  private mapRowToBrandManager(row: Record<string, unknown>): BrandManager {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      brandId: String(row.brand_id),
      designation: row.designation === null ? null : String(row.designation),
      status: String(row.status) as BrandManagerStatus,
      assignedBy: row.assigned_by === null ? null : String(row.assigned_by),
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
