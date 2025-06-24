export class AuthService {
  constructor() {
    this.currentUser = this.getStoredUser();
    this.currentTab = 'login'; // Текущая активная вкладка
    this.init();
  }

  init() {
    this.renderAuthState();
    this.setupListeners();
    this.switchAuthTab('login'); // Инициализация начального состояния
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
    // Обработчики форм
    this.addFormListener('login-form', async (data) => {
      await this.handleLogin(data.email, data.password);
    });

    this.addFormListener('register-form', async (data) => {
      await this.handleRegister(data.name, data.email, data.password);
    });

    // Обработчики кнопок
    document.addEventListener('click', (e) => {
      // Выход
      if (e.target.closest('[data-logout]')) {
        this.handleLogout();
      }
      
      // Переключение вкладок через табы
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        e.preventDefault();
        this.switchAuthTab(tabBtn.dataset.tab);
      }
      
      // Переключение через кнопку "Зарегистрируйтесь"
      const switchBtn = e.target.closest('[data-switch-to]');
      if (switchBtn) {
        e.preventDefault();
        this.switchAuthTab(switchBtn.dataset.switchTo);
      }
    });
  }

  switchAuthTab(tabName) {
    if (this.currentTab === tabName) return;
    this.currentTab = tabName;
    
    // Обновляем состояние кнопок вкладок
    document.querySelectorAll('[data-tab]').forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    // Обновляем состояние форм
    document.querySelectorAll('[data-form]').forEach(form => {
      const isActive = form.dataset.form === tabName;
      form.classList.toggle('active', isActive);
      form.setAttribute('aria-hidden', !isActive);
    });

    // Сбрасываем ошибки
    this.clearErrors();
  }

  clearErrors() {
    document.querySelectorAll('.auth-error, .form-error').forEach(el => {
      el.textContent = '';
    });
  }

  addFormListener(formId, handler) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const formValues = Object.fromEntries(formData);
      
      // Валидация полей перед отправкой
      const isValid = this.validateForm(form, formValues);
      if (!isValid) return;
      
      await handler(formValues);
    });
  }

  validateForm(form, formValues) {
    let isValid = true;
    
    // Проверка email для обеих форм
    if (formValues.email && !this.validateEmail(formValues.email)) {
      this.showFormError(form, 'email', 'Некорректный email');
      isValid = false;
    }
    
    // Проверка пароля для регистрации
    if (form.id === 'register-form' && formValues.password.length < 6) {
      this.showFormError(form, 'password', 'Пароль должен быть не менее 6 символов');
      isValid = false;
    }
    
    return isValid;
  }

  showFormError(form, fieldName, message) {
    const field = form.querySelector(`[id$="${fieldName}"]`);
    if (!field) return;
    
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('form-error')) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    errorElement.textContent = message;
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.currentUser = null;
    this.renderAuthState();
    this.dispatchAuthEvent('logout');
  }

  dispatchAuthEvent(type, detail = {}) {
    const event = new CustomEvent('auth-change', {
      detail: { type, user: this.currentUser, ...detail }
    });
    document.dispatchEvent(event);
  }

  handleAuthError(error) {
    console.error('Auth error:', error);
    const message = error.message || 'Произошла ошибка';
    
    // Показываем ошибку в текущей активной форме
    const form = document.getElementById(`${this.currentTab}-form`);
    if (form) {
      const errorContainer = form.querySelector('.auth-error') || form.querySelector('.form-error');
      if (errorContainer) {
        errorContainer.textContent = message;
      }
    }
    
    this.dispatchAuthEvent('error', { error: message });
  }
}