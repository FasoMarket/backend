/**
 * Conteneur d'injection de dépendances
 * Centralise la création et l'injection des dépendances
 */

// Repositories
const UserRepository = require('../persistence/repositories/UserRepository');
const ProductRepository = require('../persistence/repositories/ProductRepository');
const OrderRepository = require('../persistence/repositories/OrderRepository');

// Services
const UserService = require('../../application/services/UserService');
const ProductService = require('../../application/services/ProductService');
const OrderService = require('../../application/services/OrderService');

// Controllers
const UserController = require('../../presentation/controllers/UserController');
const ProductController = require('../../presentation/controllers/ProductController');
const OrderController = require('../../presentation/controllers/OrderController');

class Container {
  constructor() {
    this.services = {};
  }

  /**
   * Enregistre un service
   */
  register(name, factory) {
    this.services[name] = factory;
  }

  /**
   * Récupère un service (lazy loading)
   */
  get(name) {
    if (!this.services[name]) {
      throw new Error(`Service ${name} not found in container`);
    }
    return this.services[name]();
  }
}

/**
 * Initialise le conteneur avec toutes les dépendances
 */
function setupContainer() {
  const container = new Container();

  // Repositories
  container.register('userRepository', () => new UserRepository());
  container.register('productRepository', () => new ProductRepository());
  container.register('orderRepository', () => new OrderRepository());

  // Services
  container.register('userService', () => 
    new UserService(container.get('userRepository'))
  );
  
  container.register('productService', () => 
    new ProductService(
      container.get('productRepository')
    )
  );
  
  container.register('orderService', () => 
    new OrderService(
      container.get('orderRepository'),
      container.get('productRepository')
    )
  );

  // Controllers
  container.register('userController', () => 
    new UserController(container.get('userService'))
  );
  
  container.register('productController', () => 
    new ProductController(container.get('productService'))
  );
  
  container.register('orderController', () => 
    new OrderController(container.get('orderService'))
  );

  return container;
}

module.exports = { Container, setupContainer };
