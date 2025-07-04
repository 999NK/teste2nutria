// Utility functions for nutritional day calculation (5AM to 5AM cycle)

export function getNutritionalDay(date: Date = new Date()): string {
  const nutritionalDate = new Date(date);
  
  // If it's before 5 AM, it belongs to the previous day
  if (date.getHours() < 5) {
    nutritionalDate.setDate(nutritionalDate.getDate() - 1);
  }
  
  return nutritionalDate.toISOString().split('T')[0];
}

export function getNutritionalDayRange(dateString: string): { start: Date, end: Date } {
  const baseDate = new Date(dateString + 'T00:00:00Z');
  
  // Start at 5 AM of the given date
  const start = new Date(baseDate);
  start.setUTCHours(5, 0, 0, 0);
  
  // End at 5 AM of the next date  
  const end = new Date(baseDate);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(5, 0, 0, 0);
  
  return { start, end };
}

export function isNewNutritionalDay(lastDate: string): boolean {
  const currentNutritionalDay = getNutritionalDay();
  return currentNutritionalDay !== lastDate;
}