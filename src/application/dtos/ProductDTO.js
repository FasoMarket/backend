/**
 * Data Transfer Objects pour Product
 */

class CreateProductDTO {
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.price = data.price;
    this.stock = data.stock;
    this.images = data.images || [];
    this.vendor = data.vendor;
    this.store = data.store;
  }
}

class UpdateProductDTO {
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.price = data.price;
    this.stock = data.stock;
  }
}

class ProductResponseDTO {
  constructor(product) {
    this.id = product._id;
    this.name = product.name;
    this.description = product.description;
    this.category = product.category;
    this.price = product.price;
    this.stock = product.stock;
    this.images = product.images;
    this.vendor = product.vendor;
    this.store = product.store;
    this.rating = product.rating;
    this.reviews = product.reviews;
    this.createdAt = product.createdAt;
  }
}

class ProductListDTO {
  constructor(product) {
    this.id = product._id;
    this.name = product.name;
    this.price = product.price;
    this.image = product.images?.[0];
    this.rating = product.rating;
    this.vendor = product.vendor;
  }
}

module.exports = {
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponseDTO,
  ProductListDTO
};
