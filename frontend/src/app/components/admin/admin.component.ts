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

    const formData = new FormData();
    formData.append('title', this.product.title);
    formData.append('description', this.product.description);
    formData.append('price', (this.product.price as number).toString());
    formData.append('password', this.product.password);
    formData.append('image', this.imageFile);
    formData.append('pdf', this.pdfFile);

    this.bookingService.uploadProduct(formData).subscribe({
      next: (res) => {
        this.message = 'Product uploaded successfully!';
        this.loading = false;
        // Reset form
        this.product = { title: '', description: '', price: null, password: '' };
        this.imageFile = null;
        this.pdfFile = null;
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.detail || 'Upload failed. Check password or try again.';
        this.loading = false;
      }
    });
  }
}
