export class ProductCard {
    static render(product) {
        return `
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
        `;
    }

    static renderAll(products) {
        return products.map(product => this.render(product)).join('');
    }
}