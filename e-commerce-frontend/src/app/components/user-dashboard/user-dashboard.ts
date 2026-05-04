import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterModule, CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  private auth = inject(AuthService);
  private orderService = inject(OrderService);

  activeTab = signal<'orders' | 'profile' | 'settings'>('orders');
  user: any = null;
  orders: any[] = [];
  isEditing = signal(false);

  userData = {
    name: '',
    email: '',
    phone: '',
    address: '',
  };

  ngOnInit() {
    this.user = this.auth.getUserValue();
    this.userData.name = this.user?.name || '';
    this.userData.email = this.user?.email || '';
    this.userData.phone = this.user?.phone || '';
    this.userData.address = this.user?.address || '';

    this.orderService.getOrders(1, 50).subscribe(res => {
      this.orders = res.data || [];
    });
  }

  saveProfile() {
    this.isEditing.set(false);
  }
}
