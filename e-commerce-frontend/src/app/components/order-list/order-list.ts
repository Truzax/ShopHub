import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSelectModule, FormsModule],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderList implements OnInit {
  orders: Order[] = [];
  displayedColumns: string[] = ['id', 'user', 'total', 'status', 'date'];
  statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(data => {
      this.orders = data;
    });
  }

  updateStatus(order: Order, newStatus: string) {
    if (order._id) {
      this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
        next: () => {
          order.status = newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
        },
        error: (err) => {
          console.error('Failed to update status', err);
        }
      });
    }
  }
}
