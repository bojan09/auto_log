export const stores = [
  "vehicles",
  "odometerEntries",
  "serviceSchedules",
  "serviceRecords",
  "fuelEntries",
  "expenseEntries",
  "attachments",
  "checklists",
  "settings",
];
export function openDatabase(factory = indexedDB) {
  return new Promise((resolve, reject) => {
    const request = factory.open("autolog", 1);
    request.onupgradeneeded = () => {
      for (const name of stores)
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Close other AutoLog tabs to update storage."));
  });
}
export function saveVehicle(db, vehicle) {
  if (
    !vehicle.id ||
    !vehicle.make.trim() ||
    !vehicle.model.trim() ||
    !Number.isFinite(vehicle.odometer) ||
    vehicle.odometer < 0
  )
    return Promise.reject(new Error("Invalid vehicle"));
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vehicles", "readwrite");
    tx.objectStore("vehicles").put(vehicle);
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () =>
      reject(tx.error || new Error("Save aborted"));
  });
}
