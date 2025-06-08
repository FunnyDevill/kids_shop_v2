export class AuthService {
  constructor() {
    this.currentUser = this.getStoredUser();
    this.init();
  }

  init() {
    this.renderAuthState();
    this.setupListeners();
  }

  getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  async handleLogin(email, password) {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Некорректный email');
      }
      if (!password) {
        throw new Error('Введите пароль');
      }

      const user = await this.mockApiRequest('/login', { email, password });
      
      this.currentUser = user;
      this.persistUser(user);
      this.renderAuthState();
      this.dispatchAuthEvent('login');
      return true;
    } catch (error) {
      this.handleAuthError(error);
      return false;
    }
  }

  async handleRegister(name, email, password) {
    try {
      if (!name || !email || !password) {
        throw new Error('Заполните все поля');
      }
      if (!this.validateEmail(email)) {
        throw new Error('Некорректный email');
      }
      if (password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
      }

      const user = await this.mockApiRequest('/register', { name, email, password });
      
      this.currentUser = user;
      this.persistUser(user);
      this.renderAuthState();
      this.dispatchAuthEvent('register');
      return true;
    } catch (error) {
      this.handleAuthError(error);
      return false;
    }
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async mockApiRequest(url, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.05) {
          reject(new Error('Ошибка сервера'));
        } else {
          resolve({
            ...data,
            token: 'fake-jwt-token',
            id: Math.random().toString(36).substr(2, 9)
          });
        }
      }, 1000);
    });
  }

  persistUser(user) {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  renderAuthState() {
    const authElements = document.querySelectorAll('[data-auth-state]');
    authElements.forEach(element => {
      element.hidden = !!this.currentUser !== (element.dataset.authState === 'authenticated');
    });

    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(element => {
      element.textContent = this.currentUser?.name || '';
    });
  }

  setupListeners() {
    this.addFormListener('login-form', async (data) => {
      await this.handleLogin(data.email, data.password);
    });

    this.addFormListener('register-form', async (data) => {
      await this.handleRegister(data.name, data.email, data.password);
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-logout]')) {
        this.handleLogout();
      }
    });
  }

  addFormListener(formId, handler) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      await handler(Object.fromEntries(formData));
    });
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.currentUser = null;
    this.renderAuthState();
    this.dispatchAuthEvent('logout');
  }

  dispatchAuthEvent(type) {
    const event = new CustomEvent('auth-change', {
      detail: { type, user: this.currentUser }
    });
    document.dispatchEvent(event);
  }

  handleAuthError(error) {
    console.error('Auth error:', error);
    const message = error.message || 'Произошла ошибка';
    this.dispatchAuthEvent('error', { error: message });
  }
}