// Notification Service for scheduling daily progress notifications

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  scheduledTime: Date;
}

class NotificationService {
  private notifications: Map<string, NodeJS.Timeout> = new Map();

  async scheduleDailyNotification(userId: string): Promise<void> {
    try {
      // Clear existing notification for this user
      this.cancelNotification(userId);

      // Schedule new notification for 8 PM daily
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(20, 0, 0, 0); // 8 PM

      // If it's already past 8 PM today, schedule for tomorrow
      if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();

      const timeoutId = setTimeout(async () => {
        await this.sendDailyProgressNotification(userId);
        // Reschedule for next day
        this.scheduleDailyNotification(userId);
      }, delay);

      this.notifications.set(userId, timeoutId);

      console.log(`Daily notification scheduled for user ${userId} at ${scheduledTime.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
      throw new Error('Failed to schedule daily notification');
    }
  }

  private async sendDailyProgressNotification(userId: string): Promise<void> {
    try {
      // TODO: Implement actual push notification sending
      // This could use services like Firebase Cloud Messaging, OneSignal, etc.
      
      /*
      Example with Firebase Cloud Messaging:
      
      const admin = require('firebase-admin');
      
      const message = {
        notification: {
          title: 'Progresso Diário - NutrIA',
          body: await this.generateProgressMessage(userId),
        },
        token: userDeviceToken, // Get from user preferences
      };
      
      await admin.messaging().send(message);
      */

      // For now, just log the notification
      const progressMessage = await this.generateProgressMessage(userId);
      console.log(`📱 Daily notification for user ${userId}: ${progressMessage}`);
      
      // In a real implementation, you would:
      // 1. Get user's device token from database
      // 2. Send push notification via FCM, APNs, or similar service
      // 3. Store notification history for tracking
      
    } catch (error) {
      console.error('Error sending daily progress notification:', error);
    }
  }

  private async generateProgressMessage(userId: string): Promise<string> {
    try {
      // Get today's nutrition data
      const today = new Date().toISOString().split('T')[0];
      
      // TODO: Get actual user data and calculate progress
      // const user = await storage.getUser(userId);
      // const todayNutrition = await storage.getDailyNutrition(userId, today);
      
      // Placeholder implementation
      const progress = {
        caloriesConsumed: 1520,
        caloriesGoal: 2000,
        proteinConsumed: 72,
        proteinGoal: 120,
        carbsConsumed: 180,
        carbsGoal: 225,
        fatConsumed: 45,
        fatGoal: 67,
      };
      
      const caloriesRemaining = progress.caloriesGoal - progress.caloriesConsumed;
      const proteinRemaining = progress.proteinGoal - progress.proteinConsumed;
      
      if (caloriesRemaining > 0) {
        return `🎯 Faltam ${caloriesRemaining} kcal e ${proteinRemaining}g de proteína para sua meta diária!`;
      } else if (caloriesRemaining < -200) {
        return `⚠️ Você passou ${Math.abs(caloriesRemaining)} kcal da sua meta hoje. Que tal uma caminhada?`;
      } else {
        return `🎉 Parabéns! Você atingiu sua meta de calorias hoje! Proteína: ${progress.proteinConsumed}/${progress.proteinGoal}g`;
      }
    } catch (error) {
      console.error('Error generating progress message:', error);
      return '📊 Confira seu progresso nutricional de hoje no NutrIA!';
    }
  }

  cancelNotification(userId: string): void {
    const timeoutId = this.notifications.get(userId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.notifications.delete(userId);
    }
  }

  // Method to send immediate notifications (for testing or special cases)
  async sendImmediateNotification(userId: string, title: string, message: string): Promise<void> {
    try {
      // TODO: Implement immediate push notification
      console.log(`📱 Immediate notification for user ${userId}: ${title} - ${message}`);
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
