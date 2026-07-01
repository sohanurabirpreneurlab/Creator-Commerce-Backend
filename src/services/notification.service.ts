import { NotificationType, NOTIFICATION_TYPES } from "../constants/notification.constants.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CreateNotificationDto,
  NotificationQueryDto,
} from "../interfaces/notification.interface.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import { validateEnumValue } from "../utils/validation.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  public async createNotification(data: CreateNotificationDto) {
    return this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? NotificationType.GENERAL,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    });
  }

  public async getMyNotifications(
    query: NotificationQueryDto,
    currentUser: CurrentUser,
  ) {
    const pagination = parsePaginationQuery(query);
    const type =
      query.type === undefined
        ? undefined
        : validateEnumValue(query.type, NOTIFICATION_TYPES, "type");
    const isRead =
      query.isRead === undefined
        ? undefined
        : query.isRead === "true"
          ? true
          : query.isRead === "false"
            ? false
            : undefined;

    const result = await this.notificationRepository.findManyByUserId(
      currentUser.id,
      {
        page: pagination.page,
        limit: pagination.limit,
        isRead,
        type,
      },
    );

    return {
      data: result.data,
      meta: createPaginationMeta(
        pagination.page,
        pagination.limit,
        result.total,
      ),
    };
  }

  public async markAsRead(id: string, currentUser: CurrentUser) {
    const updatedNotification = await this.notificationRepository.markAsRead(
      id,
      currentUser.id,
    );

    if (!updatedNotification) {
      throw new NotFoundError(
        "Notification not found.",
        "NOTIFICATION_NOT_FOUND",
      );
    }

    return updatedNotification;
  }

  public async markAllAsRead(currentUser: CurrentUser) {
    const markedCount = await this.notificationRepository.markAllAsRead(
      currentUser.id,
    );

    return {
      updatedCount: markedCount,
    };
  }

  public async notifyUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    entity?: {
      entityType?: string;
      entityId?: string;
    },
  ) {
    return this.notificationRepository.create({
      userId,
      title,
      message,
      type,
      entityType: entity?.entityType ?? null,
      entityId: entity?.entityId ?? null,
    });
  }
}
