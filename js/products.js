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
    name: "Рубашка 'Темный рыцарь'",
    description: "Черная рубашка с готическими узорами",
    price: 2799,
    image: "images/products/gothic-shirt.jpg",
    sizes: ["104", "110", "116"],
    colors: ["black"],
    category: "shirts",
    isNew: true
  }
];

export function initProducts() {
  renderProducts(products);
  setupEventListeners();
}

function renderProducts(productsToRender) {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;
  
  productsGrid.innerHTML = ProductCard.renderAll(productsToRender);
}

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
      sorted.sort((a, b) => (b.isNew || false) - (a.isNew || false));
      break;
    default:
      break;
  }
  
  renderProducts(sorted);
}

function setupEventListeners() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sortSelect = document.querySelector('.sort-select');
  const productsGrid = document.querySelector('.products-grid');

  filterButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProducts(btn.dataset.category);
    });
  });

  sortSelect?.addEventListener('change', (e) => {
    sortProducts(e.target.value);
  });

  productsGrid?.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const productId = parseInt(e.target.dataset.id);
      const product = products.find(p => p.id === productId);
      
      if (product) {
        const event = new CustomEvent('addToCart', {
          detail: { product },
          bubbles: true
        });
        e.target.dispatchEvent(event);
      }
    }
  });
}

export const productModule = {
  init: initProducts,
  getProductById: (id) => products.find(p => p.id === id),
  getAllProducts: () => [...products]
};