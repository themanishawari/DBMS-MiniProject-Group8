import { complaintRepository } from '../repositories';
import { Notification } from '../types';

export class NotificationService {
  public static async sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    complaintId?: string
  ): Promise<Notification> {
    const notif = await complaintRepository.createNotification({
      userId,
      title,
      message,
      type,
      complaintId,
    });

    // Simulated email delivery logger for development prototype
    this.simulateEmailDelivery(userId, title, message);

    return notif;
  }

  public static simulateEmailDelivery(userEmailOrId: string, subject: string, bodyText: string): void {
    console.info(
      `[SIMULATED EMAIL LOG] To: ${userEmailOrId} | Subject: "${subject}" | Content: "${bodyText.substring(0, 80)}..." (Note: Email delivery stub active; configured for production SMTP/SendGrid)`
    );
  }

  public static async getUserNotifications(userId: string): Promise<Notification[]> {
    return complaintRepository.getNotifications(userId);
  }

  public static async markAsRead(notificationId: string): Promise<void> {
    return complaintRepository.markNotificationAsRead(notificationId);
  }

  public static async markAllAsRead(userId: string): Promise<void> {
    return complaintRepository.markAllNotificationsAsRead(userId);
  }
}
