import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { AuthService } from './auth';
import { BehaviorSubject, of } from 'rxjs';
import { environment } from '../../environments/environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject(null);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    authServiceSpy.currentUser$ = currentUserSubject.asObservable();

    // Clear local storage to ensure fresh state
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addToCart', () => {
    it('should add a new product to cart when enough stock exists', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product = { _id: '1', name: 'Test Product', price: 100, stock: 5 } as any;

      const result = service.addToCart(product, 2);

      expect(result.success).toBeTrue();
      expect(result.addedQuantity).toBe(2);
      
      const cart = service.getCart();
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].product._id).toBe('1');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.total).toBe(200);
      
      const savedCart = JSON.parse(localStorage.getItem('cart') || '{}');
      expect(savedCart.items[0].quantity).toBe(2);
    });

    it('should incrementally add to an existing product quantity in cart', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product = { _id: '1', name: 'Test Product', price: 100, stock: 5 } as any;

      service.addToCart(product, 1);
      const result = service.addToCart(product, 2);

      expect(result.success).toBeTrue();
      expect(result.addedQuantity).toBe(2);
      
      const cart = service.getCart();
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('should not add more than available stock', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product = { _id: '2', name: 'Limited Product', price: 50, stock: 2 } as any;

      service.addToCart(product, 1);
      const result = service.addToCart(product, 5); // Exceeds stock

      expect(result.success).toBeFalse();
      expect(result.addedQuantity).toBe(1); // Only 1 left in stock
      expect(result.message).toContain('stock limits');
      
      const cart = service.getCart();
      expect(cart.items[0].quantity).toBe(2);
    });

    it('should sync to server when adding to cart if logged in', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      localStorage.setItem('access_token', 'test-token');
      
      const product = { _id: '1', price: 100, stock: 5 } as any;
      service.addToCart(product, 1);

      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req.request.body.items).toEqual([{ product: '1', quantity: 1 }]);
      
      req.flush({ data: { items: [{ product, quantity: 1 }] } });
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity correctly', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product = { _id: '1', price: 100, stock: 10 } as any;
      service.addToCart(product, 2);

      const result = service.updateQuantity('1', 5);

      expect(result.success).toBeTrue();
      const cart = service.getCart();
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.total).toBe(500);
    });

    it('should remove item if quantity is zero or less', () => {
        authServiceSpy.isAuthenticated.and.returnValue(false);
        const product = { _id: '1', price: 100, stock: 10 } as any;
        service.addToCart(product, 2);
  
        const result = service.updateQuantity('1', 0);
  
        expect(result.success).toBeTrue();
        expect(service.getCart().items.length).toBe(0);
      });
  });

  describe('removeFromCart', () => {
    it('should remove the specified item from cart', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product1 = { _id: '1', price: 100, stock: 10 } as any;
      const product2 = { _id: '2', price: 50, stock: 10 } as any;

      service.addToCart(product1, 1);
      service.addToCart(product2, 1);

      expect(service.getCart().items.length).toBe(2);

      service.removeFromCart('1');

      const cart = service.getCart();
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].product._id).toBe('2');
    });
  });

  describe('clearCart', () => {
    it('should clear local cart and storage when not logged in', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const product = { _id: '1', price: 100, stock: 10 } as any;
      service.addToCart(product, 1);
      
      service.clearCart();

      const cart = service.getCart();
      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
      expect(localStorage.getItem('cart')).toBeNull();
    });

    it('should clear local cart and delete from server when logged in', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      const product = { _id: '1', price: 100, stock: 10 } as any;
      service.addToCart(product, 1);

      // flush the POST from addToCart first
      const postReq = httpMock.expectOne(`${environment.apiUrl}/cart`);
      postReq.flush({});

      service.clearCart();

      const delReq = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(delReq.request.method).toBe('DELETE');
      delReq.flush({});

      expect(service.getCart().items.length).toBe(0);
    });
  });

  describe('user sync', () => {
      it('should merge and sync with server when user logs in', () => {
          authServiceSpy.isAuthenticated.and.returnValue(true);
          
          // User logs in 
          currentUserSubject.next({ id: 'user1' });

          const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
          expect(req.request.method).toBe('GET');
          req.flush({ data: { items: [] } });
      });

      it('should clear cart when user logs out', () => {
          service.addToCart({ _id: '1', price: 100, stock: 5 } as any, 1);
          
          // User logs out (null user)
          currentUserSubject.next(null);

          expect(service.getCart().items.length).toBe(0);
          expect(localStorage.getItem('cart')).toBeNull();
      });
  });
});