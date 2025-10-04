// lib/clean-data.ts
export function cleanData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanData).filter(item => item !== undefined)
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {}
    Object.keys(obj).forEach(key => {
      const cleanedValue = cleanData(obj[key])
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    })
    return cleaned
  }
  return obj
}