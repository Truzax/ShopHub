import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Cart } from '../../models/cart.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let cartSubject: BehaviorSubject<Cart>;

  beforeEach(async () => {
    cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
    
    mockCartService = jasmine.createSpyObj('CartService', ['updateQuantity', 'removeFromCart']);
    // @ts-ignore
    mockCartService.cart$ = cartSubject.asObservable();
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CartComponent, BrowserAnimationsModule],
      providers: [
        { provide: CartService, useValue: mockCartService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init and subscribe to cart updates', () => {
    const testCart: Cart = {
      items: [{ product: { _id: '1', name: 'Shoes', price: 50, stock: 10 } as any, quantity: 2 }],
      total: 100
    };
    cartSubject.next(testCart);

    expect(component.cart).toEqual(testCart);
  });

  it('should update quantity via CartService', () => {
    component.updateQuantity('1', 5);
    expect(mockCartService.updateQuantity).toHaveBeenCalledWith('1', 5);
  });

  it('should remove item via CartService', () => {
    component.removeItem('1');
    expect(mockCartService.removeFromCart).toHaveBeenCalledWith('1');
  });

  describe('checkout', () => {
    it('should navigate to checkout when cart has items', () => {
      spyOn(window, 'alert');
      component.cart = {
        items: [{ product: { _id: '1', name: 'Shoes', price: 50, stock: 10 } as any, quantity: 2 }],
        total: 100
      };
      
      component.checkout();
      
      expect(window.alert).not.toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/checkout']);
    });

    it('should show alert and not navigate when cart is empty', () => {
      spyOn(window, 'alert');
      component.cart = { items: [], total: 0 };
      
      component.checkout();
      
      expect(window.alert).toHaveBeenCalledWith('Cart is empty');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('should navigate to products when continuing shopping', () => {
    component.continueShopping();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should return product id', () => {
    expect(component.getProductId({ _id: '123' })).toBe('123');
    expect(component.getProductId({ id: '456' })).toBe('456');
  });
});