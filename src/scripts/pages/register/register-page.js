import StoryApi from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container auth-container">
        <div class="auth-card">
          <h1>Register</h1>
          <h2 class="auth-subtitle">Join us to share your amazing stories!</h2>
          <form id="register-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" required placeholder="Your Name">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="********">
            </div>
            <button type="submit" class="btn-primary">Register</button>
          </form>
          <p>Already have an account? <a href="/#/login">Login here</a></p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const result = await StoryApi.register({ name, email, password });
        if (result.error) {
          alert(result.message);
        } else {
          alert('Registration successful! Please login.');
          window.location.hash = '/login';
        }
      } catch (error) {
        alert('Registration failed. Please try again.');
      }
    });
  }
}
