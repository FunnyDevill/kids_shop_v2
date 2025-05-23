export class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.setupListeners();
    }

    async processCheckout() {
        try {
            if (this.items.length === 0) {
                throw new Error('Корзина пуста');
            }
            const response = await this.mockApiRequest();

            if (response.success) {
                this.items = [];
                this.save();
                App.showNotification('Заказ оформлен! Номер: ' + response.orderId, 'success');
                this.closeCart();
                return true;
            }
        } catch (error) {
            App.showNotification(error.message, 'error');
            return false;
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
        document.querySelector('.checkout-btn')?.addEventListener('click', async () => {
            const btn = document.querySelector('.checkout-btn');
            btn.disabled = true;
            btn.textContent = 'Обработка...';
            
            await this.processCheckout();
            
            btn.disabled = false;
            btn.textContent = 'Оформить заказ';
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const itemId = parseInt(e.target.closest('.cart-item').dataset.id);
                this.removeItem(itemId);
            }
        });
    }
}
