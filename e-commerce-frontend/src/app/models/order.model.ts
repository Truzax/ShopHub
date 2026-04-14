import { Product } from './product.model';

export interface OrderItem {
  _id?: string;
  product: Product | string;
  quantity: number;
  price: number;
}

export interface Order {
  _id?: string;
  user: any; // User interface
  products: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string | Date;
  createdAt?: string;
  updatedAt?: string;
}
