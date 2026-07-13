/**
 * Parse inventory text file in "Item Name - Quantity" or "Item Name - Quantity - Price" format.
 * Example: "Milo 400g - 50" → { name: "Milo 400g", quantity: 50, price: 500 }
 * Example: "Indomie Crate - 12 - 4500" → { name: "Indomie Crate", quantity: 12, price: 4500 }
 */

const createPlaceholderImage = (itemName) => {
  const label = encodeURIComponent(itemName || 'OpenMart')
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='24' fill='%23f0fdf4'/%3E%3Ccircle cx='200' cy='170' r='90' fill='%2310b981'/%3E%3Crect x='110' y='275' width='180' height='44' rx='22' fill='%23059669'/%3E%3Ctext x='200' y='210' text-anchor='middle' fill='white' font-family='Arial' font-size='24'%3EOpenMart%3C/text%3E%3Ctext x='200' y='305' text-anchor='middle' fill='white' font-family='Arial' font-size='16'%3E${label}%3C/text%3E%3C/svg%3E`
}

export const parseInventoryText = (fileContent) => {
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('Invalid file content')
  }

  const items = []
  const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean)

  lines.forEach((line, index) => {
    try {
      const parts = line.split('-').map((part) => part.trim()).filter(Boolean)

      if (parts.length < 2) {
        console.warn(`Line ${index + 1} skipped (invalid format): ${line}`)
        return
      }

      const itemName = parts.length > 2 ? parts.slice(0, -2).join('-').trim() : parts[0]
      const quantityStr = parts[parts.length - 2]
      const priceStr = parts[parts.length - 1]
      const quantity = parseInt(quantityStr, 10)
      const price = parseInt(priceStr, 10)

      // Validate
      if (!itemName) {
        console.warn(`Line ${index + 1}: Empty item name`)
        return
      }

      if (isNaN(quantity) || quantity < 0) {
        console.warn(`Line ${index + 1}: Invalid quantity "${quantityStr}"`)
        return
      }

      items.push({
        id: `inv_${Date.now()}_${index}`,
        name: itemName,
        quantity,
        price: Number.isNaN(price) ? 500 : price,
        image: createPlaceholderImage(itemName),
        dateAdded: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error parsing line ${index + 1}:`, error)
    }
  })

  if (items.length === 0) {
    throw new Error('No valid items found in the text file')
  }

  return items
}

/**
 * Validate the file is a .txt file
 */
export const validateFile = (file) => {
  if (!file) return { valid: false, message: 'No file selected' }
  
  if (!file.name.endsWith('.txt')) {
    return { valid: false, message: 'Please upload a .txt file' }
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return { valid: false, message: 'File size exceeds 5MB limit' }
  }

  return { valid: true, message: 'File is valid' }
}

/**
 * Read file as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
