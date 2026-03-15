const Order = require('../models/Order');

// Simuler un paiement Mobile Money
exports.simulateMobileMoneyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Simulation : 90% de succès
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      order.paymentStatus = 'paid';
      order.orderStatus = 'processing';
      await order.save();

      res.json({
        success: true,
        message: 'Paiement effectué avec succès',
        order
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Échec du paiement. Veuillez réessayer.',
        order
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
