import { COMPONENTS } from './constants.js';

/**
 * Загружает все компоненты приложения
 * @returns {Promise<void>}
 */
export async function loadComponents() {
  try {
    const components = await Promise.allSettled([
      loadComponent('header', './partials/header.html'),
      loadComponent(COMPONENTS.authModal, './partials/auth-modal.html'),
      loadComponent(COMPONENTS.cartSidebar, './partials/cart-sidebar.html'),
      loadComponent('footer', './partials/footer.html')
    ]);

    components.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Ошибка загрузки компонента ${index}:`, result.reason);
      }
    });
  } catch (error) {
    console.error('Критическая ошибка загрузки компонентов:', error);
    throw error;
  }
}

/**
 * Загружает отдельный компонент по указанному пути
 * @param {string} id - ID целевого элемента
 * @param {string} path - Путь к HTML-файлу компонента
 * @returns {Promise<HTMLElement>}
 */
export async function loadComponent(id, path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    
    if (id === COMPONENTS.authModal || id === COMPONENTS.cartSidebar) {
      document.body.insertAdjacentHTML('beforeend', html);
      console.log(`Компонент ${id} успешно загружен`);
      return document.getElementById(id);
    }
    
    const targetElement = document.getElementById(id);
    if (!targetElement) {
      throw new Error(`Элемент с ID ${id} не найден`);
    }
    targetElement.innerHTML = html;
    console.log(`Компонент ${id} успешно загружен`);
    return targetElement;
  } catch (error) {
    console.error(`Ошибка загрузки компонента ${id}:`, error);
    throw error;
  }
}