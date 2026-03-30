const Order = require('../models/Order');

// Simuler un paiement Mobile Money
exports.simulateMobileMoneyPayment = async (req, res) => {
  try {
    const { orderId, operator, phoneNumber, amount } = req.body;
    
    console.log('💳 Simulation paiement Mobile Money:');
    console.log('   orderId:', orderId);
    console.log('   operator:', operator);
    console.log('   phoneNumber:', phoneNumber);
    console.log('   amount:', amount);

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'orderId est requis' 
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      console.log('❌ Commande non trouvée:', orderId);
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      console.log('❌ Non autorisé - order.user:', order.user, 'req.user:', req.user._id);
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorisé' 
      });
    }

    // Simulation : TOUJOURS succès (100%) pour le dev/test
    // En production, vous pouvez remettre Math.random() > 0.1 pour 90% de succès
    const isSuccess = true;

    if (isSuccess) {
      order.paymentStatus = 'paid';
      order.orderStatus = 'processing';
      order.paymentMethod = operator || 'mobile_money';
      await order.save();

      console.log('✅ Paiement simulé avec succès pour commande:', orderId);

      res.json({
        success: true,
        message: 'Paiement effectué avec succès (simulation)',
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
    console.error('❌ Erreur paiement:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
