import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  scrollToBooking() {
    const element = document.getElementById('booking-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
