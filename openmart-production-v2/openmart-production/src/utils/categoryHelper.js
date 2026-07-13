/**
 * Intelligent category mapping based on item name keywords
 */

const CATEGORY_MAPPING = {
  'Groceries': ['rice', 'flour', 'salt', 'sugar', 'oil', 'spice', 'beans', 'lentil', 'pasta', 'spaghetti', 'maggi', 'seasoning', 'garlic', 'onion', 'ginger'],
  'Snacks': ['biscuit', 'cracker', 'chip', 'cake', 'cookie', 'candy', 'chocolate', 'milo', 'noodle', 'energy bar', 'wafer'],
  'Drinks': ['water', 'juice', 'soda', 'cola', 'fanta', 'malt', 'milk', 'tea', 'coffee', 'wine', 'beer', 'soft drink'],
  'Household': ['soap', 'detergent', 'bleach', 'foam', 'towel', 'napkin', 'tissue', 'brush', 'mop', 'broom', 'candle', 'charcoal', 'light', 'bucket'],
  'Fresh Produce': ['tomato', 'vegetable', 'fruit', 'apple', 'orange', 'banana', 'lettuce', 'carrot', 'pepper', 'spinach', 'leaf', 'fresh'],
  'Health & Wellness': ['vitamin', 'supplement', 'medicine', 'health', 'pain relief', 'lotion', 'cream', 'toothpaste', 'shampoo', 'body wash']
}

export const getCategory = (itemName) => {
  if (!itemName) return 'Groceries'

  const lowerName = itemName.toLowerCase()

  // Find first matching category
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category
    }
  }

  // Default category
  return 'Groceries'
}

export const getAllCategories = () => Object.keys(CATEGORY_MAPPING)

/**
 * Get emoji for category
 */
export const getCategoryEmoji = (category) => {
  const emojiMap = {
    'Groceries': '🍞',
    'Snacks': '🍿',
    'Drinks': '💧',
    'Household': '🧹',
    'Fresh Produce': '🥬',
    'Health & Wellness': '💊'
  }
  return emojiMap[category] || '📦'
}

/**
 * Get color classes for category
 */
export const getCategoryColor = (category) => {
  const colorMap = {
    'Groceries': 'from-yellow-400 to-amber-500',
    'Snacks': 'from-orange-400 to-red-500',
    'Drinks': 'from-blue-400 to-cyan-500',
    'Household': 'from-purple-400 to-indigo-500',
    'Fresh Produce': 'from-green-400 to-emerald-500',
    'Health & Wellness': 'from-pink-400 to-rose-500'
  }
  return colorMap[category] || 'from-gray-400 to-gray-500'
}

/**
 * Generate realistic Naira prices based on product name
 */
export const generateNairaPrice = (itemName) => {
  const basePrices = {
    'rice': 500,
    'flour': 400,
    'salt': 150,
    'sugar': 600,
    'oil': 1500,
    'milk': 400,
    'bread': 300,
    'eggs': 50,
    'water': 200,
    'milo': 800,
    'noodle': 200,
    'maggi': 250,
    'beans': 400,
    'pepper': 100,
    'onion': 80,
    'garlic': 200,
    'tomato': 100,
    'juice': 500,
    'soda': 400,
    'cola': 350,
    'tea': 600,
    'coffee': 1200,
    'soap': 300,
    'detergent': 1200,
    'tissue': 250,
    'toothpaste': 600,
    'shampoo': 1500,
    'biscuit': 300,
    'cake': 400,
    'chocolate': 500,
    'candy': 150,
    'charcoal': 500,
    'candle': 200,
    'towel': 2000,
    'fruit': 300,
    'apple': 200,
    'orange': 150,
    'banana': 100,
  }

  const lowerName = itemName.toLowerCase()
  for (const [keyword, price] of Object.entries(basePrices)) {
    if (lowerName.includes(keyword)) {
      return price + Math.floor(Math.random() * 200)
    }
  }

  return 500 + Math.floor(Math.random() * 1000)
}

