import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="p-0 overflow-hidden rounded-3xl animate-fade-in min-w-[450px] max-w-[600px]">
      <!-- Header -->
      <div class="bg-[var(--primary)] p-8 text-[var(--primary-foreground)] relative">
        <button mat-icon-button (click)="dialogRef.close()" class="absolute top-4 right-4 opacity-80 hover:opacity-100 hover:bg-white/10">
          <mat-icon>close</mat-icon>
        </button>
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div>
            <h2 class="text-2xl font-bold m-0">{{ data.orderNumber }}</h2>
            <p class="opacity-80 m-0 text-sm">{{ data.date | date:'MMMM d, y, h:mm a' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            {{ data.status }}
          </span>
          <span class="px-3 py-1 bg-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md opacity-90">
            Payment: Paid
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="p-8 max-h-[60vh] overflow-y-auto bg-[var(--card)]">
        <h3 class="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-6 flex items-center gap-2">
          <mat-icon class="text-sm h-4 w-4">shopping_bag</mat-icon> Order Items
        </h3>
        
        <div class="space-y-6">
          <div *ngFor="let item of data.products" class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-[var(--muted)] border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--muted-foreground)] flex-shrink-0">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div>
                <h4 class="font-bold text-[var(--foreground)] leading-tight mb-1">{{ getProductName(item.product) }}</h4>
                <p class="text-sm text-[var(--muted-foreground)]">Qty: {{ item.quantity }} × {{ item.price | currency:'INR':'symbol':'1.0-0' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-[var(--foreground)]">{{ (item.price * item.quantity) | currency:'INR':'symbol':'1.0-0' }}</p>
            </div>
          </div>
        </div>

        <mat-divider class="my-8 mt-5"></mat-divider>

        <!-- Summary -->
        <div class="space-y-3 mt-1">
          <div class="flex justify-between text-sm text-[var(--muted-foreground)]">
            <span>Subtotal</span>
            <span>{{ data.total | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between text-sm text-[var(--muted-foreground)]">
            <span>Shipping</span>
            <span class="text-[var(--success)] font-medium">FREE</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-[var(--foreground)] pt-3 border-t border-[var(--border)]">
            <span>Total Amount</span>
            <span class="text-[var(--primary)]">{{ data.total | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- Customer Note -->
        <div class="mt-8 p-4 bg-[var(--muted)] rounded-2xl border border-[var(--border)]">
          <div class="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
            <mat-icon class="text-sm h-4 w-4">info</mat-icon>
            <span class="text-xs font-bold uppercase tracking-wider">Note</span>
          </div>
          <p class="text-xs text-[var(--muted-foreground)] m-0">This order is protected by our standard return policy. If you have any issues, please contact support.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-[var(--muted)] border-t border-[var(--border)] flex justify-end">
        <button class="ref-btn ref-btn-primary px-8" (click)="dialogRef.close()">Close Details</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 24px !important;
      overflow: hidden;
      background-color: var(--card) !important;
    }
  `]
})
export class OrderDetailDialog {
  public dialogRef = inject(MatDialogRef<OrderDetailDialog>);
  public data: Order = inject(MAT_DIALOG_DATA);

  getProductName(product: any): string {
    return typeof product === 'string' ? 'Product' : product.name;
  }
}
