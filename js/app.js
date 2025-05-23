import { COMPONENTS } from './constants.js';
import { Cart } from './cart.js';
import { AuthService } from './auth.js';
import { products } from './products.js';

/**
 * Midnight Dream - Главный файл приложения
 * Инициализирует все компоненты и управляет состоянием
 */
const App = {
  // Инициализация приложения
  async init() {
    try {
      await this.loadComponents();
      this.setupEventListeners();
      await this.checkAuthState();
      console.log('Приложение инициализировано');
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.showNotification('Ошибка загрузки приложения', 'error');
    }
  },

  // Загрузка HTML-компонентов
  async loadComponents() {
    try {
      const components = await Promise.allSettled([
        this.loadComponent('header', 'partials/header.html'),
        this.loadComponent(COMPONENTS.authModal, 'partials/auth-modal.html'),
        this.loadComponent(COMPONENTS.cartSidebar, 'partials/cart-sidebar.html'),
        this.loadComponent('footer', 'partials/footer.html')
      ]);

      components.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Ошибка загрузки компонента ${index}:`, result.reason);
        }
      });

      this.initModules();
    } catch (error) {
      console.error('Критическая ошибка загрузки компонентов:', error);
      throw error;
    }
  },

  // Загрузка отдельного компонента
  async loadComponent(id, path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const html = await response.text();
      const targetElement = document.getElementById(id);
      
      if (!targetElement) {
        throw new Error(`Элемент с ID ${id} не найден`);
      }

      targetElement.innerHTML = html;
      console.log(`Компонент ${id} успешно загружен`);
    } catch (error) {
      console.error(`Ошибка загрузки компонента ${id}:`, error);
      throw error;
    }
  },

  // Инициализация модулей
  initModules() {
    try {
      this.cart =  new Cart();
      this.auth =  new AuthService();
      this.initProducts();
    } catch (error) {
      console.error('Ошибка инициализации модулей:', error);
      throw error;
    }
  },

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
  },

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
  },

  // Установка обработчиков событий
  setupEventListeners() {
    document.addEventListener('click', this.handleGlobalClicks.bind(this));
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });

    // Делегирование событий для динамических элементов
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.overlay')) this.closeAllModals();
      if (e.target.closest('.close-modal')) this.closeAllModals();
    });
  },

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
  },

  // Обработчик действий авторизации
  handleAuthAction(button) {
    const isAuthenticated = button.classList.contains('authenticated');
    isAuthenticated ? this.logout() : this.toggleAuthModal();
  },

  // Управление корзиной
  toggleCart() {
    this.toggleComponent(COMPONENTS.cartSidebar, 'open');
  },

  // Управление модальным окном авторизации
  toggleAuthModal() {
    this.toggleComponent(COMPONENTS.authModal, 'active');
  },

  // Общий метод управления состоянием компонентов
  toggleComponent(componentId, stateClass) {
    const component = document.getElementById(componentId);
    if (!component) return;

    const overlay = document.querySelector('.overlay');
    component.classList.toggle(stateClass);
    overlay?.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  },

  // Закрытие всех модальных окон
  closeAllModals() {
    [COMPONENTS.cartSidebar, COMPONENTS.authModal].forEach(id => {
      const element = document.getElementById(id);
      element?.classList.remove('open', 'active');
    });

    document.querySelector('.overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  },

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
  },

  // Инициализация продуктов
  initProducts() {
    if (!products?.length) {
      console.error('Список продуктов пуст');
      return;
    }
    this.renderProducts();
    this.setupProductListeners();
  },

  // Рендер продуктов
  renderProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    const fragment = document.createDocumentFragment();
    
    products.forEach(product => {
      const productElement = this.createProductElement(product);
      fragment.appendChild(productElement);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
  },

  // Создание элемента продукта
  createProductElement(product) {
    const element = document.createElement('div');
    element.className = 'product-card';
    element.dataset.id = product.id;
    element.innerHTML = `
      <div class="product-image" style="background-image: url('${product.image}')"></div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-price">${product.price.toLocaleString()} ₽</div>
        <button class="btn add-to-cart">В корзину</button>
      </div>
    `;
    return element;
  },

  // Настройка обработчиков для продуктов
  setupProductListeners() {
    document.body.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart')) {
        this.handleAddToCart(e);
      }
    });
  },

  // Обработка добавления в корзину
  handleAddToCart(e) {
    const productElement = e.target.closest('.product-card');
    const productId = productElement?.dataset.id;
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (product) {
      this.cart.addItem(product);
      this.showNotification(`${product.name} добавлен в корзину`, 'success');
    }
  },

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
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(error => {
    console.error('Критическая ошибка приложения:', error);
  });
});

export default App;