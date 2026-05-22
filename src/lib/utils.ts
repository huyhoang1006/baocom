/**
 * Vietnamese diacritics removal map
 */
const vietnameseMap: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd', 'Đ': 'D',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
}

/**
 * Remove Vietnamese diacritics from a string
 */
function removeVietnameseDiacritics(str: string): string {
  return str.replace(/[^a-zA-Z\s]/g, char => vietnameseMap[char] || '')
}

/**
 * Generate username from full name
 * VD: "Phạm Xuân Hùng" → "hungpx"
 *     "Nguyễn Văn A" → "anv"
 *     "Đặng Văn Minh" → "minhdv"
 */
export function generateUsername(name: string): string {
  const parts = removeVietnameseDiacritics(name).trim().split(/\s+/)
  
  if (parts.length === 0) return ''
  
  // Lấy tên (từ cuối cùng)
  const lastName = parts[parts.length - 1].toLowerCase()
  
  // Lấy chữ cái đầu của các từ còn lại (họ + đệm)
  const initials = parts.slice(0, -1).map(p => p[0] || '').join('').toLowerCase()
  
  return lastName + initials
}

/**
 * Generate random password
 * VD: "ab3xk9m2"
 */
export function generatePassword(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Tạo username với suffix nếu trùng
 * VD: "hungpx" → "hungpx2" → "hungpx3"
 */
export function generateUniqueUsername(baseUsername: string, existingUsernames: string[]): string {
  if (!existingUsernames.includes(baseUsername)) {
    return baseUsername
  }
  
  let counter = 2
  while (existingUsernames.includes(`${baseUsername}${counter}`)) {
    counter++
  }
  return `${baseUsername}${counter}`
}