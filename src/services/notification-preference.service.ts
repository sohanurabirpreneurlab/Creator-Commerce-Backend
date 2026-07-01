import { CurrentUser } from "../interfaces/current-user.interface.js";
import { UpdateNotificationPreferencesDto } from "../interfaces/notification-preference.interface.js";
import { NotificationPreferenceRepository } from "../repositories/notification-preference.repository.js";

export class NotificationPreferenceService {
  constructor(
    private readonly notificationPreferenceRepository: NotificationPreferenceRepository,
  ) {}

  public async getMyPreferences(currentUser: CurrentUser) {
    return this.ensureDefaultPreferences(currentUser.id);
  }

  public async updateMyPreferences(
    dto: UpdateNotificationPreferencesDto,
    currentUser: CurrentUser,
  ) {
    const existingPreference = await this.notificationPreferenceRepository.findByUserId(
      currentUser.id,
    );

    if (!existingPreference) {
      return this.notificationPreferenceRepository.upsertForUser(
        currentUser.id,
        dto,
      );
    }

    return (
      (await this.notificationPreferenceRepository.updateForUser(
        currentUser.id,
        dto,
      )) ?? existingPreference
    );
  }

  public async ensureDefaultPreferences(userId: string) {
    const existingPreference = await this.notificationPreferenceRepository.findByUserId(
      userId,
    );

    if (existingPreference) {
      return existingPreference;
    }

    return this.notificationPreferenceRepository.createDefault(userId);
  }
}
