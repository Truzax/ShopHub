import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard-component',
  imports: [MatCardModule, MatSnackBarModule, MatButtonModule, RouterModule],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.css'],
})
export class DashboardComponent /*implements OnInit*/ {
  // alertMessage = 'This is the admin dashboard. Only users with admin access can see this page.';
  // alert = {
  //   type: 'info'
  // };

  // constructor(private snackBar: MatSnackBar) {}

  // ngOnInit(): void {
  //   this.snackBar.open(this.alertMessage, 'Close', {
  //     duration: 5000
  //   });
  // }
}
