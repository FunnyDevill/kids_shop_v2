/**
 * products.js - Модуль работы с товарами
 * Отвечает за:
 * - Хранение данных о товарах
 * - Рендер карточек товаров
 * - Фильтрацию/сортировку
 */

// Данные товаров (в реальном проекте загружаются с сервера)
export const products = [
   {
     id: 1,
     name: "Платье 'Лунная фея'",
     description: "Черное бархатное платье с серебряными звездами",
     price: 3499,
     image: "images/products/gothic-dress.jpg",
     sizes: ["104", "110", "116"],
     colors: ["black"],
     category: "dresses",
     isNew: true
   },
   {
     id: 2,
     name: "Пальто 'Маленький вампир'",
     description: "С алым подкладом и бархатным воротником",
     price: 5499,
     image: "images/products/vampire-coat.jpg",
     sizes: ["110", "116", "122"],
     colors: ["black", "red"],
     category: "outerwear",
     isNew: false
   },
   {
     id: 3,
     name: "3'",
     description: "С алым подкладом и бархатным воротником",
     price: 5499,
     image: "images/products/vampire-coat.jpg",
     sizes: ["110", "116", "122"],
     colors: ["black", "red"],
     category: "outerwear",
     isNew: false
   },
   // ... другие товары
 ];
 
 // DOM-элементы
 const productsGrid = document.querySelector('.products-grid');
 const filterButtons = document.querySelectorAll('.filter-btn');
 const sortSelect = document.querySelector('.sort-select');
 
 // Инициализация модуля
 function initProducts() {
   renderProducts(products);
   setupEventListeners();
 }
 
 // Рендер списка товаров
 function renderProducts(productsToRender) {
   if (!productsGrid) return;
 
   productsGrid.innerHTML = productsToRender.map(product => `
     <div class="product-card" data-id="${product.id}" 
          data-category="${product.category}"
          data-price="${product.price}">
       <div class="product-image" style="background-image: url('${product.image}')">
         ${product.isNew ? '<span class="product-badge">NEW</span>' : ''}
       </div>
       <div class="product-info">
         <h3 class="product-title">${product.name}</h3>
         <p class="product-description">${product.description}</p>
         <div class="product-footer">
           <div class="product-price">${product.price.toLocaleString()} ₽</div>
           <button class="btn add-to-cart" data-id="${product.id}">
             В корзину
           </button>
         </div>
       </div>
     </div>
   `).join('');
 }
 
 // Фильтрация товаров
 function filterProducts(category) {
   if (category === 'all') {
     renderProducts(products);
     return;
   }
   
   const filtered = products.filter(
     product => product.category === category
   );
   renderProducts(filtered);
 }
 
 // Сортировка товаров
 function sortProducts(sortType) {
   const sorted = [...products];
   
   switch(sortType) {
     case 'price-asc':
       sorted.sort((a, b) => a.price - b.price);
       break;
     case 'price-desc':
       sorted.sort((a, b) => b.price - a.price);
       break;
     case 'newest':
       sorted.sort((a, b) => b.isNew - a.isNew);
       break;
     default:
       break;
   }
   
   renderProducts(sorted);
 }
 
 // Обработчики событий
 function setupEventListeners() {
   // Фильтрация
   filterButtons?.forEach(btn => {
     btn.addEventListener('click', () => {
       filterButtons.forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
       filterProducts(btn.dataset.category);
     });
   });
 
   // Сортировка
   sortSelect?.addEventListener('change', (e) => {
     sortProducts(e.target.value);
   });
 
   // Клик по "В корзину"
   productsGrid?.addEventListener('click', (e) => {
     if (e.target.classList.contains('add-to-cart')) {
       const productId = parseInt(e.target.dataset.id);
       addToCartHandler(productId);
     }
   });
 }
 
 // Обработчик добавления в корзину
 function addToCartHandler(productId) {
   const product = products.find(p => p.id === productId);
   if (!product) return;
 
   // Добавляем товар через модуль корзины
   if (window.cart) {
     window.cart.addItem(product);
     App.showNotification(`${product.name} добавлен в корзину`, 'success');
   } else {
     console.error('Модуль корзины не загружен');
   }
 }
 
 // Экспорт для других модулей
 window.productModule = {
   init: initProducts,
   getProductById: (id) => products.find(p => p.id === id),
   getAllProducts: () => [...products]
 };
 
 // Автоматическая инициализация при загрузке
 document.addEventListener('DOMContentLoaded', initProducts);