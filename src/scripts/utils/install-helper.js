const InstallHelper = {
  init() {
    this.deferredPrompt = null;
    this.installButton = document.getElementById('install-button');

    if (!this.installButton) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      this.showInstallButton();
    });

    this.installButton.addEventListener('click', async () => {
      if (!this.deferredPrompt) {
        return;
      }
      // Show the install prompt
      this.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      this.deferredPrompt = null;
      // Hide the install button
      this.hideInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      // Hide the app-provided install promotion
      this.hideInstallButton();
      // Clear the deferredPrompt so it can be garbage collected
      this.deferredPrompt = null;
      console.log('PWA was installed');
    });
  },

  showInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'block';
    }
  },

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }
};

export default InstallHelper;
