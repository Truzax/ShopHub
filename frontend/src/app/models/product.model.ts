export interface Product {
  _id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  description?: {
    short?: string;
    long?: string;
  };
  features?: string[];
  seoKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}
