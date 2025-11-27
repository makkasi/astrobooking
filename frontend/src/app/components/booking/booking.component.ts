import { Component } from '@angular/core';
import { BookingService, Booking } from '../../services/booking.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent {
  selectedDate: string = '';
  availableHours: number[] = [];
  selectedHour: number | null = null;
  bookingForm: Partial<Booking> = {
    name: '',
    email: '',
    phone: '',
    notes: ''
  };

  loading = false;
  successMessage = '';
  errorMessage = '';
  dayBooked = false;

  constructor(private bookingService: BookingService) { }

  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    this.selectedHour = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.dayBooked = false;

    if (this.selectedDate) {
      this.checkAvailability();
    }
  }

  checkAvailability() {
    this.loading = true;
    this.bookingService.checkAvailability(this.selectedDate).subscribe({
      next: (response) => {
        this.availableHours = response.available_hours;
        this.loading = false;
        if (this.availableHours.length === 0) {
          this.dayBooked = true;
        }
      },
      error: (err) => {
        console.error('Error checking availability', err);
        this.loading = false;
        this.errorMessage = 'Грешка при проверка на наличността.';
      }
    });
  }

  selectHour(hour: number) {
    this.selectedHour = hour;
  }

  submitBooking() {
    if (!this.selectedDate || this.selectedHour === null) return;

    const booking: Booking = {
      date: this.selectedDate,
      hour: this.selectedHour,
      name: this.bookingForm.name || '',
      email: this.bookingForm.email || '',
      phone: this.bookingForm.phone || '',
      notes: this.bookingForm.notes
    };

    this.loading = true;
    this.bookingService.createBooking(booking).subscribe({
      next: () => {
        this.successMessage = 'Вашият час е запазен успешно! Ще получите потвърждение на имейл.';
        this.loading = false;
        this.selectedHour = null;
        this.checkAvailability(); // Refresh availability
        this.bookingForm = { name: '', email: '', phone: '', notes: '' }; // Reset form
      },
      error: (err) => {
        console.error('Error creating booking', err);
        this.errorMessage = err.error.detail || 'Възникна грешка при запазването на часа.';
        this.loading = false;
      }
    });
  }
}
