import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { OrderDetailDialog } from './order-detail-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatDialogModule, RouterModule],
  template: `
    <div class="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">My Orders</h1>
          <p class="text-slate-500 mt-1">Track and manage your order history</p>
        </div>
        <a routerLink="/dashboard" class="ref-btn ref-btn-outline gap-2">
          <mat-icon class="text-sm h-4 w-4">shopping_cart</mat-icon>
          Continue Shopping
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20">
        <mat-spinner [diameter]="40"></mat-spinner>
        <p class="text-slate-500 mt-4">Fetching your orders...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && orders().length === 0" class="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center shadow-sm">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <mat-icon class="text-slate-300 scale-[2]">receipt_long</mat-icon>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
        <p class="text-slate-500 mb-8 max-w-sm mx-auto">Looks like you haven't placed any orders yet. Start shopping to see your orders here!</p>
        <a routerLink="/dashboard" class="ref-btn ref-btn-primary px-8">Start Shopping</a>
      </div>

      <!-- Orders List -->
      <div *ngIf="!isLoading() && orders().length > 0" class="space-y-6">
        <div *ngFor="let order of orders()" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <!-- Order Header -->
          <div class="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <mat-icon>package_2</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Order</span>
                  <span class="text-lg font-bold text-slate-900">{{ order.orderNumber }}</span>
                </div>
                <p class="text-sm text-slate-500">{{ order.date | date:'longDate' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="ref-badge px-4 py-1.5 rounded-full text-sm font-medium" 
                    [ngClass]="getStatusClass(order.status)">
                {{ order.status | titlecase }}
              </span>
              <button (click)="viewOrderDetails(order)" class="ref-btn ref-btn-ghost ref-btn-sm font-semibold text-indigo-600">View Details</button>
            </div>
          </div>

          <!-- Order Content Summary -->
          <div class="p-6 bg-slate-50/50">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <!-- Products Summary -->
              <div class="md:col-span-2">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Items</h4>
                <div class="space-y-3">
                  <div *ngFor="let item of order.products | slice:0:3" class="flex items-center justify-between">
                    <div class="flex items-center gap-3 truncate">
                      <div class="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <mat-icon class="text-base w-4 h-4">inventory_2</mat-icon>
                      </div>
                      <span class="text-sm text-slate-700 truncate font-medium">{{ getProductName(item.product) }}</span>
                      <span class="text-xs text-slate-400">x{{ item.quantity }}</span>
                    </div>
                    <span class="text-sm font-semibold text-slate-900">{{ (item.price * item.quantity) | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                  <div *ngIf="order.products.length > 3" class="text-xs text-indigo-600 font-semibold pl-11">
                    +{{ order.products.length - 3 }} more items
                  </div>
                </div>
              </div>

              <!-- Payment Summary -->
              <div class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Amount</h4>
                  <p class="text-2xl font-bold text-slate-900">{{ order.total | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-xs text-slate-500">Payment Status</span>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Paid</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Order Footer / Progress -->
          <div class="px-6 py-4 border-t border-slate-100 bg-white">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-600 transition-all duration-500" [style.width]="getProgressWidth(order.status) + '%'"></div>
              </div>
              <span class="text-xs font-bold text-slate-400 uppercase">{{ getProgressText(order.status) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ref-status-pending { background-color: #fef9c3; color: #854d0e; }
    .ref-status-processing { background-color: #dcfce7; color: #166534; }
    .ref-status-shipped { background-color: #dbeafe; color: #1e40af; }
    .ref-status-delivered { background-color: #f0fdf4; color: #15803d; }
    .ref-status-cancelled { background-color: #fee2e2; color: #991b1b; }
  `]
})
export class UserOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  orders = signal<Order[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchOrders();
  }

  viewOrderDetails(order: Order) {
    this.dialog.open(OrderDetailDialog, {
      data: order,
      maxWidth: '600px',
      width: '100%',
      panelClass: 'custom-dialog-container'
    });
  }

  fetchOrders() {
    this.isLoading.set(true);
    this.orderService.getOrders(1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.orders.set(res.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.isLoading.set(false);
        }
      });
  }

  getProductName(product: any): string {
    return typeof product === 'string' ? 'Product' : product.name;
  }

  getStatusClass(status: string): string {
    return `ref-status-${status.toLowerCase()}`;
  }

  getProgressWidth(status: string): number {
    const steps: Record<string, number> = {
      'pending': 20,
      'processing': 40,
      'shipped': 70,
      'delivered': 100,
      'cancelled': 100
    };
    return steps[status.toLowerCase()] || 0;
  }

  getProgressText(status: string): string {
    if (status === 'cancelled') return 'Order Cancelled';
    if (status === 'delivered') return 'Successfully Delivered';
    return `Order is ${status}`;
  }
}
