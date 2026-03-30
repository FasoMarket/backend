// Transformateurs de données standardisés pour assurer la cohérence entre web et mobile

const getBaseUrl = () => {
  return process.env.BASE_URL || 'http://localhost:5000';
};

const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${getBaseUrl()}${imagePath}`;
};

// Transformer un produit pour la réponse API
exports.transformProduct = (product) => {
  if (!product) return null;

  const vendorId = product.vendor?._id?.toString() || product.vendor?.toString() || null;
  const storeId = product.store?._id?.toString() || product.store?.toString() || null;
  
  // Retourner les chemins relatifs des images (sans BASE_URL)
  // Le client (web/mobile) se chargera de construire l'URL complète
  const images = product.images || [];
  const imageUrl = images.length > 0 ? images[0] : null;

  return {
    _id: product._id?.toString(),
    id: product._id?.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    images,
    imageUrl,
    stock: product.stock,
    storeId,
    storeName: product.store?.name,
    storeSlug: product.store?.slug,
    store: {
      id: storeId,
      name: product.store?.name,
      slug: product.store?.slug,
      logo: product.store?.logo || null
    },
    vendorId,
    vendorName: product.vendor?.name,
    rating: product.rating || { average: 0, count: 0 },
    brand: product.brand,
    tags: product.tags,
    promotion: product.promotion,
    viewCount: product.viewCount || 0,
    soldCount: product.soldCount || 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
};

// Transformer une commande pour la réponse API
exports.transformOrder = (order) => {
  if (!order) return null;

  return {
    id: order._id?.toString(),
    user: order.user?._id?.toString() || order.user?.toString(),
    items: order.items?.map(item => ({
      product: {
        id: item.product?._id?.toString() || item.product?.toString(),
        name: item.product?.name,
        images: item.product?.images || [],
        imageUrl: item.product?.images?.[0] || null,
      },
      storeId: item.store?._id?.toString() || item.store?.toString(),
      vendorId: item.vendor?._id?.toString() || item.vendor?.toString(),
      quantity: item.quantity,
      price: item.price,
      commissionAmount: item.commissionAmount,
      netAmount: item.netAmount
    })) || [],
    totalPrice: order.totalPrice,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    status: order.orderStatus, // Keep status as alias
    commissionRate: order.commissionRate,
    commissionAmount: order.commissionAmount,
    netAmount: order.netAmount,
    promoCode: order.promoCode,
    discountAmount: order.discountAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

// Transformer un panier pour la réponse API
exports.transformCart = (cart) => {
  if (!cart) return null;

  return {
    id: cart._id?.toString(),
    userId: cart.user?.toString(),
    items: cart.items?.map(item => ({
      productId: item.product?._id?.toString() || item.product?.toString(),
      productName: item.product?.name,
      productImage: item.product?.images?.[0] || null,
      price: item.price,
      quantity: item.quantity,
      subtotal: (item.price || 0) * item.quantity
    })) || [],
    subtotal: cart.items?.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0) || 0,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  };
};

// Transformer une conversation pour la réponse API
exports.transformConversation = (conversation, currentUserId) => {
  if (!conversation) return null;

  const otherParticipant = conversation.participants?.find(p => 
    p._id?.toString() !== currentUserId?.toString()
  );

  return {
    id: conversation._id?.toString(),
    participants: conversation.participants?.map(p => ({
      id: p._id?.toString(),
      name: p.name,
      email: p.email,
      avatar: p.avatar || null,
      role: p.role
    })) || [],
    otherParticipant: otherParticipant ? {
      id: otherParticipant._id?.toString(),
      name: otherParticipant.name,
      email: otherParticipant.email,
      avatar: otherParticipant.avatar || null,
      role: otherParticipant.role
    } : null,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount?.get(currentUserId?.toString()) || 0,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
};

// Transformer un message pour la réponse API
exports.transformMessage = (message) => {
  if (!message) return null;

  let content = message.content;
  let parsedContent = null;

  // Si c'est un message de produit, parser le JSON
  if (message.type === 'product_link') {
    try {
      parsedContent = JSON.parse(message.content);
      // Garder les chemins relatifs des images
      // Le client se chargera de construire l'URL complète
    } catch (e) {
      // Si le parsing échoue, garder le contenu brut
    }
  }

  return {
    id: message._id?.toString(),
    conversationId: message.conversation?.toString(),
    senderId: message.sender?._id?.toString() || message.sender?.toString(),
    senderName: message.sender?.name,
    senderAvatar: message.sender?.avatar ? formatImageUrl(message.sender.avatar) : null,
    type: message.type,
    content: message.type === 'product_link' ? parsedContent : content,
    isRead: message.isRead,
    readAt: message.readAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
};

// Transformer un utilisateur pour la réponse API
exports.transformUser = (user) => {
  if (!user) return null;

  return {
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    phone: user.phone,
    isVendorApproved: user.isVendorApproved,
    shopName: user.shopName,
    address: user.address,
    businessCategory: user.businessCategory,
    description: user.description,
    stats: user.stats,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

// Transformer une boutique pour la réponse API
exports.transformStore = (store) => {
  if (!store) return null;

  return {
    id: store._id?.toString(),
    name: store.name,
    slug: store.slug,
    description: store.description,
    ownerId: store.owner?._id?.toString() || store.owner?.toString(),
    ownerName: store.owner?.name,
    logo: store.logo || null,
    banner: store.banner || null,
    phone: store.phone,
    address: store.address,
    socialLinks: store.socialLinks,
    rating: store.rating,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt
  };
};

// Transformer une notification pour la réponse API
exports.transformNotification = (notification) => {
  if (!notification) return null;

  return {
    id: notification._id?.toString(),
    recipientId: notification.recipient?.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    data: notification.data,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
};
