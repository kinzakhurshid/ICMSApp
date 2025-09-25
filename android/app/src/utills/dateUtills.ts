// utils/dateUtils.ts
export const getDateGroupKey = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else if (today.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

export const getOrderedDateGroups = (groupedMessages: { [key: string]: any[] }): string[] => {
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
  
  return Object.keys(groupedMessages).sort((a, b) => {
    const aPriority = datePriority[a] !== undefined ? datePriority[a] : 9;
    const bPriority = datePriority[b] !== undefined ? datePriority[b] : 9;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    if (aPriority === 9 && bPriority === 9) {
      const aDate = new Date(a);
      const bDate = new Date(b);
      return bDate.getTime() - aDate.getTime();
    }
    
    return 0;
  });
};