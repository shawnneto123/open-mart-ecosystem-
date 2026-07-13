/**
 * Abuja Districts and Delivery Rates
 * Designed for local delivery tracking in Abuja, Nigeria.
 */
export const ABUJA_DISTRICTS = {
  'Wuse I & II': 800,
  'Garki I & II': 800,
  'Maitama': 1000,
  'Asokoro': 1000,
  'Gwarinpa': 1500,
  'Apo / Lokogoma': 1500,
  'Jabi / Utako': 1000,
  'Life Camp': 1200,
  'Lugbe / Airport Road': 2000,
  'Kubwa': 2200,
  'Karu / Nyanya': 2000,
};

/**
 * Get delivery rate for a specific district
 * @param {string} district 
 * @returns {number} delivery cost in Naira
 */
export const getDeliveryRate = (district) => {
  return ABUJA_DISTRICTS[district] || 500; // Fallback to 500
};

export default {
  ABUJA_DISTRICTS,
  getDeliveryRate,
};
