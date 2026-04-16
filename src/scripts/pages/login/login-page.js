import StoryApi from '../../data/api';
import SessionHelper from '../../utils/session-helper';

export default class LoginPage {
  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-card">
          <h1>Login</h1>
          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="********">
            </div>
            <button type="submit" class="btn-primary">Login</button>
          </form>
          <p>Don't have an account? <a href="/#/register">Register here</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const result = await StoryApi.login({ email, password });
        if (result.error) {
          alert(result.message);
        } else {
          SessionHelper.setToken(result.loginResult.token);
          window.location.hash = '/';
        }
      } catch (error) {
        alert('Login failed. Please try again.');
      }
    });
  }
}
