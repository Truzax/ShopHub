import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import { AuthService } from '../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, RouterLink, MatIconModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  error: string | null = null;
  hide = signal(true);
  signupForm: any;

  nameErrorMessage = signal('');
  emailErrorMessage = signal('');
  passwordErrorMessage = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    merge(
      this.signupForm.controls.name.statusChanges,
      this.signupForm.controls.name.valueChanges,
      this.signupForm.controls.email.statusChanges,
      this.signupForm.controls.email.valueChanges,
      this.signupForm.controls.password.statusChanges,
      this.signupForm.controls.password.valueChanges
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessages());
  }

  updateErrorMessages() {
    if (this.signupForm.controls.name.hasError('required')) {
      this.nameErrorMessage.set('Name is required');
    } else {
      this.nameErrorMessage.set('');
    }

    if (this.signupForm.controls.email.hasError('required')) {
      this.emailErrorMessage.set('Email is required');
    } else if (this.signupForm.controls.email.hasError('email')) {
      this.emailErrorMessage.set('Enter a valid email');
    } else {
      this.emailErrorMessage.set('');
    }

    if (this.signupForm.controls.password.hasError('required')) {
      this.passwordErrorMessage.set('Password is required');
    } else if (this.signupForm.controls.password.hasError('minlength')) {
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
    if (this.signupForm.invalid) return;
    const { name, email, password } = this.signupForm.value as { name: string; email: string; password: string };
    this.auth.signup({ name, email, password }).subscribe({
      next: (res) => {
        const user = res.user;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => (this.error = err?.error?.message || 'Signup failed'),
    });
  }
}
