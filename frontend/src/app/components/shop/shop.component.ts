import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { BookingService } from '../../services/booking.service';

declare var paypal: any;

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit, AfterViewInit {
  allProducts: any[] = [];
  products: any[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  loading = true;
  error = '';

  @ViewChildren('paypalContainer') paypalContainers!: QueryList<ElementRef>;

  constructor(private bookingService: BookingService) { }

  ngOnInit(): void {
    this.bookingService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.products = data;
        this.extractCategories();
        this.loading = false;
        // Buttons will be rendered in ngAfterViewInit or after data loads
        setTimeout(() => this.renderButtons(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  ngAfterViewInit() {
    // Initial render might be empty if data hasn't loaded
  }

  extractCategories() {
    const cats = new Set(this.allProducts.map(p => p.category || 'General'));
    this.categories = ['All', ...Array.from(cats)];
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (category === 'All') {
      this.products = this.allProducts;
    } else {
      this.products = this.allProducts.filter(p => (p.category || 'General') === category);
    }
    // Re-render PayPal buttons for the filtered list
    setTimeout(() => this.renderButtons(), 100);
  }

  renderButtons() {
    // We need to match the container to the correct product in the FILTERED list
    this.paypalContainers.forEach((container, index) => {
      if (index >= this.products.length) return;

      const product = this.products[index];

      // Clear container just in case
      container.nativeElement.innerHTML = '';

      paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: product.title,
              amount: {
                currency_code: 'EUR',
                value: product.price.toString()
              }
            }]
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            // Call backend to fulfill order
            const order = {
              product_id: product.id,
              paypal_order_id: data.orderID,
              email: details.payer.email_address,
              name: details.payer.name.given_name + ' ' + details.payer.name.surname
            };

            this.bookingService.createOrder(order).subscribe({
              next: () => {
                alert('Thank you! Check your email for the download link.');
              },
              error: (err) => {
                console.error('Order fulfillment failed', err);
                alert('Payment successful, but we failed to send the email. Please contact support.');
              }
            });
          });
        },
        onError: (err: any) => {
          console.error('PayPal Error', err);
        }
      }).render(container.nativeElement);
    });
  }
}
