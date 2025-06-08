import { ProductCard } from './product-card.js';

const products = [
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
  try {
    renderProducts(products);
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize products:', error);
  }
}

function renderProducts(productsToRender) {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) {
    console.warn('Products grid element not found');
    return;
  }
  
  try {
    productsGrid.innerHTML = ProductCard.renderAll(productsToRender);
  } catch (error) {
    console.error('Failed to render products:', error);
    productsGrid.innerHTML = '<p class="error-message">Произошла ошибка при загрузке товаров</p>';
  }
}

function filterProducts(category) {
  if (category === 'all') {
    renderProducts(products);
    return;
  }
  
  try {
    const filtered = products.filter(
      product => product.category === category
    );
    renderProducts(filtered.length ? filtered : products);
  } catch (error) {
    console.error('Failed to filter products:', error);
    renderProducts(products);
  }
}

function sortProducts(sortType) {
  try {
    const sorted = [...products];
    
    switch(sortType) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        break;
    }
    
    renderProducts(sorted);
  } catch (error) {
    console.error('Failed to sort products:', error);
    renderProducts(products);
  }
}

function setupEventListeners() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sortSelect = document.querySelector('.sort-select');
  const productsGrid = document.querySelector('.products-grid');

  filterButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      if (!category) return;

      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProducts(category);
    });
  });

  sortSelect?.addEventListener('change', (e) => {
    sortProducts(e.target.value);
  });

  productsGrid?.addEventListener('click', (e) => {
    const addToCartBtn = e.target.closest('.add-to-cart');
    if (!addToCartBtn) return;

    const productId = parseInt(addToCartBtn.dataset.id);
    if (isNaN(productId)) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const event = new CustomEvent('addToCart', {
      detail: { product },
      bubbles: true
    });
    addToCartBtn.dispatchEvent(event);
  });
}

export const productModule = {
  init: initProducts,
  getProductById: (id) => products.find(p => p.id === id),
  getAllProducts: () => [...products],
  getProductsByCategory: (category) => products.filter(p => p.category === category)
};