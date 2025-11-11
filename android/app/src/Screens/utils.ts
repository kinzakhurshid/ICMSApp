// Utility functions for SprintDetailScreen

// Convert string to color - returns orange theme colors
export const stringToColor = (str: string): string => {
  // Return different shades of orange based on string hash
  const orangeShades = ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return orangeShades[Math.abs(hash) % orangeShades.length];
};

// Format date
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
