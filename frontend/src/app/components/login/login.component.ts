import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/products']);
    }
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.password).subscribe(success => {
      this.loading = false;
      if (success) {
        this.router.navigate(['/admin/products']);
      } else {
        this.error = 'Invalid password';
      }
    });
  }
}
