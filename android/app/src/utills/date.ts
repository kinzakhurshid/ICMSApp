export const getOrderedDateGroups = (groupedMessages: { [key: string]: any[] }): string[] => {
  const dateGroups = Object.keys(groupedMessages);
  
  const datePriority: Record<string, number> = {
    'Today': 0,
    'Yesterday': 1,
    'Monday': 2,
    'Tuesday': 3,
    'Wednesday': 4,
    'Thursday': 5,
    'Friday': 6,
    'Saturday': 7,
    'Sunday': 8,
  };
  
  return dateGroups.sort((a, b) => {
    const aPriority = datePriority[a] !== undefined ? datePriority[a] : 9;
    const bPriority = datePriority[b] !== undefined ? datePriority[b] : 9;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // For custom dates, sort chronologically (newest first)
    if (aPriority === 9 && bPriority === 9) {
      const aDate = new Date(a);
      const bDate = new Date(b);
      return bDate.getTime() - aDate.getTime();
    }
    
    return 0;
  });
};