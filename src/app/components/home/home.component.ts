import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  lang = inject(LanguageService);
  targetOrders = 845;
  targetDonation = 24500000;
  
  displayedOrders = 0;
  displayedDonation = 0;

  ngOnInit() {
    this.animateCounter('displayedOrders', this.targetOrders, 1500);
    this.animateCounter('displayedDonation', this.targetDonation, 2000);
  }

  animateCounter(prop: 'displayedOrders' | 'displayedDonation', target: number, duration: number) {
    const steps = 40;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this[prop] = Math.floor(easeOut * target);
      
      if (currentStep >= steps) {
        this[prop] = target;
        clearInterval(timer);
      }
    }, stepTime);
  }
}
