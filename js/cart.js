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
        // Обработчик кнопки оформления заказа
        document.querySelector('.checkout-btn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.processCheckout();
        });

        // Обработчик удаления товаров
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const itemElement = e.target.closest('.cart-item');
                if (!itemElement) return;
                
                const itemId = parseInt(itemElement.dataset.id);
                if (!isNaN(itemId)) {
                    this.removeItem(itemId);
                }
            }
        });

        // Обработчик изменения количества
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const itemElement = e.target.closest('.cart-item');
                if (!itemElement) return;
                
                const itemId = parseInt(itemElement.dataset.id);
                const newQuantity = parseInt(e.target.value);
                
                if (!isNaN(itemId) && !isNaN(newQuantity) && newQuantity > 0) {
                    this.updateQuantity(itemId, newQuantity);
                } else {
                    this.render(); // Восстановим предыдущее значение
                }
            }
        });
    }

    showNotification(message, type) {
        if (typeof this.notificationCallback === 'function') {
            this.notificationCallback(message, type);
        } else {
            console[type === 'error' ? 'error' : 'log'](message);
        }
    }

addItem(product, quantity = 1) {
  // Проверяем есть ли уже такой товар в корзине
  const existingItemIndex = this.items.findIndex(item => item.id === product.id);
  
  if (existingItemIndex >= 0) {
    // Увеличиваем количество если товар уже есть
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Добавляем новый товар
    this.items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: quantity
    });
  }
  
  // Сохраняем и обновляем UI
  this.save();
  this.render();
  
  // Показываем уведомление
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
        const container = document.querySelector('.cart-items');
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
                            <button class="quantity-btn minus" data-action="decrease">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                            <button class="quantity-btn plus" data-action="increase">+</button>
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
        summary.innerHTML = `
            <h3 class="summary-title">Итого</h3>
            <div class="summary-row">
                <span>Товары (${this.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>${this.getTotalPrice().toLocaleString()} ₽</span>
            </div>
            <div class="summary-row">
                <span>Доставка</span>
                <span>Бесплатно</span>
            </div>
            <div class="summary-total">
                <span>Общая сумма</span>
                <span>${this.getTotalPrice().toLocaleString()} ₽</span>
            </div>
            <button class="btn btn--primary checkout-btn" ${this.items.length === 0 ? 'disabled' : ''}>
                Оформить заказ
            </button>
        `;

        this.updateCartCounter();
    }
}