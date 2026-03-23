import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishCardComponent } from '../dish-card/dish-card.component';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { Dish } from '../../models/dish.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, DishCardComponent],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  dataService = inject(DataService);
  cartService = inject(CartService);
  
  dishes$!: Observable<Dish[]>;

  ngOnInit() {
    this.dishes$ = this.dataService.getDishes();
  }

  onOrder(dish: Dish) {
    this.cartService.addToCart(dish);
    // In a real app, add a beautiful toast notification here
  }
}
