import { Component } from '@angular/core';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  product: {
    title: string;
    description: string;
    price: number | null;
    password: string;
  } = {
      title: '',
      description: '',
      price: null,
      password: ''
    };
  imageFile: File | null = null;
  pdfFile: File | null = null;

  loading = false;
  message = '';
  error = '';

  constructor(private bookingService: BookingService) { }

  onFileSelected(event: any, type: 'image' | 'pdf') {
    const file = event.target.files[0];
    if (type === 'image') {
      this.imageFile = file;
    } else {
      this.pdfFile = file;
    }
  }

  onSubmit() {
    if (!this.imageFile || !this.pdfFile || !this.product.price) {
      this.error = 'Please fill all fields and select both files.';
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    // 1. Upload Image
    this.bookingService.uploadToCloudinary(this.imageFile, 'preset_name').subscribe({
      next: (imageRes) => {
        const imageUrl = imageRes.secure_url;

        // 2. Upload PDF
        this.bookingService.uploadToCloudinary(this.pdfFile!, 'preset_name').subscribe({
          next: (pdfRes) => {
            const pdfPublicId = pdfRes.public_id;

            // 3. Send Data to Backend
            const productData = {
              title: this.product.title,
              description: this.product.description,
              price: this.product.price,
              password: this.product.password,
              image_url: imageUrl,
              pdf_public_id: pdfPublicId
            };

            this.bookingService.uploadProduct(productData).subscribe({
              next: () => {
                this.message = 'Product uploaded successfully!';
                this.loading = false;
                this.product = { title: '', description: '', price: null, password: '' };
                this.imageFile = null;
                this.pdfFile = null;
              },
              error: (err) => {
                console.error(err);
                this.error = 'Failed to save product to database.';
                this.loading = false;
              }
            });
          },
          error: (err) => {
            console.error(err);
            this.error = 'Failed to upload PDF to Cloudinary.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to upload Image to Cloudinary.';
        this.loading = false;
      }
    });
  }
}
