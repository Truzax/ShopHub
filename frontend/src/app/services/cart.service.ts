import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { CartItem, Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private cartSignal = signal<Cart>({ items: [], total: 0 });
  public readonly cart = this.cartSignal.asReadonly();
  public readonly totalItems = computed(() => this.cartSignal().items.reduce((sum, item) => sum + item.quantity, 0));
  public cart$ = toObservable(this.cartSignal);

  private apiUrl = `${environment.apiUrl}/cart`;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadCartFromStorage();
    this.initCartSync();
  }

  private initCartSync(): void {
    let previousUser: any = null;
    
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        if (previousUser && previousUser.id !== user.id) {
          this.cartSignal.set({ items: [], total: 0 });
          localStorage.removeItem('cart');
        }
        this.mergeAndSyncWithServer();
      } else {
        this.cartSignal.set({ items: [], total: 0 });
        localStorage.removeItem('cart');
      }
      previousUser = user;
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
    const localCart = this.cartSignal();
    
    this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).subscribe(
      (response) => {
        const serverCartItems = response.data?.items || [];
        
        if (localCart.items.length > 0) {
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
          
          this.saveCartToServer(mergedItems);
        } else if (serverCartItems.length > 0) {
          this.cartSignal.set({
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
        this.cartSignal.set({
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
        const cartData = JSON.parse(savedCart);
        this.cartSignal.set(cartData);
      } catch (e) {
        console.error('Error loading cart from storage:', e);
      }
    }
  }

  private saveCartToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartSignal()));
  }

  private saveAndSync(): void {
    this.saveCartToLocalStorage();
    
    if (this.authService.isAuthenticated()) {
      const items = this.cartSignal().items;
      this.saveCartToServer(items);
    }
  }

  private getProductId(product: Product): string {
    return product._id || '';
  }

  addToCart(product: Product, quantity: number = 1): { success: boolean; addedQuantity: number; message?: string } {
    const currentCart = this.cartSignal();
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
    let newItems = [...currentCart.items];

    if (existingItem) {
      newItems = newItems.map(item => 
        this.getProductId(item.product) === productId
          ? { ...item, quantity: item.quantity + quantityToAdd }
          : item
      );
    } else {
      newItems = [...newItems, { product, quantity: quantityToAdd }];
    }

    this.cartSignal.set({ ...currentCart, items: newItems });
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
    const currentCart = this.cartSignal();
    const newItems = currentCart.items.filter(
      (item) => this.getProductId(item.product) !== productId
    );
    this.cartSignal.set({ ...currentCart, items: newItems });
    this.updateCartTotal();
    this.saveAndSync();
  }

  updateQuantity(productId: string, quantity: number): { success: boolean; addedQuantity: number; message?: string } {
    const currentCart = this.cartSignal();
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
      const newItems = currentCart.items.map(i =>
        this.getProductId(i.product) === productId
          ? { ...i, quantity: nextQuantity }
          : i
      );
      
      this.cartSignal.set({ ...currentCart, items: newItems });
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
    return this.cartSignal();
  }

  clearCart(): void {
    this.cartSignal.set({ items: [], total: 0 });
    localStorage.removeItem('cart');
    
    if (this.authService.isAuthenticated()) {
      this.http.delete(this.apiUrl, { headers: this.getHeaders() }).subscribe(
        () => {},
        (error) => console.error('Error clearing cart on server:', error)
      );
    }
  }

  private updateCartTotal(): void {
    const currentCart = this.cartSignal();
    const total = currentCart.items.reduce(
      (sum, item) => sum + (item.product.price || 0) * item.quantity,
      0
    );
    this.cartSignal.set({ ...currentCart, total });
  }
}
