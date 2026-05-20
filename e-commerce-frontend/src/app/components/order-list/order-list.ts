import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSelectModule, FormsModule],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderList implements OnInit {
  orders: Order[] = [];
  displayedColumns: string[] = ['id', 'user', 'total', 'status', 'date'];
  statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  isAdmin = false;
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  constructor(private orderService: OrderService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUserValue();
    this.isAdmin = user?.role === 'admin';
    if (!this.isAdmin) {
      this.displayedColumns = ['id', 'total', 'status', 'date']; // removed user
    }
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders(this.currentPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.orders = res.data;
      this.totalItems = res.total || 0;
      this.cdr.detectChanges();
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  updateStatus(order: Order, newStatus: string) {
    if (order._id) {
      this.orderService.updateOrderStatus(order._id, newStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          order.status = newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update status', err);
        }
      });
    }
  }
}
