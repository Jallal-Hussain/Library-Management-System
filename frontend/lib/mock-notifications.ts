export type NotificationType = "overdue" | "reservation" | "system" | "reminder"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  date: string
  read: boolean
}

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "overdue",
    title: "Overdue Book Alert",
    message: '"1984" by George Orwell was due on Dec 1st. Current fine: $5.50',
    date: "2024-12-10",
    read: false,
  },
  {
    id: "2",
    type: "reservation",
    title: "Reservation Ready",
    message: '"The Design of Everyday Things" is now available for pickup.',
    date: "2024-12-09",
    read: false,
  },
  {
    id: "3",
    type: "reminder",
    title: "Due Date Reminder",
    message: '"Clean Code" is due in 3 days. Consider renewing if needed.',
    date: "2024-12-08",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Library Hours Update",
    message: "The library will have extended hours during finals week.",
    date: "2024-12-07",
    read: true,
  },
]

