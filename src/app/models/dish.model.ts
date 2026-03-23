export interface Dish {
  id: string;
  teamName: string;
  dishName: string;
  price: string;
  dateAvailable: string;
  description: string;
  type: string;
  imageUrl: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}
