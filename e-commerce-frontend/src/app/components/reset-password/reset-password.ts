import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  message: string | null = null;
  error: string | null = null;
  resetForm: any;
  token: string | null = null;
  email: string | null = null;
  valid: boolean | null = null;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.resetForm = this.fb.group({ password: ['', [Validators.required, Validators.minLength(6)]], confirm: ['', [Validators.required]] });

    this.route.queryParams.subscribe((p) => {
      this.token = p['token'] || null;
      this.email = p['email'] || null;
      if (this.token && this.email) {
        this.valid = null; // verifying
        this.cdr.markForCheck();
        this.auth.validateReset(this.token, this.email).subscribe({
          next: () => {
            this.valid = true;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.valid = false;
            this.error = err?.error?.message || 'Invalid or expired reset link';
            this.cdr.detectChanges();
          },
        });
      } else {
        this.valid = false;
        this.error = 'Missing reset token or email';
        this.cdr.detectChanges();
      }
    });

    this.resetForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.error = null;
      this.message = null;
      this.cdr.markForCheck();
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    const { password, confirm } = this.resetForm.value;
    if (password !== confirm) {
      this.error = 'Passwords do not match';
      this.cdr.detectChanges();
      return;
    }
    if (!this.token || !this.email) {
      this.error = 'Missing reset token or email';
      this.cdr.detectChanges();
      return;
    }

    if (this.valid === false) {
      this.error = 'This reset link is invalid or has expired.';
      this.cdr.detectChanges();
      return;
    }

    this.auth.resetPassword({ email: this.email, token: this.token, password }).subscribe({
      next: (res) => {
        this.message = res?.message || 'Password reset successful';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/reset-confirmation']), 800);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to reset password';
        this.cdr.detectChanges();
      }
    });
  }
}
