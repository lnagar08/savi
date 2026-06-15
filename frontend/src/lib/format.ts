export const formatWithSuffix = (amount: number, suffix: string): string => {
  const rounded = amount.toFixed(1).replace(/\.0$/, '')
  return `£${rounded}${suffix}`
}

export const formatDealValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  if (typeof value === 'string' && value.includes('£')) {
    return value
  }

  const numericValue = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d.-]/g, ''))

  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  const absolute = Math.abs(numericValue)
  if (absolute >= 1_000_000_000) {
    return formatWithSuffix(numericValue / 1_000_000_000, 'B')
  }
  if (absolute >= 1_000_000) {
    return formatWithSuffix(numericValue / 1_000_000, 'M')
  }
  if (absolute >= 1_000) {
    return formatWithSuffix(numericValue / 1_000, 'K')
  }

  return `£${numericValue.toFixed(0)}`
}

export const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInHours < 1) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
}
