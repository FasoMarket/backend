const Order = require('../models/Order');
const Product = require('../models/Product');

class OrderService {
  // Vérifier la disponibilité du stock
  static async checkStockAvailability(cartItems) {
    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      
      if (!product) {
        throw new Error(`Produit ${item.product.name} non trouvé`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.stock}`);
      }
    }
    return true;
  }

  // Calculer le total de la commande
  static calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Mettre à jour le stock après commande
  static async updateStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }
  }

  // Restaurer le stock en cas d'annulation
  static async restoreStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
  }

  // Obtenir les statistiques de commande pour un vendeur
  static async getVendorOrderStats(vendorId) {
    const stats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'stores',
          localField: 'items.store',
          foreignField: '_id',
          as: 'storeInfo'
        }
      },
      { $unwind: '$storeInfo' },
      { $match: { 'storeInfo.owner': vendorId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    return stats;
  }
}

module.exports = OrderService;
