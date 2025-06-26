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
  },
  {
    id: 4,
    name: "Юбка 'Летучая мышь'",
    description: "Короткая юбка с асимметричным подолом",
    price: 2299,
    image: "images/products/bat-skirt.jpg",
    sizes: ["104", "110"],
    colors: ["black", "purple"],
    category: "skirts",
    isNew: true
  },
  {
    id: 5,
    name: "Жилет 'Граф Дракула'",
    description: "Бархатный жилет с вышивкой",
    price: 3199,
    image: "images/products/dracula-vest.jpg",
    sizes: ["110", "116", "122"],
    colors: ["black", "burgundy"],
    category: "outerwear",
    isNew: false
  },
  {
    id: 6,
    name: "Брюки 'Теневой охотник'",
    description: "Узкие брюки с кожаными вставками",
    price: 2899,
    image: "images/products/shadow-pants.jpg",
    sizes: ["104", "110", "116"],
    colors: ["black"],
    category: "pants",
    isNew: true
  },
  {
    id: 7,
    name: "Костюм 'Маленький оборотень'",
    description: "Комплект из рубашки и жилетки с меховыми элементами",
    price: 4999,
    image: "images/products/werewolf-costume.jpg",
    sizes: ["110", "116"],
    colors: ["brown", "gray"],
    category: "costumes",
    isNew: true
  },
  {
    id: 8,
    name: "Платье 'Королева ночи'",
    description: "Длинное платье",
    price: 4299,
    image: "images/products/queen-dress.jpg",
    sizes: ["104", "110"],
    colors: ["black", "dark blue"],
    category: "dresses",
    isNew: false
  },
  {
    id: 9,
    name: "Галстук 'Вампирский шик'",
    description: "Красный галстук с черными узорами",
    price: 1299,
    image: "images/products/vampire-tie.jpg",
    sizes: ["one-size"],
    colors: ["red", "black"],
    category: "accessories",
    isNew: true
  },
  {
    id: 10,
    name: "Шляпа 'Маленький маг'",
    description: "Черная шляпа с серебряными символами",
    price: 1899,
    image: "images/products/wizard-hat.jpg",
    sizes: ["one-size"],
    colors: ["black", "purple"],
    category: "accessories",
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
}

export const productModule = {
  init: initProducts,
  getProductById: (id) => products.find(p => p.id === id),
  getAllProducts: () => [...products],
  getProductsByCategory: (category) => products.filter(p => p.category === category)
};