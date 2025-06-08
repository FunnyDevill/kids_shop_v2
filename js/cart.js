export class Cart {
  constructor(notificationCallback) {
    this.items = this.loadCart();
    this.notificationCallback = notificationCallback;
    this.init();
  }

  loadCart() {
    try {
      const cartData = localStorage.getItem('cart');
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      localStorage.removeItem('cart');
      return [];
    }
  }

  init() {
    this.setupListeners();
    this.updateCartCounter();
  }

  async processCheckout() {
    if (this.items.length === 0) {
      this.showNotification('Корзина пуста', 'error');
      return false;
    }

    const btn = document.querySelector('.checkout-btn');
    try {
      if (btn) {
        btn.disabled = true;
        const btnText = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');
        if (btnText) btnText.textContent = 'Обработка...';
        if (loader) loader.hidden = false;
      }

      const response = await this.mockApiRequest();

      if (response.success) {
        this.clearCart();
        this.showNotification(`Заказ оформлен! Номер: ${response.orderId}`, 'success');
        this.closeCart();
        return true;
      }
    } catch (error) {
      this.showNotification(error.message || 'Ошибка оформления заказа', 'error');
      return false;
    } finally {
      if (btn) {
        btn.disabled = false;
        const btnText = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');
        if (btnText) btnText.textContent = 'Оформить заказ';
        if (loader) loader.hidden = true;
      }
    }
  }

  mockApiRequest() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: `MD-${Math.floor(Math.random() * 1000000)}`
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
      const removeBtn = e.target.closest('.remove-btn');
      if (!removeBtn) return;

      const itemId = parseInt(removeBtn.closest('.cart-item')?.dataset.id);
      if (!isNaN(itemId)) {
        this.removeItem(itemId);
      }
    });

    document.addEventListener('change', (e) => {
      const quantityInput = e.target.closest('.quantity-input');
      if (!quantityInput) return;

      const itemId = parseInt(quantityInput.closest('.cart-item')?.dataset.id);
      const newQuantity = parseInt(quantityInput.value);
      
      if (!isNaN(itemId)) {
        if (!isNaN(newQuantity)) {
          this.updateQuantity(itemId, Math.max(1, newQuantity));
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
    if (!product || !product.id) return;

    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || 'images/placeholder.jpg',
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

  clearCart() {
    this.items = [];
    this.save();
  }

  save() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
      this.updateCartCounter();
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }

  updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    if (!counter) return;

    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    counter.textContent = totalItems > 99 ? '99+' : totalItems;
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