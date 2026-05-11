import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p class="text-slate-500 mt-1">Manage your personal information and preferences</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar / Profile Preview -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm sticky top-24">
            <div class="relative inline-block mb-4">
              <div class="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto border-4 border-white shadow-md">
                <mat-icon style="font-size: 40px; width: 40px; height: 40px;">person</mat-icon>
              </div>
              <button class="absolute bottom-0 right-0 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">photo_camera</mat-icon>
              </button>
            </div>
            <h2 class="text-lg font-bold text-slate-900 truncate">{{ user?.name || 'Your Name' }}</h2>
            <p class="text-sm text-slate-500 truncate mb-6">{{ user?.email }}</p>
          </div>
        </div>

        <!-- Main Form -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900">Personal Information</h3>
              <span class="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase">Details</span>
            </div>
            
            <div class="p-8">
              <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input type="text" formControlName="name" class="ref-input w-full" placeholder="John Doe">
                    <p *ngIf="profileForm.get('name')?.invalid && profileForm.get('name')?.touched" class="text-xs text-red-500 mt-1">Name is required</p>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input type="email" formControlName="email" class="ref-input w-full bg-slate-50 cursor-not-allowed" readonly>
                    <p class="text-[10px] text-slate-400 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div class="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" (click)="resetForm()" class="ref-btn ref-btn-ghost px-6" [disabled]="isSubmitting()">Reset</button>
                  <button type="submit" class="ref-btn ref-btn-primary px-10 gap-2" [disabled]="profileForm.invalid || isSubmitting() || !profileForm.dirty">
                    <mat-spinner *ngIf="isSubmitting()" [diameter]="16"></mat-spinner>
                    {{ isSubmitting() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Security Section (Optional/Placeholder) -->
          <!--<div class="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <mat-icon>lock</mat-icon>
              </div>
              <div>
                <h4 class="font-bold text-slate-900">Security</h4>
                <p class="text-sm text-slate-500">Change your password and secure your account</p>
              </div>
            </div>
            <button class="ref-btn ref-btn-outline text-sm">Update Password</button>
          </div> -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class UserProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  profileForm: FormGroup;
  user: any;
  isSubmitting = signal(false);

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phone: [''],
      address: ['']
    });
  }

  ngOnInit() {
    this.user = this.auth.getUserValue();
    this.resetForm();
  }

  resetForm() {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        address: this.user.address || ''
      });
      this.profileForm.markAsPristine();
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSubmitting.set(true);
    const updatedData = this.profileForm.value;

    // Simulate API call or use usersController update
    // For now, I'll update via AuthService if it supports it, or direct HTTP
    this.http.put(`${environment.apiUrl}/users/profile`, updatedData).subscribe({
      next: (res: any) => {
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
        // Update local auth state if backend returns updated user
        if (res.data) {
          // You might need a method in AuthService to update local user state
          localStorage.setItem('user', JSON.stringify(res.data));
          // Trigger a refresh of the user data in app
          window.location.reload(); 
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Update profile error:', err);
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 3000 });
        this.isSubmitting.set(false);
      }
    });
  }
}
