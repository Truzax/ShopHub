import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-user-home',
  imports: [MatCardModule],
  template: `
    <div>
      <mat-card class="p-5">
        <mat-card-title>Welcome, {{ userName }}</mat-card-title>
        <mat-card-content>
          <p class="py-3">This is the normal user view. You do not have admin access to the main dashboard.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class UserHomeComponent {
  userName = 'User';
}