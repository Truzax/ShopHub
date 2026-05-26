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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
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
