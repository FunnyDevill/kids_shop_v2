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
    this.currentModal = null;
  }

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

  initProducts() {
    try {
      initProducts();
    } catch (error) {
      console.error('Ошибка инициализации продуктов:', error);
    }
  }

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
  document.addEventListener('click', (e) => {
    if (e.target.closest('.cart-btn')) {
      e.preventDefault();
      this.toggleCart();
    }

    if (e.target.closest('.auth-btn')) {
      e.preventDefault();
      this.handleAuthAction(e.target.closest('.auth-btn'));
    }

    if (e.target.closest('.close-modal') || e.target.closest('.close-cart')) {
      e.preventDefault();
      this.closeAllModals();
    }

    if (e.target.closest('.overlay')) {
      this.closeAllModals();
    }

    if (e.target.closest('.btn-large') && e.target.closest('.hero')) {
      e.preventDefault();
      this.scrollToProducts();
    }

    // Обработчик для кнопок "В корзину" (в карточке товара и в модалке)
    if (e.target.closest('.add-to-cart')) {
      e.preventDefault();
      let productId;
      
      // Если клик в модалке - берем ID из dataset модального окна
      if (e.target.closest(`#${COMPONENTS.productModal}`)) {
        productId = document.getElementById(COMPONENTS.productModal).dataset.id;
      } 
      // Если клик в карточке товара - берем ID из data-атрибута кнопки
      else {
        productId = e.target.closest('.add-to-cart').dataset.id;
      }

      if (!productId) return;

      const product = productModule.getProductById(parseInt(productId));
      if (product) {
        this.handleAddToCartEvent(product);
        this.closeAllModals(); // Закрываем модалку после добавления
      }
    }

    if (e.target.closest('.product-card')) {
      e.preventDefault();
      const productCard = e.target.closest('.product-card');
      const productId = parseInt(productCard.dataset.id);
      const product = productModule.getProductById(productId);
      if (product) {
        this.showProductModal(product);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') this.closeAllModals();
  });
}

  scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  showProductModal(product) {
  const modal = document.getElementById(COMPONENTS.productModal);
  console.log('Открытие модального окна для товара:', product);
  if (!modal) {
    console.error('Модальное окно товара не найдено');
    return;
  }

  // Сохраняем ID товара в dataset модального окна и кнопки
  modal.dataset.id = product.id;
  modal.querySelector('.add-to-cart').dataset.id = product.id;

  document.getElementById('product-modal-title').textContent = product.name;
  document.getElementById('product-modal-price').textContent = `${product.price.toLocaleString()} ₽`;
  document.getElementById('product-modal-category').textContent = product.category;
  document.getElementById('product-modal-description').textContent = product.description;

  const mainImage = document.getElementById('product-main-image');
  mainImage.src = product.image;
  mainImage.alt = product.name;

  const sizeOptions = document.getElementById('product-size-options');
  sizeOptions.innerHTML = '';
  product.sizes.forEach(size => {
    const sizeElement = document.createElement('div');
    sizeElement.className = 'size-option';
    sizeElement.textContent = size;
    sizeOptions.appendChild(sizeElement);
  });

  const colorOptions = document.getElementById('product-color-options');
  colorOptions.innerHTML = '';
  product.colors.forEach(color => {
    const colorElement = document.createElement('div');
    colorElement.className = 'color-option';
    colorElement.style.backgroundColor = color;
    colorOptions.appendChild(colorElement);
  });

  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('.overlay').classList.add('active');
  document.body.classList.add('no-scroll');
  this.currentModal = COMPONENTS.productModal;
}

  handleAddToCartEvent(product) {
    if (!product || !this.cart) return;
    this.cart.addItem(product);
    this.showNotification(`${product.name} добавлен в корзину`, 'success');
  }

  handleAuthAction(button) {
    const isAuthenticated = button.classList.contains('authenticated');
    isAuthenticated ? this.logout() : this.toggleAuthModal();
  }

  toggleCart() {
    if (this.currentModal === COMPONENTS.cartSidebar) {
      this.closeAllModals();
    } else {
      this.closeAllModals();
      this.toggleComponent(COMPONENTS.cartSidebar, 'open');
      this.currentModal = COMPONENTS.cartSidebar;
      if (this.cart) {
        this.cart.render();
      }
    }
  }

  toggleAuthModal() {
    if (this.currentModal === COMPONENTS.authModal) {
      this.closeAllModals();
    } else {
      this.closeAllModals();
      this.toggleComponent(COMPONENTS.authModal, 'active');
      this.currentModal = COMPONENTS.authModal;
    }
  }

  toggleComponent(componentId, stateClass) {
    const component = document.getElementById(componentId);
    if (!component) return;

    const overlay = document.querySelector('.overlay');

    if (componentId === COMPONENTS.authModal) {
      const isHidden = component.getAttribute('aria-hidden') === 'true';
      component.setAttribute('aria-hidden', !isHidden);
    } else {
      component.classList.toggle(stateClass);
    }

    overlay?.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  }

  closeAllModals() {
    const authModal = document.getElementById(COMPONENTS.authModal);
    if (authModal) authModal.setAttribute('aria-hidden', 'true');

    const cartSidebar = document.getElementById(COMPONENTS.cartSidebar);
    if (cartSidebar) cartSidebar.classList.remove('open');

    const productModal = document.getElementById(COMPONENTS.productModal);
    if (productModal) productModal.setAttribute('aria-hidden', 'true');


    const overlay = document.querySelector('.overlay');
    overlay?.classList.remove('active');
    document.body.classList.remove('no-scroll');

    this.currentModal = null;
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
      <span>Войти</span>
    `;
    this.showNotification('Вы вышли из системы', 'success');
  }

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

const application = new App();
window.application = application;

document.addEventListener('DOMContentLoaded', () => {
  application.init().catch((error) => {
    console.error('Критическая ошибка приложения:', error);
  });
});

export { App, application };