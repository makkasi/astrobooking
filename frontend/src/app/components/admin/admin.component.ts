import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  // Form Data
  product: any = {
    title: '',
    description: '',
    price: null,
    category: 'General',
    password: ''
  };
  imageFile: File | null = null;
  pdfFile: File | null = null;

  // State
  loading = false;
  message = '';
  error = '';
  products: any[] = [];
  isEditing = false;
  editingId: string | null = null;

  constructor(private bookingService: BookingService) { }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.bookingService.getProducts().subscribe(products => {
      this.products = products;
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

  startEdit(product: any) {
    this.isEditing = true;
    this.editingId = product.id;
    this.product = {
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category || 'General',
      password: '' // User must re-enter password to save
    };
    // Clear files as we don't support editing files yet
    this.imageFile = null;
    this.pdfFile = null;

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingId = null;
    this.product = { title: '', description: '', price: null, category: 'General', password: '' };
    this.imageFile = null;
    this.pdfFile = null;
  }

  deleteProduct(id: string) {
    const password = prompt('Enter Admin Password to DELETE:');
    if (!password) return;

    if (confirm('Are you sure you want to delete this product?')) {
      this.bookingService.deleteProduct(id, password).subscribe({
        next: () => {
          this.loadProducts();
          alert('Product deleted.');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete. Check password.');
        }
      });
    }
  }

  onSubmit() {
    if (!this.product.price || !this.product.password) {
      this.error = 'Price and Password are required.';
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    if (this.isEditing && this.editingId) {
      // UPDATE EXISTING PRODUCT
      const updateData = {
        title: this.product.title,
        description: this.product.description,
        price: this.product.price,
        category: this.product.category,
        password: this.product.password
      };

      this.bookingService.updateProduct(this.editingId, updateData).subscribe({
        next: () => {
          this.message = 'Product updated successfully!';
          this.loading = false;
          this.cancelEdit();
          this.loadProducts();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to update. Check password.';
          this.loading = false;
        }
      });

    } else {
      // CREATE NEW PRODUCT
      if (!this.imageFile || !this.pdfFile) {
        this.error = 'Please select both Image and PDF files.';
        this.loading = false;
        return;
      }

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
                category: this.product.category,
                password: this.product.password,
                image_url: imageUrl,
                pdf_public_id: pdfPublicId
              };

              this.bookingService.uploadProduct(productData).subscribe({
                next: () => {
                  this.message = 'Product uploaded successfully!';
                  this.loading = false;
                  this.product = { title: '', description: '', price: null, category: 'General', password: '' };
                  this.imageFile = null;
                  this.pdfFile = null;
                  this.loadProducts();
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
}

