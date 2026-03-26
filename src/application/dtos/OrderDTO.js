/**
 * Data Transfer Objects pour Order
 */

class CreateOrderDTO {
  constructor(data) {
    this.items = data.items; // [{productId, quantity, price, storeId, vendorId}]
    this.totalPrice = data.totalPrice;
    this.shippingAddress = data.shippingAddress;
    this.paymentMethod = data.paymentMethod;
    this.user = data.user;
  }
}

class UpdateOrderStatusDTO {
  constructor(status, reason = null) {
    this.status = status;
    this.reason = reason;
  }
}

class OrderResponseDTO {
  constructor(order) {
    this.id = order._id;
    this.orderNumber = order.orderNumber;
    this.user = order.user;
    this.items = order.items;
    this.totalPrice = order.totalPrice;
    this.status = order.status;
    this.shippingAddress = order.shippingAddress;
    this.paymentMethod = order.paymentMethod;
    this.paymentStatus = order.paymentStatus;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}

class OrderListDTO {
  constructor(order) {
    this.id = order._id;
    this.orderNumber = order.orderNumber;
    this.totalPrice = order.totalPrice;
    this.status = order.status;
    this.itemCount = order.items?.length || 0;
    this.createdAt = order.createdAt;
  }
}

module.exports = {
  CreateOrderDTO,
  UpdateOrderStatusDTO,
  OrderResponseDTO,
  OrderListDTO
};
