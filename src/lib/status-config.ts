import { ClientStatus, ClientPriority, TaskStatus, ContactType } from "@prisma/client"

// Client Status Labels
export const clientStatusLabels: Record<ClientStatus, string> = {
  NEW_LEAD: "Nowy lead",
  IN_CONTACT: "W kontakcie",
  DEMO_SENT: "Demo wysłane",
  NEGOTIATION: "Negocjacje",
  ACTIVE_CLIENT: "Klient aktywny",
  LOST: "Utracony",
}

// Client Status Colors
export const clientStatusColors: Record<ClientStatus, string> = {
  NEW_LEAD: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  IN_CONTACT: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  DEMO_SENT: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  NEGOTIATION: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  ACTIVE_CLIENT: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  LOST: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
}

// Client Priority Labels
export const clientPriorityLabels: Record<ClientPriority, string> = {
  LOW: "Niski",
  MEDIUM: "Średni",
  HIGH: "Wysoki",
}

// Client Priority Colors
export const clientPriorityColors: Record<ClientPriority, string> = {
  LOW: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  MEDIUM: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  HIGH: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
}

// Task Status Labels
export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W toku",
  COMPLETED: "Zakończone",
}

// Task Status Colors
export const taskStatusColors: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  COMPLETED: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
}

// Contact Type Labels
export const contactTypeLabels: Record<ContactType, string> = {
  PHONE_CALL: "Rozmowa telefoniczna",
  MEETING: "Spotkanie",
  EMAIL: "E-mail",
  LINKEDIN_MESSAGE: "Wiadomość LinkedIn",
  OTHER: "Inne",
}

// Insurance Calculation Status Labels (if needed)
export const calculationStatusLabels: Record<string, string> = {
  DRAFT: "Szkic",
  SENT: "Wysłane",
  ACCEPTED: "Zaakceptowane",
  REJECTED: "Odrzucone",
}

// Insurance Calculation Status Colors
export const calculationStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
  SENT: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  ACCEPTED: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  REJECTED: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
}

// Insurance Policy Status Labels (if needed)
export const policyStatusLabels: Record<string, string> = {
  ACTIVE: "Aktywna",
  EXPIRED: "Wygasła",
  CANCELLED: "Anulowana",
}

// Insurance Policy Status Colors
export const policyStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  EXPIRED: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  CANCELLED: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
}

