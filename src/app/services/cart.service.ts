import { Injectable, signal } from '@angular/core';
import { CartItem, Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  constructor() { }

  addToCart(dish: Dish, quantity: number = 1) {
    this.cartItems.update(items => {
      const existingItem = items.find(i => i.dish.id === dish.id);
      if (existingItem) {
        return items.map(i => 
          i.dish.id === dish.id 
            ? { ...i, quantity: i.quantity + quantity } 
            : i
        );
      }
      return [...items, { dish, quantity }];
    });
  }

  removeFromCart(dishId: string) {
    this.cartItems.update(items => items.filter(i => i.dish.id !== dishId));
  }

  updateQuantity(dishId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(dishId);
      return;
    }
    this.cartItems.update(items => items.map(i => 
      i.dish.id === dishId ? { ...i, quantity } : i
    ));
  }

  getTotalItems(): number {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartItems().reduce((total, item) => {
      // Very simple parsing of "45,000 VND" -> 45000
      const priceVal = parseInt(item.dish.price.replace(/,/g, '').replace(' VND', ''), 10);
      return total + (priceVal * item.quantity);
    }, 0);
  }

  clearCart() {
    this.cartItems.set([]);
  }
}
