import CONFIG from '../config';

const NotificationHelper = {
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker is not supported by this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async isSubscribed() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  },

  async subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY),
      });

      console.log('User subscribed:', subscription);
      // In a real app, you would send this subscription object to your backend
      // await this._sendSubscriptionToApi(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      throw error;
    }
  },

  async unsubscribeUser() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('User unsubscribed');
      // In a real app, you would notify your backend to remove this subscription
    }
  },

  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};

export default NotificationHelper;
