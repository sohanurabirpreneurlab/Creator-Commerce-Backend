import { Pool } from "pg";
import { UserRole } from "../constants/roles.js";
import { AuthUser, AuthUserRecord } from "../interfaces/auth.interface.js";

export class AuthRepository {
  constructor(private readonly databasePool: Pool) {}

  public async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          email,
          role,
          mobile_number,
          address,
          gender,
          date_of_birth,
          password_hash,
          created_at
        from public.users
        where lower(email) = lower($1)
        limit 1
      `,
      [email.trim()],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToAuthUserRecord(result.rows[0]);
  }

  public async findByIdentifier(
    identifier: string,
  ): Promise<AuthUserRecord | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          email,
          role,
          mobile_number,
          address,
          gender,
          date_of_birth,
          password_hash,
          created_at
        from public.users
        where lower(email) = lower($1)
          or mobile_number = $1
        limit 1
      `,
      [identifier.trim()],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToAuthUserRecord(result.rows[0]);
  }

  public async findById(id: string): Promise<AuthUserRecord | null> {
    const result = await this.databasePool.query(
      `
        select
          id,
          name,
          email,
          role,
          mobile_number,
          address,
          gender,
          date_of_birth,
          password_hash,
          created_at
        from public.users
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToAuthUserRecord(result.rows[0]);
  }

  public async create(
    user: Omit<AuthUser, "id" | "createdAt"> & { passwordHash: string },
  ): Promise<AuthUserRecord> {
    const result = await this.databasePool.query(
      `
        insert into public.users (
          name,
          email,
          role,
          mobile_number,
          address,
          gender,
          date_of_birth,
          password_hash
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning
          id,
          name,
          email,
          role,
          mobile_number,
          address,
          gender,
          date_of_birth,
          password_hash,
          created_at
      `,
      [
        user.name,
        user.email,
        user.role,
        user.mobileNumber,
        user.address,
        user.gender,
        user.dateOfBirth,
        user.passwordHash,
      ],
    );

    return this.mapRowToAuthUserRecord(result.rows[0]);
  }

  private mapRowToAuthUserRecord(row: Record<string, unknown>): AuthUserRecord {
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role) as UserRole,
      mobileNumber: String(row.mobile_number),
      address: String(row.address),
      gender: String(row.gender),
      dateOfBirth:
        row.date_of_birth instanceof Date
          ? row.date_of_birth.toISOString().slice(0, 10)
          : String(row.date_of_birth),
      passwordHash:
        row.password_hash === null ? null : String(row.password_hash),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    };
  }
}
