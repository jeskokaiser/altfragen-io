import Papa from 'papaparse';
import { toast } from 'sonner';

export interface CSVParseResult {
  headers: string[];
  rows: any[];
}

export const parseCSV = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        console.log('Total rows in CSV:', results.data.length);
        
        if (!results.data || results.data.length < 2) {
          reject(new Error("Die CSV-Datei ist leer oder ungültig"));
          return;
        }

        const headers = Array.isArray(results.data[0]) ? results.data[0] : Object.keys(results.data[0]);
        console.log('CSV headers:', headers);
        
        const requiredColumns = ['Frage', 'A', 'B', 'C', 'D', 'E', 'Fach', 'Antwort', 'Kommentar'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          reject(new Error(`Fehlende Spalten: ${missingColumns.join(', ')}`));
          return;
        }

        resolve({
          headers,
          rows: results.data.slice(1) // Skip header row
        });
      },
      header: false,
      skipEmptyLines: true,
      error: (error) => {
        console.error('CSV parsing error:', error);
        reject(new Error("Fehler beim Lesen der CSV-Datei"));
      }
    });
  });
};