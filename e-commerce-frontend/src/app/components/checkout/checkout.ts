import { Component, DestroyRef, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class CheckoutComponent implements OnInit {
  cart: Cart = { items: [], total: 0 };
  currentUser: any = null;
  isLoading = false;
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Get cart
    this.cartService.cart$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cart) => {
        this.cart = cart;
      });
  }

  placeOrder(): void {
    if (!this.currentUser) {
      this.snackBar.open('Please login to place an order', 'Close', { duration: 3000 });
      return;
    }

    if (this.cart.items.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Prepare order data
    const orderData = {
      user: this.currentUser._id,
      products: this.cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      status: 'pending',
    };

    this.orderService.createOrder(orderData as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          const errorMessage = error.error?.message || 'Failed to place order';
          this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        },
      });
  }

  cancelOrder(): void {
    this.router.navigate(['/cart']);
  }
}
