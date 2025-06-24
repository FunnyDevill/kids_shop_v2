export class Cart {
  constructor(notificationCallback) {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
    this.notificationCallback = notificationCallback || console.log;
    this.MAX_QUANTITY = 99;
    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
    this.updateCartCounter();
  }

  async processCheckout() {
    try {
      if (this.items.length === 0) {
        throw new Error('Корзина пуста');
      }

      const btn = document.querySelector('.checkout-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Обработка...';
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
        btn.textContent = 'Оформить заказ';
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
    // Обработчик оформления заказа
    document.querySelector('.checkout-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.processCheckout();
    });

    // Обработчики внутри корзины
    document.addEventListener('click', (e) => {
      const cartItem = e.target.closest('.cart-item');
      if (!cartItem) return;

      const itemId = parseInt(cartItem.dataset.id);
      if (isNaN(itemId)) return;

      // Удаление товара
      if (e.target.classList.contains('remove-btn')) {
        this.removeItem(itemId);
        return;
      }

      // Увеличение/уменьшение количества
      const action = e.target.dataset.action;
      if (action === 'increase' || action === 'decrease') {
        const input = cartItem.querySelector('.quantity-input');
        if (!input) return;

        let newQuantity = parseInt(input.value) + (action === 'increase' ? 1 : -1);
        newQuantity = Math.max(1, Math.min(this.MAX_QUANTITY, newQuantity));
        
        this.updateQuantity(itemId, newQuantity);
      }
    });

    // Ручной ввод количества
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        const cartItem = e.target.closest('.cart-item');
        if (!cartItem) return;

        const itemId = parseInt(cartItem.dataset.id);
        let newQuantity = parseInt(e.target.value);

        if (!isNaN(itemId) && !isNaN(newQuantity)) {
          newQuantity = Math.max(1, Math.min(this.MAX_QUANTITY, newQuantity));
          this.updateQuantity(itemId, newQuantity);
        } else {
          this.render(); // Восстановление предыдущего значения
        }
      }
    });
  }

  addItem(product, quantity = 1) {
    if (!product || quantity <= 0) return;

    const existingItemIndex = this.items.findIndex(item => item.id === product.id);
    const newQuantity = Math.min(this.MAX_QUANTITY, quantity);

    if (existingItemIndex >= 0) {
      // Обновляем существующий товар
      this.items[existingItemIndex].quantity = Math.min(
        this.MAX_QUANTITY,
        this.items[existingItemIndex].quantity + newQuantity
      );
      this.showNotification(`Количество "${product.name}" обновлено`, 'success');
    } else {
      // Добавляем новый товар
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: newQuantity
      });
      this.showNotification(`"${product.name}" добавлен в корзину`, 'success');
    }

    this.save();
    this.render();
  }

  removeItem(itemId) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const [removedItem] = this.items.splice(itemIndex, 1);
    this.save();
    this.render();
    this.showNotification(`"${removedItem.name}" удален из корзины`, 'success');
  }

  updateQuantity(itemId, newQuantity) {
    const item = this.items.find(item => item.id === itemId);
    if (!item || newQuantity <= 0 || newQuantity > this.MAX_QUANTITY) {
      this.render(); // Восстановление предыдущего значения
      return;
    }

    const oldQuantity = item.quantity;
    item.quantity = newQuantity;

    if (oldQuantity !== newQuantity) {
      this.save();
      this.render();
      this.showNotification(
        `Количество "${item.name}" изменено: ${oldQuantity} → ${newQuantity}`,
        'info'
      );
    }
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
    this.updateCartCounter();
  }

  updateCartCounter() {
    const counters = document.querySelectorAll('.cart-counter');
    counters.forEach(counter => {
      const totalItems = this.getTotalItems();
      counter.textContent = totalItems;
      counter.style.display = totalItems > 0 ? 'flex' : 'none';
      counter.classList.toggle('pulse', totalItems > 0);
    });
  }

  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  closeCart() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.querySelector('.overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  showNotification(message, type = 'success') {
    if (typeof this.notificationCallback === 'function') {
      this.notificationCallback(message, type);
    }
  }

  render() {
    const container = document.querySelector('.cart-items-container');
    const summary = document.querySelector('.cart-summary');
    if (!container || !summary) return;

    // Рендер товаров
    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из каталога</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="cart-header">
          <div>Товар</div>
          <div>Цена</div>
          <div>Количество</div>
          <div>Итого</div>
        </div>
        ${this.items.map(item => `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-product">
              <img src="${item.image}" alt="${item.name}" class="cart-product-image">
              <div class="cart-product-info">
                <h3 class="cart-product-title">${item.name}</h3>
                <p class="cart-product-category">${item.category}</p>
              </div>
            </div>
            <div class="cart-price">${item.price.toLocaleString()} ₽</div>
            <div class="cart-quantity">
              <button class="quantity-btn" data-action="decrease" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
              <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${this.MAX_QUANTITY}">
              <button class="quantity-btn" data-action="increase" ${item.quantity >= this.MAX_QUANTITY ? 'disabled' : ''}>+</button>
            </div>
            <div class="cart-total">${(item.price * item.quantity).toLocaleString()} ₽</div>
            <button class="cart-remove remove-btn" aria-label="Удалить">
              &times;
            </button>
          </div>
        `).join('')}
      `;
    }

    // Рендер итогов
    const totalItems = this.getTotalItems();
    const totalPrice = this.getTotalPrice();
    
    summary.innerHTML = `
      <h3 class="summary-title">Итого</h3>
      <div class="summary-row">
        <span>Товары (${totalItems})</span>
        <span>${totalPrice.toLocaleString()} ₽</span>
      </div>
      <div class="summary-row">
        <span>Доставка</span>
        <span>Бесплатно</span>
      </div>
      <div class="summary-total">
        <span>Общая сумма</span>
        <span>${totalPrice.toLocaleString()} ₽</span>
      </div>
      <button class="btn btn--primary checkout-btn" ${totalItems === 0 ? 'disabled' : ''}>
        Оформить заказ
      </button>
    `;

    this.updateCartCounter();
  }
}