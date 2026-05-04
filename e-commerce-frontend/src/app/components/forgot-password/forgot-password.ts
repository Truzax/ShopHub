import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  message: string | null = null;
  error: string | null = null;
  forgotForm: any;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.forgotForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

    this.forgotForm.controls.email.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.error = null;
      this.message = null;
      this.cdr.markForCheck();
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;
    const { email } = this.forgotForm.value;
    this.auth.forgotPassword(email).subscribe({
      next: (res) => {
        this.message = res?.message || 'If an account exists, a reset link has been sent';
        if (res?.resetUrl) this.message += `\n${res.resetUrl}`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to send reset link';
        this.cdr.detectChanges();
      }
    });
  }
}
