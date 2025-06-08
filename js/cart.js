export class Cart {
  constructor(notificationCallback) {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
    this.notificationCallback = notificationCallback;
    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
  }

  async processCheckout() {
    try {
      if (this.items.length === 0) {
        throw new Error('Корзина пуста');
      }

      const btn = document.querySelector('.checkout-btn');
      if (btn) {
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Обработка...';
        btn.querySelector('.loader').hidden = false;
      }

      const response = await this.mockApiRequest();

      if (response.success) {
        this.items = [];
        this.save();
        this.render();
        this.showNotification('Заказ оформлен! Номер: ' + response.orderId, 'success');
        this.closeCart();
        return true;
      }
    } catch (error) {
      this.showNotification(error.message, 'error');
      return false;
    } finally {
      const btn = document.querySelector('.checkout-btn');
      if (btn) {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Оформить заказ';
        btn.querySelector('.loader').hidden = true;
      }
    }
  }

  mockApiRequest() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: 'MD-' + Math.floor(Math.random() * 1000000)
        });
      }, 1500);
    });
  }

  setupListeners() {
    document.querySelector('.checkout-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.processCheckout();
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn')) {
        const itemId = parseInt(e.target.closest('.cart-item')?.dataset.id);
        if (!isNaN(itemId)) {
          this.removeItem(itemId);
        }
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        const itemId = parseInt(e.target.closest('.cart-item')?.dataset.id);
        const newQuantity = parseInt(e.target.value);
        
        if (!isNaN(itemId) && !isNaN(newQuantity) && newQuantity > 0) {
          this.updateQuantity(itemId, newQuantity);
        } else {
          this.render();
        }
      }
    });
  }

  showNotification(message, type) {
    if (typeof this.notificationCallback === 'function') {
      this.notificationCallback(message, type);
    }
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: quantity
      });
    }
    
    this.save();
    this.render();
    this.showNotification(`${product.name} добавлен в корзину`, 'success');
  }

  removeItem(itemId) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const [removedItem] = this.items.splice(itemIndex, 1);
    this.save();
    this.render();
    this.showNotification(`${removedItem.name} удален из корзины`, 'success');
  }

  updateQuantity(itemId, newQuantity) {
    const item = this.items.find(item => item.id === itemId);
    if (!item) return;

    item.quantity = newQuantity;
    this.save();
    this.render();
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
    this.updateCartCounter();
  }

  updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    if (!counter) return;

    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    counter.textContent = totalItems;
    counter.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  closeCart() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.querySelector('.overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  render() {
    const container = document.querySelector('.cart-items-container');
    const summary = document.querySelector('.cart-summary');
    if (!container || !summary) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из каталога</p>
        </div>
      `;
    } else {
      container.innerHTML = this.items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-product-image">
          <div class="cart-product-info">
            <h3 class="cart-product-title">${item.name}</h3>
            <div class="cart-product-price">${item.price.toLocaleString()} ₽</div>
            <div class="cart-product-controls">
              <div class="quantity-control">
                <button class="quantity-btn" data-action="decrease">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                <button class="quantity-btn" data-action="increase">+</button>
              </div>
            </div>
          </div>
          <button class="cart-remove remove-btn" aria-label="Удалить">
            &times;
          </button>
        </div>
      `).join('');
    }

    summary.innerHTML = `
      <div class="cart-total">
        <span>Итого:</span>
        <span class="total-price">${this.getTotalPrice().toLocaleString()} ₽</span>
      </div>
      <button class="btn checkout-btn" ${this.items.length === 0 ? 'disabled' : ''}>
        <span class="btn-text">Оформить заказ</span>
        <span class="loader" hidden aria-hidden="true"></span>
      </button>
    `;

    this.updateCartCounter();
  }
}