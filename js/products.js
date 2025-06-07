import { ProductCard } from './product-card.js';

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
export function initProducts() {
    renderProducts(products);
    setupEventListeners();
}

// Рендер списка товаров
function renderProducts(productsToRender) {
    if (!productsGrid) return;
    productsGrid.innerHTML = ProductCard.renderAll(productsToRender);
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

    // Клик по "В корзину" (делегирование событий)
    productsGrid?.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.dataset.id);
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Генерируем событие для добавления в корзину
                const event = new CustomEvent('addToCart', {
                    detail: { product },
                    bubbles: true
                });
                e.target.dispatchEvent(event);
            }
        }
    });
}

// API модуля
export const productModule = {
    init: initProducts,
    getProductById: (id) => products.find(p => p.id === id),
    getAllProducts: () => [...products]
};