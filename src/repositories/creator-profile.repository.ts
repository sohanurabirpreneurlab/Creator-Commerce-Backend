import { Pool } from "pg";
import { CreatorVerificationStatus } from "../constants/creator-verification-status.js";
import {
  CreatorProfile,
  CreatorProfileListItem,
  CreatorProfileListFilters,
  CreatorProfileRepositoryContract,
} from "../interfaces/creator-profile.interface.js";

export class CreatorProfileRepository implements CreatorProfileRepositoryContract {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    userId: string;
    displayName: string;
    bio: string | null;
    category: string | null;
    location: string | null;
    profileImageUrl: string | null;
    verificationStatus: CreatorVerificationStatus;
  }): Promise<CreatorProfile> {
    const result = await this.databasePool.query(
      `
        insert into public.creator_profiles (
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning
          id,
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status,
          created_at,
          updated_at
      `,
      [
        data.userId,
        data.displayName,
        data.bio,
        data.category,
        data.location,
        data.profileImageUrl,
        data.verificationStatus,
      ],
    );

    return this.mapRowToCreatorProfile(result.rows[0]);
  }

  public async findById(id: string): Promise<CreatorProfile | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status,
          created_at,
          updated_at
        from public.creator_profiles
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorProfile(result.rows[0]);
  }

  public async findByUserId(userId: string): Promise<CreatorProfile | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status,
          created_at,
          updated_at
        from public.creator_profiles
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorProfile(result.rows[0]);
  }

  public async findMany(
    filters: CreatorProfileListFilters,
  ): Promise<{ data: CreatorProfileListItem[]; total: number }> {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      whereClauses.push(
        `(cp.display_name ilike $${values.length} or u.email ilike $${values.length})`,
      );
    }

    if (filters.category) {
      values.push(filters.category);
      whereClauses.push(`cp.category = $${values.length}`);
    }

    if (filters.verificationStatus) {
      values.push(filters.verificationStatus);
      whereClauses.push(`cp.verification_status = $${values.length}`);
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
          cp.id,
          cp.user_id,
          cp.display_name,
          cp.bio,
          cp.category,
          cp.location,
          cp.profile_image_url,
          cp.verification_status,
          cp.created_at,
          cp.updated_at,
          u.email as user_email,
          count(csa.id)::int as social_accounts_count,
          count(*) over() as total_count
        from public.creator_profiles cp
        inner join public.users u on u.id = cp.user_id
        left join public.creator_social_accounts csa on csa.creator_profile_id = cp.id
        ${whereSql}
        group by cp.id, u.email
        order by cp.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToCreatorProfileListItem(row)),
      total: this.getTotalFromRows(result.rows),
    };
  }

  public async update(
    id: string,
    data: Partial<{
      displayName: string;
      bio: string | null;
      category: string | null;
      location: string | null;
      profileImageUrl: string | null;
    }>,
  ): Promise<CreatorProfile | null> {
    const values: Array<string | null> = [];
    const updates: string[] = [];

    if (data.displayName !== undefined) {
      values.push(data.displayName);
      updates.push(`display_name = $${values.length}`);
    }

    if (data.bio !== undefined) {
      values.push(data.bio);
      updates.push(`bio = $${values.length}`);
    }

    if (data.category !== undefined) {
      values.push(data.category);
      updates.push(`category = $${values.length}`);
    }

    if (data.location !== undefined) {
      values.push(data.location);
      updates.push(`location = $${values.length}`);
    }

    if (data.profileImageUrl !== undefined) {
      values.push(data.profileImageUrl);
      updates.push(`profile_image_url = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.creator_profiles
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning
          id,
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorProfile(result.rows[0]);
  }

  public async updateVerificationStatus(
    id: string,
    verificationStatus: CreatorVerificationStatus,
  ): Promise<CreatorProfile | null> {
    const result = await this.databasePool.query(
      `
        update public.creator_profiles
        set
          verification_status = $2,
          updated_at = now()
        where id = $1
        returning
          id,
          user_id,
          display_name,
          bio,
          category,
          location,
          profile_image_url,
          verification_status,
          created_at,
          updated_at
      `,
      [id, verificationStatus],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorProfile(result.rows[0]);
  }

  public async existsByUserId(userId: string): Promise<boolean> {
    const result = await this.databasePool.query(
      `
        select 1
        from public.creator_profiles
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  public async countAll(): Promise<number> {
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.creator_profiles
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

  private mapRowToCreatorProfile(row: Record<string, unknown>): CreatorProfile {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      displayName: String(row.display_name),
      bio: row.bio === null ? null : String(row.bio),
      category: row.category === null ? null : String(row.category),
      location: row.location === null ? null : String(row.location),
      profileImageUrl:
        row.profile_image_url === null ? null : String(row.profile_image_url),
      verificationStatus: String(
        row.verification_status,
      ) as CreatorVerificationStatus,
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

  private mapRowToCreatorProfileListItem(
    row: Record<string, unknown>,
  ): CreatorProfileListItem {
    return {
      ...this.mapRowToCreatorProfile(row),
      userEmail: String(row.user_email),
      socialAccountsCount: Number(row.social_accounts_count ?? 0),
    };
  }
}
