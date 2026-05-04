import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-dashboard-component',
  imports: [MatCardModule, MatButtonModule, RouterModule, AsyncPipe, NgIf],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.css'],
})
export class DashboardComponent {
  private auth = inject(AuthService);
  currentUser$ = this.auth.currentUser$;

}
