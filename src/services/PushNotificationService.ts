/**
 * Push Notification Service
 * 
 * This service provides utilities for managing push notifications
 * across the Altfragen.io application.
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  requireInteraction?: boolean;
}

export type NotificationType = 
  | 'new_questions'
  | 'exam_reminder'
  | 'learning_streak'
  | 'weekly_summary'
  | 'community_update'
  | 'performance_insight';

export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BNmLbOIqlFlibbHyioYNp6Y2KOtJnu49blYV-CH3-SxAkgNT4OwvYo_GJYKd85ahyqrN8nDOppfO-XYSN5DLF4U';
  
  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Check if user is currently subscribed
   */
  static async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    return await Notification.requestPermission();
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(userId: string): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
    });

    // Save subscription to backend
    await this.saveSubscription(userId, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(userId: string): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    await subscription.unsubscribe();
    await this.removeSubscription(userId);

    return true;
  }

  /**
   * Send a test notification
   */
  static async sendTestNotification(): Promise<void> {
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Test-Benachrichtigung', {
      body: 'Dies ist eine Test-Benachrichtigung von Altfragen.io',
      icon: '/pwa-icon.png',
      badge: '/favicon.ico',
      tag: 'test-notification',
    });
  }

  /**
   * Get notification template for a specific type
   */
  static getNotificationTemplate(
    type: NotificationType,
    data: Record<string, any>
  ): NotificationPayload {
    const templates: Record<NotificationType, (data: any) => NotificationPayload> = {
      new_questions: (data) => ({
        title: 'Neue Fragen verfügbar!',
        body: `${data.count} neue Fragen wurden zu "${data.datasetName}" hinzugefügt`,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'new-questions',
        data: { url: '/dashboard', datasetId: data.datasetId },
      }),
      
      exam_reminder: (data) => ({
        title: `Prüfung in ${data.daysLeft} ${data.daysLeft === 1 ? 'Tag' : 'Tagen'}!`,
        body: `Deine Prüfung "${data.examName}" findet bald statt. ${this.getExamMotivation(data.daysLeft)}`,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'exam-reminder',
        requireInteraction: data.daysLeft <= 1,
      }),
      
      learning_streak: (data) => ({
        title: data.broken ? 'Dein Lernstreak wartet!' : `${data.days}-Tage-Streak! 🔥`,
        body: data.broken 
          ? 'Nur 10 Minuten Training heute, um deinen Streak zu halten!'
          : `Großartig! Du lernst seit ${data.days} Tagen konsequent weiter!`,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'learning-streak',
      }),
      
      weekly_summary: (data) => ({
        title: 'Deine Wochenzusammenfassung 📊',
        body: `Diese Woche: ${data.questionsAnswered} Fragen, ${data.accuracy}% richtig!`,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'weekly-summary',
        data: { url: '/dashboard' },
      }),
      
      community_update: (data) => ({
        title: data.title || 'Community-Update',
        body: data.message,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'community-update',
      }),
      
      performance_insight: (data) => ({
        title: 'Performance-Update 🎯',
        body: data.message,
        icon: '/pwa-icon.png',
        badge: '/favicon.ico',
        tag: 'performance-insight',
        data: { url: '/dashboard' },
      }),
    };

    return templates[type](data);
  }

  /**
   * Get motivational message based on days until exam
   */
  private static getExamMotivation(daysLeft: number): string {
    if (daysLeft <= 1) return 'Du schaffst das! 💪';
    if (daysLeft <= 3) return 'Zeit für letzte Wiederholungen!';
    if (daysLeft <= 7) return 'Zeit für intensive Vorbereitung!';
    return 'Weiter so! 🎯';
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Save subscription to backend
   */
  private static async saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/save-push-subscription`;
    
    const subscriptionJson = subscription.toJSON();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        type: 'user',
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save subscription');
    }
  }

  /**
   * Remove subscription from backend
   */
  private static async removeSubscription(userId: string): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/remove-push-subscription`;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return;
    }
    
    const subscriptionJson = subscription.toJSON();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove subscription');
    }
  }

  /**
   * Subscribe to IMPPulse broadcast notifications (no authentication required)
   */
  static async subscribeToBroadcast(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });
    }

    // Save subscription to backend
    await this.saveBroadcastSubscription(subscription);

    return subscription;
  }

  /**
   * Unsubscribe from IMPPulse broadcast notifications
   */
  static async unsubscribeFromBroadcast(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    await this.removeBroadcastSubscription(subscription);
    await subscription.unsubscribe();

    return true;
  }

  /**
   * Save broadcast subscription to backend
   */
  private static async saveBroadcastSubscription(
    subscription: PushSubscription
  ): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const endpoint = `${supabaseUrl}/functions/v1/save-push-subscription`;
    
    const subscriptionJson = subscription.toJSON();
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
          type: 'broadcast',
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to save subscription';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        console.error('Backend save error:', errorMessage);
        // Don't throw - subscription is still active locally
      }
    } catch (error) {
      console.error('Error saving subscription to backend:', error);
      // Don't throw - subscription is still active locally
    }
  }

  /**
   * Remove broadcast subscription from backend
   */
  private static async removeBroadcastSubscription(
    subscription: PushSubscription
  ): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const endpoint = `${supabaseUrl}/functions/v1/remove-push-subscription`;
    
    const subscriptionJson = subscription.toJSON();
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to remove subscription';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        console.error('Backend remove error:', errorMessage);
        // Don't throw - subscription is still removed locally
      }
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
      // Don't throw - subscription is still removed locally
    }
  }

  /**
   * Check if currently subscribed to broadcast notifications
   */
  static async isSubscribedToBroadcast(): Promise<boolean> {
    return await this.isSubscribed();
  }
}

/**
 * Hook for using push notifications in React components
 */
export const usePushNotifications = () => {
  return {
    isSupported: PushNotificationService.isSupported(),
    getPermissionStatus: PushNotificationService.getPermissionStatus,
    isSubscribed: PushNotificationService.isSubscribed,
    requestPermission: PushNotificationService.requestPermission,
    subscribe: PushNotificationService.subscribe,
    unsubscribe: PushNotificationService.unsubscribe,
    sendTestNotification: PushNotificationService.sendTestNotification,
  };
};

export default PushNotificationService;

