/**
 * Data Transfer Objects pour User
 * Définit les structures de données pour les requêtes/réponses
 */

class CreateUserDTO {
  constructor(name, email, password, role = 'customer') {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }
}

class UpdateUserDTO {
  constructor(data) {
    this.name = data.name;
    this.phone = data.phone;
    this.avatar = data.avatar;
    this.address = data.address;
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.avatar = user.avatar;
    this.phone = user.phone;
    this.isVendorApproved = user.isVendorApproved;
    this.createdAt = user.createdAt;
  }
}

class VendorResponseDTO {
  constructor(user) {
    this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.shopName = user.shopName;
    this.avatar = user.avatar;
    this.phone = user.phone;
    this.address = user.address;
    this.isVendorApproved = user.isVendorApproved;
    this.createdAt = user.createdAt;
  }
}

module.exports = {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  VendorResponseDTO
};
