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
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await loadComponents();
      this.initModules();
      this.setupEventListeners();
      await Promise.all([
        this.checkAuthState(),
        this.initProducts()
      ]);
      this.isInitialized = true;
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showNotification('Ошибка загрузки приложения', 'error');
    }
  }

  initModules() {
    try {
      this.cart = new Cart(this.showNotification.bind(this));
      this.auth = new AuthService();
      this.products = productModule.getAllProducts();
    } catch (error) {
      console.error('Module initialization error:', error);
      throw error;
    }
  }

  async initProducts() {
    try {
      await initProducts();
      this.setupProductListeners();
    } catch (error) {
      console.error('Products initialization error:', error);
      throw error;
    }
  }

  async checkAuthState() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      if (user?.email && user?.name) {
        this.updateAuthUI(user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
    }
  }

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

  setupEventListeners() {
    document.addEventListener('click', this.handleGlobalClicks.bind(this));
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAllModals();
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.overlay')) this.closeAllModals();
      if (e.target.closest('.close-modal')) this.closeAllModals();
    });

    document.addEventListener('addToCart', (e) => {
      this.handleAddToCartEvent(e.detail.product);
    });
  }

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

  handleAddToCartEvent(product) {
    if (!product || !this.cart) return;
    
    this.cart.addItem(product);
    this.showNotification(`${product.name} добавлен в корзину`, 'success');
  }

  setupProductListeners() {
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.add-to-cart');
      if (!addToCartBtn) return;

      const productId = parseInt(addToCartBtn.dataset.id);
      if (isNaN(productId)) return;

      const product = productModule.getProductById(productId);
      if (product) {
        this.handleAddToCartEvent(product);
      }
    });
  }

  handleAuthAction(button) {
    if (!button) return;
    
    const isAuthenticated = button.classList.contains('authenticated');
    isAuthenticated ? this.logout() : this.toggleAuthModal();
  }

  toggleCart() {
    this.toggleComponent(COMPONENTS.cartSidebar, 'open');
    this.cart?.render();
  }

  toggleAuthModal() {
    this.toggleComponent(COMPONENTS.authModal, 'active');
  }

  toggleComponent(componentId, stateClass) {
    const component = document.getElementById(componentId);
    if (!component) return;

    const overlay = document.querySelector('.overlay');
    component.classList.toggle(stateClass);
    overlay?.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  }

  closeAllModals() {
    [COMPONENTS.cartSidebar, COMPONENTS.authModal].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove('open', 'active');
      }
    });

    const overlay = document.querySelector('.overlay');
    overlay?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  logout() {
    localStorage.removeItem('user');
    const authBtn = document.querySelector('.auth-btn');
    if (!authBtn) return;

    authBtn.classList.remove('authenticated');
    authBtn.innerHTML = `
      <svg width="20" height="20" fill="currentColor">
        <use href="#user-icon"></use>
      </svg>
    `;
    this.showNotification('Вы вышли из системы', 'success');
  }

  showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });

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

const application = new App();

document.addEventListener('DOMContentLoaded', () => {
  application.init().catch(error => {
    console.error('Critical app error:', error);
  });
});

export { App, application };