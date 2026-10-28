export const destinations = [
  ["dashboard", "Dashboard"],
  ["garage", "Garage"],
  ["fuel", "Fuel & expenses"],
  ["expenses", "Expenses"],
  ["services", "Maintenance"],
  ["reminders", "Reminders"],
  ["trips", "Trip preparation"],
  ["reports", "Statistics"],
  ["history", "Vehicle history"],
  ["documents", "Documents"],
  ["settings", "Settings"],
  ["backup", "Backup & restore"],
  ["profile", "Profile"],
];
export function readRoute(hash) {
  const key = hash.replace(/^#\/?/, "").split("?")[0];
  return destinations.some(([id]) => id === key) ? key : null;
}
