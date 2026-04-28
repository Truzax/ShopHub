import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatInputModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductList implements OnInit {
  products: Product[] = [];
  displayedColumns: string[] = ['name', 'price', 'category', 'stock', 'quantity', 'cartActions'];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  isAdmin = false;
  quantities: { [key: string]: number } = {};
  private destroyRef = inject(DestroyRef);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const user = this.auth.getUserValue();
    this.isAdmin = user?.role === 'admin';
    if (this.isAdmin) {
      this.displayedColumns = ['name', 'price', 'category', 'stock', 'actions'];
    }
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts(this.currentPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.products = res.data ? [...res.data] : [];
      this.totalItems = res.total || 0;
      // Initialize quantities for each product
      this.products.forEach(product => {
        const productId = (product as any)._id;
        if (!this.quantities[productId]) {
          this.quantities[productId] = 1;
        }
      });
      this.cdr.detectChanges();
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  addToCart(product: Product) {
    const productId = (product as any)._id;
    const quantity = this.quantities[productId] || 1;

    if (quantity <= 0) {
      this.snackBar.open('Quantity must be at least 1', 'Close', { duration: 3000 });
      return;
    }

    const result = this.cartService.addToCart(product, quantity);
    this.snackBar.open(
      result.message || `${product.name} added to cart!`,
      'Close',
      { duration: 2000 }
    );

    // Reset quantity to 1 after adding
    this.quantities[productId] = 1;
  }

  deleteProduct(id: string) {
    if(confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.loadProducts();
      });
    }
  }

  getProductId(product: Product): string {
    return (product as any)._id;
  }
}
