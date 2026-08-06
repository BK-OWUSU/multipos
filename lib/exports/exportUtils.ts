import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
}

/**
 * Exports JSON data to an Excel file (.xlsx)
 */
export function exportToExcel(data: Record<string, unknown>[], options: ExportOptions = {}) {
  const { filename = "export_data", sheetName = "Sheet1" } = options;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exports JSON data to a formatted PDF table file (.pdf) using jspdf-autotable
 */
export function exportToPDF(data: Record<string, unknown>[], options: ExportOptions = {}) {
  const { filename = "export_data", title = "Exported Report" } = options;

  if (!data || data.length === 0) return;

  const doc = new jsPDF();

  // Add document title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);

  // Extract table headers dynamically from the keys of the first data object
  const headers = Object.keys(data[0]);

  // Map data values into rows format required by autotable
  const rows: RowInput[] = data.map((item) => 
    headers.map((key) => (item[key] !== null && item[key] !== undefined ? String(item[key]) : ""))
  );

  // Generate the table using jspdf-autotable
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] }, // Indigo theme header matching your UI
    styles: { fontSize: 7, cellPadding: 4 },
  });

  // Save the generated PDF file
  doc.save(`${filename}.pdf`);
}