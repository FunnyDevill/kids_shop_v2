class ComponentLoader {
  constructor() {
    this.components = new Map([
      ['header', '/partials/header.html'],
      ['footer', '/partials/footer.html'],
      ['authModal', '/partials/auth-modal.html'],
      ['cartSidebar', '/partials/cart-sidebar.html']
    ]);
    this.initialized = false;
    this.eventHandlers = new WeakMap();
  }

  /**
   * Инициализация всех компонентов
   */
  async init() {
    if (this.initialized) return;

    try {
      const results = await Promise.allSettled(
        Array.from(this.components, ([id, path]) => 
          this.loadComponent(id, path)
        )
      );

      this.handleComponentErrors(results);
      this.initComponents();
      
      this.initialized = true;
      console.info('Все компоненты загружены и инициализированы');
    } catch (error) {
      this.handleCriticalError(error);
      throw error;
    }
  }

  /**
   * Загрузка отдельного компонента
   * @param {string} id - ID элемента в DOM
   * @param {string} path - Путь к HTML-файлу
   */
  async loadComponent(id, path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const container = document.getElementById(id);
      
      if (!container) {
        throw new Error(`Контейнер ${id} не найден`);
      }

      container.innerHTML = html;
      return { id, status: 'success' };
    } catch (error) {
      console.error(`Ошибка загрузки компонента ${id}:`, error);
      return { id, status: 'error', error };
    }
  }

  /**
   * Инициализация всех компонентов
   */
  initComponents() {
    this.initHeader();
    this.initAuthModal();
    this.initCartSidebar();
    this.initFooter();
  }

  /**
   * Обработка ошибок загрузки компонентов
   */
  handleComponentErrors(results) {
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('Критическая ошибка:', result.reason);
      } else if (result.value?.status === 'error') {
        console.warn(`Проблема с компонентом ${result.value.id}:`, result.value.error);
      }
    });
  }

  /**
   * Обработка критических ошибок
   */
  handleCriticalError(error) {
    console.error('Критическая ошибка инициализации:', error);
    // Можно добавить показ сообщения пользователю
  }

  /**
   * Инициализация шапки сайта
   */
  initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    this.setupMobileMenu(header);
    this.setupSearch(header);
  }

  /**
   * Настройка мобильного меню
   */
  setupMobileMenu(header) {
    const toggle = header.querySelector('.mobile-menu-toggle');
    if (!toggle) return;

    const handler = () => header.classList.toggle('mobile-menu-open');
    this.eventHandlers.set(toggle, handler);
    toggle.addEventListener('click', handler);
  }

  /**
   * Настройка поиска
   */
  setupSearch(header) {
    const form = header.querySelector('.search-form');
    if (!form) return;

    const handler = (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const query = input?.value.trim();
      
      if (query) {
        console.debug('Поиск:', query);
        // Логика поиска
      }
    };

    this.eventHandlers.set(form, handler);
    form.addEventListener('submit', handler);
  }

  /**
   * Инициализация модального окна авторизации
   */
  initAuthModal() {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;

    this.setupAuthTabs(authModal);
    this.setupCloseButton(authModal);
  }

  /**
   * Настройка вкладок авторизации
   */
  setupAuthTabs(authModal) {
    const tabs = authModal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      const handler = (e) => {
        e.preventDefault();
        this.switchAuthTab(tab.dataset.tab);
      };

      this.eventHandlers.set(tab, handler);
      tab.addEventListener('click', handler);
    });
  }

  /**
   * Настройка кнопки закрытия
   */
  setupCloseButton(authModal) {
    const closeBtn = authModal.querySelector('.close-auth');
    if (!closeBtn) return;

    const handler = () => this.toggleModal(authModal, false);
    this.eventHandlers.set(closeBtn, handler);
    closeBtn.addEventListener('click', handler);
  }

  /**
   * Переключение вкладок авторизации
   */
  switchAuthTab(tabName) {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;

    // Обновление вкладок
    authModal.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Обновление форм
    authModal.querySelectorAll('.auth-form').forEach(form => {
      form.classList.toggle('active', form.dataset.form === tabName);
    });
  }

  /**
   * Инициализация боковой панели корзины
   */
  initCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (!cartSidebar) return;

    this.setupCartClose(cartSidebar);
  }

  /**
   * Инициализация футера
   */
  initFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;

    // Обновляем год в копирайте
    this.updateCopyrightYear(footer);

    // Настраиваем форму подписки
    this.setupSubscriptionForm(footer);
  }

  /**
   * Настройка закрытия корзины
   */
  setupCartClose(cartSidebar) {
    const closeBtn = cartSidebar.querySelector('.close-cart');
    if (!closeBtn) return;

    const handler = () => this.toggleModal(cartSidebar, false);
    this.eventHandlers.set(closeBtn, handler);
    closeBtn.addEventListener('click', handler);
  }

  /**
   * Управление состоянием модальных окон
   */
  toggleModal(element, state) {
    if (!element) return;
    
    const overlay = document.querySelector('.overlay');
    const method = state ? 'add' : 'remove';
    
    element.classList[method]('active');
    overlay?.classList[method]('active');
    document.body.classList[method]('no-scroll');
  }

  /**
   * Настройка формы подписки
   */
  setupSubscriptionForm(footer) {
    const form = footer.querySelector('.subscribe-form');
    if (!form) return;

    const handler = (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input?.value.trim();
      
      if (email && this.validateEmail(email)) {
        console.debug('Подписка оформлена:', email);
        // Здесь будет логика отправки на сервер
        form.reset();
        this.showSubscriptionSuccess(footer);
      } else {
        this.showSubscriptionError(input, 'Некорректный email');
      }
    };

    this.eventHandlers.set(form, handler);
    form.addEventListener('submit', handler);
  }

  /**
   * Валидация email
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Показ сообщения об успешной подписке
   */
  showSubscriptionSuccess(footer) {
    const existingMessage = footer.querySelector('.subscription-message');
    if (existingMessage) existingMessage.remove();

    const message = document.createElement('p');
    message.className = 'subscription-message success';
    message.textContent = 'Спасибо за подписку!';
    message.style.cssText = 'color: #8aff80; margin-top: 10px;';

    const subscription = footer.querySelector('.subscription');
    if (subscription) {
      subscription.appendChild(message);
    }
  }

  /**
   * Обновление года в копирайте
   */
  updateCopyrightYear(footer) {
  const copyright = footer.querySelector('.copyright');
  if (copyright) {
    const currentYear = new Date().getFullYear();
    // Более безопасная замена только года
    copyright.innerHTML = copyright.innerHTML.replace(/\d{4}/, currentYear);
  }
}

  /**
   * Показ ошибки подписки
   */
  showSubscriptionError(input, text) {
    let errorElement = input.parentElement.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'error-message';
      errorElement.style.cssText = 'color: #ff6b6b; font-size: 14px; display: block; margin-top: 5px;';
      input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = text;
  }

  /**
   * Уничтожение компонента
   */
  destroy() {
    // Удаление всех обработчиков событий
    this.eventHandlers.forEach((handler, element) => {
      element.removeEventListener('click', handler);
      element.removeEventListener('submit', handler);
    });
    
    this.eventHandlers = new WeakMap();
    this.initialized = false;
  }
}

// Экспорт синглтона
const componentLoader = new ComponentLoader();

// Автоматическая инициализация только если не в SSR
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    componentLoader.init().catch((error) => {
      console.error('ComponentLoader initialization failed:', error);
    });
  });
}