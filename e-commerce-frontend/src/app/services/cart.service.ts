import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CartItem, Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { tap, filter, take, switchMap, map, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
  public cart$ = this.cartSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/cart`;
  private isSyncing = false;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadCartFromStorage();
    this.initCartSync();
  }

  private initCartSync(): void {
    // When user changes (login/logout)
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        // User just logged in, sync guest cart to server
        this.mergeAndSyncWithServer();
      } else {
        // User logged out, clear the local cart
        this.cartSubject.next({ items: [], total: 0 });
        localStorage.removeItem('cart');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private mergeAndSyncWithServer(): void {
    const localCart = this.cartSubject.value;
    
    this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).subscribe(
      (response) => {
        const serverCartItems = response.data?.items || [];
        
        if (localCart.items.length > 0) {
          // Merge local into server
          const mergedItems = [...serverCartItems];
          
          localCart.items.forEach(localItem => {
            const existingItem = mergedItems.find(si => si.product._id === localItem.product._id);
            if (existingItem) {
              existingItem.quantity += localItem.quantity;
            } else {
              mergedItems.push({
                product: localItem.product,
                quantity: localItem.quantity
              });
            }
          });
          
          // Save merged to server
          this.saveCartToServer(mergedItems);
        } else if (serverCartItems.length > 0) {
          // Just load server cart
          this.cartSubject.next({
            items: serverCartItems,
            total: this.calculateTotal(serverCartItems)
          });
          this.saveCartToLocalStorage();
        }
      },
      (error) => console.error('Error fetching cart from server:', error)
    );
  }

  private saveCartToServer(items: any[]): void {
    const payload = {
      items: items.map(i => ({
        product: i.product._id,
        quantity: i.quantity
      }))
    };

    this.http.post<any>(this.apiUrl, payload, { headers: this.getHeaders() }).subscribe(
      (response) => {
        const updatedItems = response.data?.items || [];
        this.cartSubject.next({
          items: updatedItems,
          total: this.calculateTotal(updatedItems)
        });
        this.saveCartToLocalStorage();
      },
      (error) => console.error('Error saving cart to server:', error)
    );
  }

  private calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
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

  private saveCartToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartSubject.value));
  }

  private saveAndSync(): void {
    this.saveCartToLocalStorage();
    
    // Also sync to server if logged in
    if (this.authService.isAuthenticated()) {
      const items = this.cartSubject.value.items;
      this.saveCartToServer(items);
    }
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
      currentCart.items = currentCart.items.map(item => 
        this.getProductId(item.product) === productId
          ? { ...item, quantity: item.quantity + quantityToAdd }
          : item
      );
    } else {
      currentCart.items = [...currentCart.items, { product, quantity: quantityToAdd }];
    }

    this.updateCartTotal();
    this.saveAndSync();

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
    this.saveAndSync();
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
      currentCart.items = currentCart.items.map(i =>
        this.getProductId(i.product) === productId
          ? { ...i, quantity: nextQuantity }
          : i
      );
      this.updateCartTotal();
      this.saveAndSync();

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
    
    if (this.authService.isAuthenticated()) {
      this.http.delete(this.apiUrl, { headers: this.getHeaders() }).subscribe(
        () => {},
        (error) => console.error('Error clearing cart on server:', error)
      );
    }
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
