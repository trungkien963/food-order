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
        if (!isValid) {
          this.isSubmitting = false;
          this.emailError = this.lang.currentLang() === 'vi' ? 'Email không hợp lệ hoặc không có trong danh sách đăng ký.' : 'Invalid email or not registered.';
        } else {
          // Prepare data for Order_List sheet
          const orderList = this.items.map(i => {
            const numPrice = parseInt(i.dish.price.replace(/,/g, '').replace(' VND', ''), 10);
            return {
              email: this.email,
              dishName: i.dish.dishName,
              teamName: i.dish.teamName,
              quantity: i.quantity,
              price: i.dish.price,
              totalPrice: this.formatPrice(numPrice * i.quantity)
            };
          });

          const rowData = {
            action: 'employee_order', // Tell AppsScript to put in Order_List
            orders: orderList,
            grandTotal: this.formatPrice(this.total),
            timestamp: new Date().toISOString()
          };

          this.dataService.submitEmployeeOrderToSheet(JSON.stringify(rowData)).subscribe({
            next: (res) => {
              this.isSubmitting = false;
              const resText = (res || '').toString();
              if (resText.includes('Error')) {
                console.error('Lỗi từ Google Apps Script:', resText);
                this.emailError = this.lang.currentLang() === 'vi' ? 
                  'Lỗi từ hệ thống: ' + resText : 
                  'System error: ' + resText;
              } else {
                this.orderSuccess = true;
                this.cartService.clearCart();
              }
            },
            error: (err) => {
              console.error('Lỗi kết nối khi lưu Google Sheet:', err);
              this.isSubmitting = false;
              // Even if it fails due to CORS or Network, we might still show error or success
              this.emailError = this.lang.currentLang() === 'vi' ? 
                'Lỗi kết nối. Không thể lưu lên Google Sheet.' : 
                'Connection error. Could not save to Google Sheet.';
            }
          });
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.emailError = this.lang.currentLang() === 'vi' ? 'Có lỗi xảy ra khi xác thực email.' : 'An error occurred during email validation.';
      }
    });
  }
}
