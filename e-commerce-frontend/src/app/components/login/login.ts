import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { merge } from 'rxjs';
import { AuthService } from '../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  error: string | null = null;
  loginForm: any;
  hide = signal(true);

  emailErrorMessage = signal('');
  passwordErrorMessage = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, public router: Router, private cdr: ChangeDetectorRef) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    merge(
      this.loginForm.controls.email.statusChanges,
      this.loginForm.controls.email.valueChanges,
      this.loginForm.controls.password.statusChanges,
      this.loginForm.controls.password.valueChanges
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.error = null;
        this.updateErrorMessages();
        this.cdr.markForCheck();
      });
  }

  updateErrorMessages() {
    if (this.loginForm.controls.email.hasError('required')) {
      this.emailErrorMessage.set('Email is required');
    } else if (this.loginForm.controls.email.hasError('email')) {
      this.emailErrorMessage.set('Enter a valid email');
    } else {
      this.emailErrorMessage.set('');
    }

    if (this.loginForm.controls.password.hasError('required')) {
      this.passwordErrorMessage.set('Password is required');
    } else if (this.loginForm.controls.password.hasError('minlength')) {
      this.passwordErrorMessage.set('Password must be at least 6 characters');
    } else {
      this.passwordErrorMessage.set('');
    }
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value as { email: string; password: string };
    this.auth.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Login failed';
        this.cdr.detectChanges();
      },
    });
  }
}
