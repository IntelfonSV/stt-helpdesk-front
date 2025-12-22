
import { TicketPriority } from './types';

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateSLA = (entryDateStr: string, priority: TicketPriority): string => {
  const entryDate = new Date(entryDateStr);
  let dueDate = new Date(entryDate);

  // Helper to add business hours/days
  // Simple assumption: Mon-Fri are business days.
  const addBusinessHours = (date: Date, hours: number) => {
    let hoursToAdd = hours;
    while (hoursToAdd > 0) {
      date.setTime(date.getTime() + 60 * 60 * 1000); // Add 1 hour
      // If Saturday (6) or Sunday (0), skip to Monday 00:00 (simplification)
      if (date.getDay() === 6) {
        date.setDate(date.getDate() + 2);
        date.setHours(9, 0, 0, 0); // Reset to morning next business day
      } else if (date.getDay() === 0) {
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
      }
      hoursToAdd--;
    }
    return date;
  };

  const addBusinessDays = (date: Date, days: number) => {
    let daysToAdd = days;
    while (daysToAdd > 0) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        daysToAdd--;
      }
    }
    return date;
  };

  switch (priority) {
    case TicketPriority.P1:
      // 1 Hour
      dueDate = addBusinessHours(dueDate, 1);
      break;
    case TicketPriority.P2:
      // 24 Hours (approx 1 business day or 24 business hours? usually 1 day)
      // Prompt says "24 hours", "72 hours". Assuming linear clock hours but skipping weekends?
      // Or 24 working hours (3 days)? 
      // Usually "24h SLA" means 1 business day.
      dueDate = addBusinessDays(dueDate, 1);
      break;
    case TicketPriority.P3:
      // 72 Hours (3 business days)
      dueDate = addBusinessDays(dueDate, 3);
      break;
    case TicketPriority.P4:
    case TicketPriority.P5:
      // Valid until closed. Return far future or keep null logic in UI.
      // We set a placeholder far future date for sorting purposes
      dueDate.setFullYear(dueDate.getFullYear() + 10);
      break;
  }

  // Convert to local ISO string (without timezone Z) so UI shows correct local time
  const localISO = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000).toISOString();
  return localISO;
};

export const getDaysOverdue = (dueDateStr: string, completionDateStr?: string): number => {
  const end = completionDateStr ? new Date(completionDateStr) : new Date();
  const due = new Date(dueDateStr);
  
  // If Priority 4 or 5 (very far future), it's not overdue
  if (due.getFullYear() > 2030) return 0;

  const diffTime = end.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  return diffDays > 0 ? diffDays : 0;
};
