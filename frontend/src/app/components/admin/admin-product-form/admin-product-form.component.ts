import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-product-form',
  templateUrl: './admin-product-form.component.html',
  styleUrls: ['./admin-product-form.component.scss']
})
export class AdminProductFormComponent implements OnInit {
  product: any = {
    title: '',
    description: '',
    price: null,
    category: 'General'
  };
  imageFile: File | null = null;
  pdfFile: File | null = null;

  isEditing = false;
  productId: string | null = null;
  loading = false;
  error = '';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditing = true;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string) {
    // Ideally we should have a getProductById endpoint, but for now we filter from list
    // Or we can fetch all and find. 
    // Optimization: Add GET /api/products/{id} later.
    this.bookingService.getProducts().subscribe(products => {
      const found = products.find((p: any) => p.id === id);
      if (found) {
        this.product = { ...found };
      } else {
        this.error = 'Product not found';
      }
    });
  }

  onFileSelected(event: any, type: 'image' | 'pdf') {
    const file = event.target.files[0];
    if (type === 'image') {
      this.imageFile = file;
    } else {
      this.pdfFile = file;
    }
  }

  onSubmit() {
    if (!this.product.price) {
      this.error = 'Price is required.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.message = '';
    const password = this.authService.getPassword();

    if (this.isEditing && this.productId) {
      const updateData = {
        title: this.product.title,
        description: this.product.description,
        price: this.product.price,
        category: this.product.category,
        password: password
      };

      this.bookingService.updateProduct(this.productId, updateData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to update. Session might be invalid.';
          this.loading = false;
          if (err.status === 401) this.authService.logout();
        }
      });
    } else {
      if (!this.imageFile || !this.pdfFile) {
        this.error = 'Please select both Image and PDF files.';
        this.loading = false;
        return;
      }

      // Upload Image
      this.bookingService.uploadToCloudinary(this.imageFile, 'preset_name').subscribe({
        next: (imageRes) => {
          const imageUrl = imageRes.secure_url;

          // Upload PDF
          this.bookingService.uploadToCloudinary(this.pdfFile!, 'preset_name').subscribe({
            next: (pdfRes) => {
              const pdfPublicId = pdfRes.public_id;

              const productData = {
                title: this.product.title,
                description: this.product.description,
                price: this.product.price,
                category: this.product.category,
                password: password,
                image_url: imageUrl,
                pdf_public_id: pdfPublicId
              };

              this.bookingService.uploadProduct(productData).subscribe({
                next: () => {
                  this.loading = false;
                  this.router.navigate(['/admin/products']);
                },
                error: (err) => {
                  console.error(err);
                  this.error = 'Failed to create product.';
                  this.loading = false;
                  if (err.status === 401) this.authService.logout();
                }
              });
            },
            error: (err) => {
              this.error = 'Failed to upload PDF.';
              this.loading = false;
            }
          });
        },
        error: (err) => {
          this.error = 'Failed to upload Image.';
          this.loading = false;
        }
      });
    }
  }
}
