export const VAULT_CATEGORIES = {
  subscription: {
    label: "Subscriptions",
    icon: "📱",
    fields: [
      { key: "provider", label: "Provider", type: "text" },
      { key: "plan", label: "Plan", type: "text" },
      { key: "cost", label: "Cost", type: "number" },
      { key: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP", "INR", "JPY"] },
      { key: "billing_cycle", label: "Billing Cycle", type: "select", options: ["monthly", "yearly", "weekly"] },
      { key: "next_billing", label: "Next Billing Date", type: "date" },
      { key: "login_url", label: "Login URL", type: "text" },
    ],
  },
  insurance: {
    label: "Insurance",
    icon: "🛡️",
    fields: [
      { key: "provider", label: "Provider", type: "text" },
      { key: "policy_number", label: "Policy Number", type: "text" },
      { key: "type", label: "Type", type: "select", options: ["health", "life", "auto", "home", "travel", "other"] },
      { key: "premium", label: "Premium", type: "number" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "coverage_amount", label: "Coverage Amount", type: "text" },
      { key: "agent_contact", label: "Agent Contact", type: "text" },
    ],
  },
  vehicle: {
    label: "Vehicle",
    icon: "🚗",
    fields: [
      { key: "make", label: "Make", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "plate", label: "Plate Number", type: "text" },
      { key: "last_service_date", label: "Last Service Date", type: "date" },
      { key: "last_service_km", label: "Last Service KM", type: "number" },
      { key: "next_service_due", label: "Next Service Due", type: "date" },
    ],
  },
  finance: {
    label: "Finance",
    icon: "💳",
    fields: [
      { key: "bank", label: "Bank", type: "text" },
      { key: "card_type", label: "Card Type", type: "select", options: ["credit", "debit", "prepaid"] },
      { key: "last_four", label: "Last 4 Digits", type: "text" },
      { key: "due_date", label: "Payment Due Date", type: "text" },
      { key: "credit_limit", label: "Credit Limit", type: "text" },
      { key: "statement_date", label: "Statement Date", type: "text" },
    ],
  },
  health: {
    label: "Health",
    icon: "🏥",
    fields: [
      { key: "provider", label: "Provider/Doctor", type: "text" },
      { key: "type", label: "Type", type: "select", options: ["doctor", "dentist", "pharmacy", "lab", "hospital", "other"] },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "last_visit", label: "Last Visit", type: "date" },
      { key: "next_appointment", label: "Next Appointment", type: "date" },
    ],
  },
  document: {
    label: "Documents",
    icon: "📄",
    fields: [
      { key: "document_type", label: "Document Type", type: "select", options: ["passport", "license", "id_card", "certificate", "contract", "warranty", "other"] },
      { key: "document_number", label: "Document Number", type: "text" },
      { key: "issued_date", label: "Issued Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
      { key: "issuing_authority", label: "Issuing Authority", type: "text" },
    ],
  },
  contact: {
    label: "Contacts",
    icon: "👤",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role/Relation", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "address", label: "Address", type: "text" },
    ],
  },
  other: {
    label: "Other",
    icon: "📋",
    fields: [
      { key: "description", label: "Description", type: "text" },
      { key: "value", label: "Value", type: "text" },
      { key: "date", label: "Date", type: "date" },
    ],
  },
} as const;

export type VaultCategoryKey = keyof typeof VAULT_CATEGORIES;

export function getCategoryConfig(key: string) {
  return VAULT_CATEGORIES[key as VaultCategoryKey] || VAULT_CATEGORIES.other;
}
