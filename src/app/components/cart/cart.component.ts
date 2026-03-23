import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { DataService } from '../../services/data.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  providers: [DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  cartService = inject(CartService);
  dataService = inject(DataService);
  decimalPipe = inject(DecimalPipe);
  lang = inject(LanguageService);
  
  email: string = '';
  emailError: string = '';
  orderSuccess: boolean = false;
  isSubmitting: boolean = false;
  
  get count() { return this.cartService.getTotalItems(); }
  get items() { return this.cartService.cartItems(); }
  get total() { return this.cartService.getTotalPrice(); }
  
  formatPrice(price: number): string {
    return this.decimalPipe.transform(price, '1.0-0') + ' VND';
  }
  
  updateQty(dishId: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const qty = parseInt(val, 10);
    if (!isNaN(qty)) {
      this.cartService.updateQuantity(dishId, qty);
    }
  }
  
  remove(dishId: string) {
    this.cartService.removeFromCart(dishId);
  }
  
  checkout() {
    this.emailError = '';
    
    if (!this.email || this.email.trim() === '') {
      this.emailError = this.lang.currentLang() === 'vi' ? 'Vui lòng nhập email xác nhận.' : 'Please enter an email.';
      return;
    }
    
    this.isSubmitting = true;
    
    this.dataService.validateEmail(this.email).subscribe({
      next: (isValid) => {
        this.isSubmitting = false;
        if (!isValid) {
          this.emailError = this.lang.currentLang() === 'vi' ? 'Email không hợp lệ hoặc không có trong danh sách đăng ký.' : 'Invalid email or not registered.';
        } else {
          this.orderSuccess = true;
          this.cartService.clearCart();
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.emailError = this.lang.currentLang() === 'vi' ? 'Có lỗi xảy ra khi xác thực email.' : 'An error occurred during email validation.';
      }
    });
  }
}
