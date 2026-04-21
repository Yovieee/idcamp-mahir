// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import NotificationHelper from './utils/notification-helper';
import InstallHelper from './utils/install-helper';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  // Register service worker
  await NotificationHelper.registerServiceWorker();

  // Initialize PWA Installation helper
  InstallHelper.init();

  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});
