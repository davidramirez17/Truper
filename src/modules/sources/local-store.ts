import type { Project, SalesRecord, WorkspaceData } from '../analytics/types';

export function emptyLocalData(): WorkspaceData {
  return { mode: 'local', asOf: new Date().toISOString().slice(0, 10), projects: [], records: [], alerts: [] };
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('truper-workspace', 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('workspace'); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento del navegador.'));
    request.onblocked = () => reject(new Error('Cierra las otras pestañas de Truper e inténtalo de nuevo.'));
  });
}

export async function loadLocalData(): Promise<WorkspaceData> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workspace', 'readonly');
    const request = transaction.objectStore('workspace').get('data');
    transaction.oncomplete = () => { db.close(); resolve(request.result ?? emptyLocalData()); };
    transaction.onerror = () => { db.close(); reject(new Error('No se pudieron recuperar tus archivos locales.')); };
  });
}

// Read and replace in one transaction: concurrent tabs cannot lose each other's projects.
export async function saveLocalProject(project: Project, records: SalesRecord[]): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workspace', 'readwrite');
    const store = transaction.objectStore('workspace');
    const request = store.get('data');
    request.onsuccess = () => {
      const current: WorkspaceData = request.result ?? emptyLocalData();
      const nextRecords = [...current.records.filter(row => row.projectId !== project.id), ...records];
      store.put({ ...current, projects: [...current.projects.filter(item => item.id !== project.id), project], records: nextRecords, asOf: nextRecords.reduce((latest, row) => row.date > latest ? row.date : latest, '1900-01-01') }, 'data');
    };
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(new Error('No fue posible guardar la carga. Revisa el espacio disponible o los permisos del navegador.')); };
    transaction.onabort = () => { db.close(); reject(new Error('La carga no se guardó. Tus datos anteriores siguen disponibles.')); };
  });
}
