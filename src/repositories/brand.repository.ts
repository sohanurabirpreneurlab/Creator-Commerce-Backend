import { Pool } from "pg";
import { BrandStatus } from "../constants/brand-status.js";
import {
  Brand,
  BrandListFilters,
  BrandRepositoryContract,
} from "../interfaces/brand.interface.js";

export class BrandRepository implements BrandRepositoryContract {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    name: string;
    industry: string | null;
    website: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    status: BrandStatus;
    createdBy: string | null;
  }): Promise<Brand> {
    const result = await this.databasePool.query(
      `
        insert into public.brands (
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning
          id,
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by,
          created_at,
          updated_at
      `,
      [
        data.name,
        data.industry,
        data.website,
        data.logoUrl,
        data.contactEmail,
        data.status,
        data.createdBy,
      ],
    );

    return this.mapRowToBrand(result.rows[0]);
  }

  public async findById(id: string): Promise<Brand | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by,
          created_at,
          updated_at
        from public.brands
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrand(result.rows[0]);
  }

  public async findMany(
    filters: BrandListFilters,
  ): Promise<{ data: Brand[]; total: number }> {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    // Build the filter list incrementally so every dynamic value still goes
    // through pg parameter binding. This avoids unsafe string interpolation.
    if (filters.search) {
      values.push(`%${filters.search}%`);
      whereClauses.push(`name ilike $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
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
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by,
          created_at,
          updated_at,
          count(*) over() as total_count
        from public.brands
        ${whereSql}
        order by created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToBrand(row)),
      total: this.getTotalFromRows(result.rows),
    };
  }

  public async update(
    id: string,
    data: Partial<{
      name: string;
      industry: string | null;
      website: string | null;
      logoUrl: string | null;
      contactEmail: string | null;
    }>,
  ): Promise<Brand | null> {
    const values: Array<string | null> = [];
    const updates: string[] = [];

    if (data.name !== undefined) {
      values.push(data.name);
      updates.push(`name = $${values.length}`);
    }

    if (data.industry !== undefined) {
      values.push(data.industry);
      updates.push(`industry = $${values.length}`);
    }

    if (data.website !== undefined) {
      values.push(data.website);
      updates.push(`website = $${values.length}`);
    }

    if (data.logoUrl !== undefined) {
      values.push(data.logoUrl);
      updates.push(`logo_url = $${values.length}`);
    }

    if (data.contactEmail !== undefined) {
      values.push(data.contactEmail);
      updates.push(`contact_email = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.brands
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning
          id,
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrand(result.rows[0]);
  }

  public async updateStatus(id: string, status: BrandStatus): Promise<Brand | null> {
    const result = await this.databasePool.query(
      `
        update public.brands
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning
          id,
          name,
          industry,
          website,
          logo_url,
          contact_email,
          status,
          created_by,
          created_at,
          updated_at
      `,
      [id, status],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToBrand(result.rows[0]);
  }

  public async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const values: string[] = [name];
    let extraClause = "";

    if (excludeId) {
      values.push(excludeId);
      extraClause = `and id <> $2`;
    }

    const result = await this.databasePool.query(
      `
        select 1
        from public.brands
        where lower(name) = lower($1)
        ${extraClause}
        limit 1
      `,
      values,
    );

    return (result.rowCount ?? 0) > 0;
  }

  public async countAll(): Promise<number> {
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.brands
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

  private mapRowToBrand(row: Record<string, unknown>): Brand {
    return {
      id: String(row.id),
      name: String(row.name),
      industry: row.industry === null ? null : String(row.industry),
      website: row.website === null ? null : String(row.website),
      logoUrl: row.logo_url === null ? null : String(row.logo_url),
      contactEmail:
        row.contact_email === null ? null : String(row.contact_email),
      status: String(row.status) as BrandStatus,
      createdBy: row.created_by === null ? null : String(row.created_by),
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
