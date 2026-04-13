import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-reset-confirmation',
  imports: [MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './reset-confirmation.html',
})
export class ResetConfirmation {}
