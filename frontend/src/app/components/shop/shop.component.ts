import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { BookingService } from '../../services/booking.service';

declare var paypal: any;

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit, AfterViewInit {
  products: any[] = [];
  loading = true;
  error = '';

  @ViewChildren('paypalContainer') paypalContainers!: QueryList<ElementRef>;

  constructor(private bookingService: BookingService) { }

  ngOnInit(): void {
    this.bookingService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
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

  renderButtons() {
    this.paypalContainers.forEach((container, index) => {
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
