import { UserRole } from "../constants/roles.js";
import { ProfileCompletion } from "../interfaces/profile.interface.js";

type CompletionField = {
  label: string;
  value: unknown;
  type?: "array";
};

type CreatorCompletionData = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  creatorProfile?: {
    displayName?: string | null;
    bio?: string | null;
    category?: string | null;
    location?: string | null;
    profileImageUrl?: string | null;
  } | null;
  socialAccounts?: unknown[] | null;
};

type BrandManagerCompletionData = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  brandManager?: {
    designation?: string | null;
  } | null;
  brand?: {
    name?: string | null;
    industry?: string | null;
    website?: string | null;
    contactEmail?: string | null;
    logoUrl?: string | null;
  } | null;
};

type SuperAdminCompletionData = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

export class ProfileCompletionService {
  public calculateCompletion(
    role: UserRole,
    profileData:
      | CreatorCompletionData
      | BrandManagerCompletionData
      | SuperAdminCompletionData,
  ): ProfileCompletion {
    if (role === UserRole.CREATOR) {
      return this.calculateFromFields([
        { label: "Name", value: (profileData as CreatorCompletionData).user?.name },
        { label: "Email", value: (profileData as CreatorCompletionData).user?.email },
        {
          label: "Display name",
          value: (profileData as CreatorCompletionData).creatorProfile?.displayName,
        },
        { label: "Bio", value: (profileData as CreatorCompletionData).creatorProfile?.bio },
        {
          label: "Category",
          value: (profileData as CreatorCompletionData).creatorProfile?.category,
        },
        {
          label: "Location",
          value: (profileData as CreatorCompletionData).creatorProfile?.location,
        },
        {
          label: "Profile image URL",
          value: (profileData as CreatorCompletionData).creatorProfile?.profileImageUrl,
        },
        {
          label: "Social account",
          value: (profileData as CreatorCompletionData).socialAccounts,
          type: "array",
        },
      ]);
    }

    if (role === UserRole.BRAND_MANAGER) {
      return this.calculateFromFields([
        {
          label: "Name",
          value: (profileData as BrandManagerCompletionData).user?.name,
        },
        {
          label: "Email",
          value: (profileData as BrandManagerCompletionData).user?.email,
        },
        {
          label: "Designation",
          value: (profileData as BrandManagerCompletionData).brandManager?.designation,
        },
        {
          label: "Brand name",
          value: (profileData as BrandManagerCompletionData).brand?.name,
        },
        {
          label: "Brand industry",
          value: (profileData as BrandManagerCompletionData).brand?.industry,
        },
        {
          label: "Brand website",
          value: (profileData as BrandManagerCompletionData).brand?.website,
        },
        {
          label: "Brand contact email",
          value: (profileData as BrandManagerCompletionData).brand?.contactEmail,
        },
        {
          label: "Brand logo",
          value: (profileData as BrandManagerCompletionData).brand?.logoUrl,
        },
      ]);
    }

    return this.calculateFromFields([
      { label: "Name", value: (profileData as SuperAdminCompletionData).user?.name },
      { label: "Email", value: (profileData as SuperAdminCompletionData).user?.email },
      { label: "Role", value: (profileData as SuperAdminCompletionData).user?.role },
    ]);
  }

  private calculateFromFields(fields: CompletionField[]): ProfileCompletion {
    // Completion rules intentionally live on the backend so every client sees
    // the same progress result. The frontend only renders the returned data.
    const missingFields = fields
      .filter((field) => !this.isCompleted(field))
      .map((field) => field.label);
    const totalFields = fields.length;
    const completedFields = totalFields - missingFields.length;
    const percentage =
      totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      completedFields,
      totalFields,
      missingFields,
    };
  }

  private isCompleted(field: CompletionField) {
    if (field.type === "array") {
      return Array.isArray(field.value) && field.value.length > 0;
    }

    if (field.value === null || field.value === undefined) {
      return false;
    }

    if (typeof field.value === "string") {
      return field.value.trim().length > 0;
    }

    return true;
  }
}
