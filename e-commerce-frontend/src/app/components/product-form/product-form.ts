import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductForm implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  errorMessage: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.productService.getProductById(this.productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (product) => {
          this.productForm.patchValue(product);
        },
        error: (err) => {
          this.errorMessage = 'Failed to load product details';
        }
      });
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      if (this.isEditMode && this.productId) {
        this.productService.updateProduct(this.productId, productData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => this.errorMessage = 'Failed to update product'
        });
      } else {
        this.productService.createProduct(productData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => this.errorMessage = 'Failed to create product'
        });
      }
    }
  }
}
