// Intelligent category mapping and formatting helpers for Open Mart Admin Web

export const CATEGORY_MAPPING: Record<string, string[]> = {
  'Groceries': ['rice', 'flour', 'salt', 'sugar', 'oil', 'spice', 'beans', 'lentil', 'pasta', 'spaghetti', 'maggi', 'seasoning', 'garlic', 'onion', 'ginger'],
  'Snacks': ['biscuit', 'cracker', 'chip', 'cake', 'cookie', 'candy', 'chocolate', 'milo', 'noodle', 'energy bar', 'wafer'],
  'Drinks': ['water', 'juice', 'soda', 'cola', 'fanta', 'malt', 'milk', 'tea', 'coffee', 'wine', 'beer', 'soft drink'],
  'Household': ['soap', 'detergent', 'bleach', 'foam', 'towel', 'napkin', 'tissue', 'brush', 'mop', 'broom', 'candle', 'charcoal', 'light', 'bucket'],
  'Fresh Produce': ['tomato', 'vegetable', 'fruit', 'apple', 'orange', 'banana', 'lettuce', 'carrot', 'pepper', 'spinach', 'leaf', 'fresh'],
  'Health & Wellness': ['vitamin', 'supplement', 'medicine', 'health', 'pain relief', 'lotion', 'cream', 'toothpaste', 'shampoo', 'body wash']
};

export const getAllCategories = (): string[] => Object.keys(CATEGORY_MAPPING);

export const getCategory = (itemName: string): string => {
  if (!itemName) return 'Groceries';
  const lowerName = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  return 'Groceries';
};

export const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'Groceries': '🍞',
    'Snacks': '🍿',
    'Drinks': '💧',
    'Household': '🧹',
    'Fresh Produce': '🥬',
    'Health & Wellness': '💊'
  };
  return emojiMap[category] || '📦';
};

export const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'Groceries': 'from-yellow-400 to-amber-500',
    'Snacks': 'from-orange-400 to-red-500',
    'Drinks': 'from-blue-400 to-cyan-500',
    'Household': 'from-purple-400 to-indigo-500',
    'Fresh Produce': 'from-green-400 to-emerald-500',
    'Health & Wellness': 'from-pink-400 to-rose-500'
  };
  return colorMap[category] || 'from-gray-400 to-gray-500';
};

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  milo: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?auto=format&fit=crop&w=400&q=70',
  rice: 'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&w=400&q=70',
  flour: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=70',
  tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=400&q=70',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=70',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=70',
  eggs: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=70',
  sugar: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400&q=70',
  salt: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=70',
  oil: 'https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?auto=format&fit=crop&w=400&q=70',
  beans: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=70',
  pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=70',
  onion: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=70',
  garlic: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=70',
  ginger: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?auto=format&fit=crop&w=400&q=70',
  juice: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=400&q=70',
  soda: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=70',
  soap: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=400&q=70',
  detergent: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=70',
  biscuit: 'https://images.unsplash.com/photo-1606914469633-6e8b2d3d1f5a?auto=format&fit=crop&w=400&q=70',
  chocolate: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=70',
  fruit: 'https://images.unsplash.com/photo-1464965911861-746a04bca7c0?auto=format&fit=crop&w=400&q=70',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=70',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=70',
  orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&q=70',
  default: 'https://images.unsplash.com/photo-1584263347416-85a5f2d9e0d3?auto=format&fit=crop&w=400&q=70'
};

export const getFallbackImageUrl = (emoji = '📦'): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23059669;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230284c7;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-size='180' text-anchor='middle' dominant-baseline='central' font-family='system-ui'%3E${emoji}%3C/text%3E%3C/svg%3E`;
};

export const getProductImageUrl = (itemName: string): string => {
  if (!itemName) return getFallbackImageUrl('📦');
  const lowerName = itemName.toLowerCase();
  for (const [keyword, imageUrl] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (keyword !== 'default' && lowerName.includes(keyword)) {
      return imageUrl;
    }
  }
  return PRODUCT_IMAGE_MAP.default;
};

// Formatting Naira Currency
export const formatNaira = (value: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('NGN', '₦');
};
