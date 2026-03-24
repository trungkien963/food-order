import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from './services/cart.service';
import { LanguageService } from './services/language.service';
import { CreateOrderModalComponent } from './components/create-order-modal/create-order-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, CreateOrderModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'food-order';
  cartService = inject(CartService);
  lang = inject(LanguageService);

  isCreateOrderModalOpen = false;

  get cartItemCount() {
    return this.cartService.getTotalItems();
  }

  openCreateOrderModal() {
    this.isCreateOrderModalOpen = true;
  }

  closeCreateOrderModal() {
    this.isCreateOrderModalOpen = false;
  }
}
