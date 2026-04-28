import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Cart } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        this.cartSubject.next(cart);
      } catch (e) {
        console.error('Error loading cart from storage:', e);
      }
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartSubject.value));
  }

  private getProductId(product: Product): string {
    return product._id || '';
  }

  addToCart(product: Product, quantity: number = 1): { success: boolean; addedQuantity: number; message?: string } {
    const currentCart = this.cartSubject.value;
    const productId = this.getProductId(product);
    const existingItem = currentCart.items.find(
      (item) => this.getProductId(item.product) === productId
    );
    const currentQuantity = existingItem?.quantity || 0;
    const availableQuantity = Math.max(product.stock - currentQuantity, 0);

    if (availableQuantity <= 0) {
      return {
        success: false,
        addedQuantity: 0,
        message: 'You already have the maximum available stock in your cart.',
      };
    }

    const quantityToAdd = Math.min(quantity, availableQuantity);

    if (existingItem) {
      existingItem.quantity += quantityToAdd;
    } else {
      currentCart.items.push({ product, quantity: quantityToAdd });
    }

    this.updateCartTotal();
    this.saveCartToStorage();

    return {
      success: quantityToAdd === quantity,
      addedQuantity: quantityToAdd,
      message: quantityToAdd < quantity
        ? `Only ${quantityToAdd} item${quantityToAdd === 1 ? '' : 's'} could be added because of stock limits.`
        : undefined,
    };
  }

  removeFromCart(productId: string): void {
    const currentCart = this.cartSubject.value;
    currentCart.items = currentCart.items.filter(
      (item) => this.getProductId(item.product) !== productId
    );
    this.updateCartTotal();
    this.saveCartToStorage();
  }

  updateQuantity(productId: string, quantity: number): { success: boolean; addedQuantity: number; message?: string } {
    const currentCart = this.cartSubject.value;
    const item = currentCart.items.find(
      (i) => this.getProductId(i.product) === productId
    );
    if (item) {
      const maxQuantity = Math.max(item.product.stock, 0);

      if (quantity <= 0) {
        this.removeFromCart(productId);
        return { success: true, addedQuantity: 0 };
      }

      const nextQuantity = Math.min(quantity, maxQuantity);
      item.quantity = nextQuantity;
      this.updateCartTotal();
      this.saveCartToStorage();

      return {
        success: nextQuantity === quantity,
        addedQuantity: nextQuantity,
        message: nextQuantity < quantity
          ? `Quantity was reduced to ${nextQuantity} due to stock limits.`
          : undefined,
      };
    }

    return {
      success: false,
      addedQuantity: 0,
      message: 'Item not found in cart.',
    };
  }

  getCart(): Cart {
    return this.cartSubject.value;
  }

  clearCart(): void {
    this.cartSubject.next({ items: [], total: 0 });
    localStorage.removeItem('cart');
  }

  private updateCartTotal(): void {
    const currentCart = this.cartSubject.value;
    currentCart.total = currentCart.items.reduce(
      (sum, item) => sum + (item.product.price || 0) * item.quantity,
      0
    );
    this.cartSubject.next({ ...currentCart });
  }
}
