import { Pool } from "pg";
import { SocialPlatform } from "../constants/social-platform.js";
import {
  CreatorSocialAccount,
  CreatorSocialAccountRepositoryContract,
} from "../interfaces/creator-social-account.interface.js";

export class CreatorSocialAccountRepository
  implements CreatorSocialAccountRepositoryContract
{
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    creatorProfileId: string;
    platform: SocialPlatform;
    profileUrl: string;
    followersCount: number;
    engagementRate: number | null;
    verified: boolean;
  }): Promise<CreatorSocialAccount> {
    const result = await this.databasePool.query(
      `
        insert into public.creator_social_accounts (
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified
        )
        values ($1, $2, $3, $4, $5, $6)
        returning
          id,
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified,
          created_at,
          updated_at
      `,
      [
        data.creatorProfileId,
        data.platform,
        data.profileUrl,
        data.followersCount,
        data.engagementRate,
        data.verified,
      ],
    );

    return this.mapRowToCreatorSocialAccount(result.rows[0]);
  }

  public async findById(id: string): Promise<CreatorSocialAccount | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified,
          created_at,
          updated_at
        from public.creator_social_accounts
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorSocialAccount(result.rows[0]);
  }

  public async findManyByCreatorProfileId(
    creatorProfileId: string,
  ): Promise<CreatorSocialAccount[]> {
    const result = await this.databasePool.query(
      `
        select
          id,
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified,
          created_at,
          updated_at
        from public.creator_social_accounts
        where creator_profile_id = $1
        order by created_at desc
      `,
      [creatorProfileId],
    );

    return result.rows.map((row) => this.mapRowToCreatorSocialAccount(row));
  }

  public async update(
    id: string,
    data: Partial<{
      profileUrl: string;
      followersCount: number;
      engagementRate: number | null;
      verified: boolean;
    }>,
  ): Promise<CreatorSocialAccount | null> {
    const values: Array<string | number | boolean | null> = [];
    const updates: string[] = [];

    if (data.profileUrl !== undefined) {
      values.push(data.profileUrl);
      updates.push(`profile_url = $${values.length}`);
    }

    if (data.followersCount !== undefined) {
      values.push(data.followersCount);
      updates.push(`followers_count = $${values.length}`);
    }

    if (data.engagementRate !== undefined) {
      values.push(data.engagementRate);
      updates.push(`engagement_rate = $${values.length}`);
    }

    if (data.verified !== undefined) {
      values.push(data.verified);
      updates.push(`verified = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.creator_social_accounts
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning
          id,
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified,
          created_at,
          updated_at
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorSocialAccount(result.rows[0]);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.databasePool.query(
      `
        delete from public.creator_social_accounts
        where id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  public async findByCreatorPlatformAndUrl(
    creatorProfileId: string,
    platform: SocialPlatform,
    profileUrl: string,
  ): Promise<CreatorSocialAccount | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          creator_profile_id,
          platform,
          profile_url,
          followers_count,
          engagement_rate,
          verified,
          created_at,
          updated_at
        from public.creator_social_accounts
        where creator_profile_id = $1
          and platform = $2
          and profile_url = $3
        limit 1
      `,
      [creatorProfileId, platform, profileUrl],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCreatorSocialAccount(result.rows[0]);
  }

  private mapRowToCreatorSocialAccount(
    row: Record<string, unknown>,
  ): CreatorSocialAccount {
    return {
      id: String(row.id),
      creatorProfileId: String(row.creator_profile_id),
      platform: String(row.platform) as SocialPlatform,
      profileUrl: String(row.profile_url),
      followersCount: Number(row.followers_count),
      engagementRate:
        row.engagement_rate === null ? null : Number(row.engagement_rate),
      verified: Boolean(row.verified),
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
