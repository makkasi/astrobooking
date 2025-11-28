import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];

  constructor(private bookingService: BookingService, private authService: AuthService) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.bookingService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      const password = this.authService.getPassword();
      this.bookingService.deleteProduct(id, password).subscribe({
        next: () => {
          this.loadProducts();
          alert('Product deleted.');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete. Session might be invalid.');
          if (err.status === 401) this.authService.logout();
        }
      });
    }
  }
}
