const SessionHelper = {
  setToken(token) {
    localStorage.setItem('STORY_APP_TOKEN', token);
  },

  getToken() {
    return localStorage.getItem('STORY_APP_TOKEN');
  },

  removeToken() {
    localStorage.removeItem('STORY_APP_TOKEN');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default SessionHelper;
