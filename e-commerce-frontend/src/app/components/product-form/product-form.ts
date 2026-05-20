import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../services/product.service';
import { AiService } from '../../services/ai.service';

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
    MatIconModule,
    RouterModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductForm implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  errorMessage: string = '';
  isGeneratingAi: boolean = false;
  aiError: string | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private aiService: AiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      shortDescription: [''],
      longDescription: [''],
      features: [''],
      seoKeywords: ['']
    });
  }

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.productService.getProductById(this.productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (product) => {
          this.productForm.patchValue({
            ...product,
            shortDescription: product.description?.short || '',
            longDescription: product.description?.long || '',
            features: product.features ? product.features.join('\n') : '',
            seoKeywords: product.seoKeywords ? product.seoKeywords.join(', ') : ''
          });
        },
        error: (err) => {
          this.errorMessage = 'Failed to load product details';
        }
      });
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const productData = {
        name: formValue.name,
        price: formValue.price,
        category: formValue.category,
        stock: formValue.stock,
        description: {
          short: formValue.shortDescription,
          long: formValue.longDescription
        },
        features: formValue.features ? formValue.features.split('\n').filter((f: string) => f.trim()) : [],
        seoKeywords: formValue.seoKeywords ? formValue.seoKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : []
      };

      if (this.isEditMode && this.productId) {
        this.productService.updateProduct(this.productId, productData as any).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => this.errorMessage = 'Failed to update product'
        });
      } else {
        this.productService.createProduct(productData as any).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.router.navigate(['/products']),
          error: (err) => this.errorMessage = 'Failed to create product'
        });
      }
    }
  }

  generateAiDescription() {
    const name = this.productForm.get('name')?.value;
    const category = this.productForm.get('category')?.value;
    
    if (!name || !category) {
      this.aiError = 'Please enter Product Name and Category first to generate AI content.';
      return;
    }

    this.isGeneratingAi = true;
    this.aiError = null;

    this.aiService.generateProductDescription({
      name,
      category,
      features: this.productForm.get('features')?.value || '',
      tone: 'professional'
    }).subscribe({
      next: (res) => {
        if (res.success && res.generatedData) {
          this.productForm.patchValue({
            shortDescription: res.generatedData.shortDescription,
            longDescription: res.generatedData.longDescription,
            features: res.generatedData.bulletPoints ? res.generatedData.bulletPoints.join('\n') : '',
            seoKeywords: res.generatedData.seoKeywords ? res.generatedData.seoKeywords.join(', ') : ''
          });
        } else {
          this.aiError = 'Failed to generate content. Please try again.';
        }
        this.isGeneratingAi = false;
      },
      error: (err) => {
        this.aiError = 'Error connecting to AI service.';
        this.isGeneratingAi = false;
      }
    });
  }
}
