import { COMPONENTS } from './constants.js';
import { Cart } from './cart.js';
import { AuthService } from './auth.js';
import { productModule, initProducts } from './products.js';
import { loadComponents } from './components.js';

class App {
  constructor() {
    this.cart = null;
    this.auth = null;
    this.products = [];
  }

  // Инициализация приложения
  async init() {
    try {
      await loadComponents();
      this.initModules();
      this.setupEventListeners();
      await this.checkAuthState();
      this.initProducts();
      console.log('Приложение инициализировано');
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.showNotification('Ошибка загрузки приложения', 'error');
    }
  }

  // Инициализация модулей
  initModules() {
    try {
      this.cart = new Cart(this.showNotification.bind(this));
      this.auth = new AuthService();
      this.products = productModule.getAllProducts();
    } catch (error) {
      console.error('Ошибка инициализации модулей:', error);
      throw error;
    }
  }

  // Инициализация продуктов
  initProducts() {
    try {
      initProducts(); // Инициализируем модуль продуктов
      this.setupProductListeners();
    } catch (error) {
      console.error('Ошибка инициализации продуктов:', error);
    }
  }

  // Проверка состояния авторизации
  async checkAuthState() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      if (user?.email && user?.name) {
        console.log('Пользователь авторизован:', user.email);
        this.updateAuthUI(user);
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      localStorage.removeItem('user');
    }
  }

  // Обновление UI для авторизованного пользователя
  updateAuthUI(user) {
    const authBtn = document.querySelector('.auth-btn');
    if (!authBtn) return;

    authBtn.innerHTML = `
      <svg width="20" height="20" fill="currentColor">
        <use href="#user-icon"></use>
      </svg>
      <span>${user.name}</span>
    `;
    authBtn.classList.add('authenticated');
  }

  // Установка обработчиков событий
  setupEventListeners() {
    document.addEventListener('click', this.handleGlobalClicks.bind(this));
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });

    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.overlay')) this.closeAllModals();
      if (e.target.closest('.close-modal')) this.closeAllModals();
    });

    // Обработчик добавления в корзину через событие
    document.addEventListener('addToCart', (e) => {
      this.handleAddToCartEvent(e.detail.product);
    });
  }

  // Обработка глобальных кликов
  handleGlobalClicks(e) {
    const { target } = e;
    
    if (target.closest('.cart-btn')) {
      e.preventDefault();
      this.toggleCart();
    }

    if (target.closest('.auth-btn')) {
      e.preventDefault();
      this.handleAuthAction(target.closest('.auth-btn'));
    }
  }

  // Обработчик событий добавления в корзину
  handleAddToCartEvent(product) {
    if (!product || !this.cart) return;
    
    this.cart.addItem(product);
    this.showNotification(`${product.name} добавлен в корзину`, 'success');
  }

  // Настройка обработчиков для продуктов
  setupProductListeners() {
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart')) {
        const productId = e.target.closest('.add-to-cart')?.dataset.id;
        if (!productId) return;

        const product = productModule.getProductById(parseInt(productId));
        if (product) {
          this.handleAddToCartEvent(product);
        }
      }
    });
  }

  // Обработчик действий авторизации
  handleAuthAction(button) {
    const isAuthenticated = button.classList.contains('authenticated');
    isAuthenticated ? this.logout() : this.toggleAuthModal();
  }

  // Управление корзиной
  toggleCart() {
    this.toggleComponent(COMPONENTS.cartSidebar, 'open');
    if (this.cart) {
      this.cart.render();
    }
  }

  // Управление модальным окном авторизации
  toggleAuthModal() {
    this.toggleComponent(COMPONENTS.authModal, 'active');
  }

  // Общий метод управления состоянием компонентов
  toggleComponent(componentId, stateClass) {
    const component = document.getElementById(componentId);
    if (!component) return;

    const overlay = document.querySelector('.overlay');
    component.classList.toggle(stateClass);
    overlay?.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  }

  // Закрытие всех модальных окон
  closeAllModals() {
    [COMPONENTS.cartSidebar, COMPONENTS.authModal].forEach(id => {
      const element = document.getElementById(id);
      element?.classList.remove('open', 'active');
    });

    document.querySelector('.overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  // Выход из системы
  logout() {
    localStorage.removeItem('user');
    const authBtn = document.querySelector('.auth-btn');
    if (!authBtn) return;

    authBtn.classList.remove('authenticated');
    authBtn.innerHTML = `
      <svg width="20" height="20" fill="currentColor">
        <use href="#user-icon"></use>
      </svg>
      <span>Войти</span>
    `;
    this.showNotification('Вы вышли из системы', 'success');
  }

  // Показать уведомление
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');

    notification.innerHTML = `
      <svg width="20" height="20" fill="currentColor">
        <use href="#${type === 'success' ? 'check' : 'error'}-icon"></use>
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Создаем и экспортируем экземпляр приложения
const application = new App();

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  application.init().catch(error => {
    console.error('Критическая ошибка приложения:', error);
  });
});

export { App, application };