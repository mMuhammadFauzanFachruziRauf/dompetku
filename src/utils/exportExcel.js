import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function downloadExcel(transactions) {
  if (!transactions || transactions.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Riwayat Transaksi');

  // Define columns
  worksheet.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 20 },
    { header: 'Kategori', key: 'kategori', width: 25 },
    { header: 'Catatan', key: 'catatan', width: 35 },
    { header: 'Nominal', key: 'nominal', width: 20 },
  ];

  // Style header
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF1E293B' } }; // slate-800
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }, // slate-200
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } }
    };
  });

  // Add data rows
  transactions.forEach((tx) => {
    const dateStr = new Date(tx.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    
    // In our DB: Expense is positive, Income is negative
    // User requested: Income = Positive (Green), Expense = Negative (Red)
    const excelNominal = tx.nominal < 0 ? Math.abs(tx.nominal) : -tx.nominal;

    const row = worksheet.addRow({
      tanggal: dateStr,
      kategori: tx.kategori,
      catatan: tx.catatan || tx.kategori,
      nominal: excelNominal
    });

    // Style the nominal cell
    const nominalCell = row.getCell('nominal');
    nominalCell.numFmt = 'Rp #,##0;[Red]-Rp #,##0'; // Excel native currency format with red for negative
    
    // Explicit color for positive (Income)
    if (excelNominal > 0) {
      nominalCell.font = { color: { argb: 'FF059669' }, bold: true }; // emerald-600
    } else {
      nominalCell.font = { color: { argb: 'FFE11D48' }, bold: true }; // rose-600
    }
  });

  // Add Total Row
  const totalRowNumber = transactions.length + 2; // +1 for header, +1 to be below data
  const totalRow = worksheet.getRow(totalRowNumber);
  
  totalRow.getCell('catatan').value = 'TOTAL';
  totalRow.getCell('catatan').font = { bold: true };
  totalRow.getCell('catatan').alignment = { horizontal: 'right' };
  
  const sumCell = totalRow.getCell('nominal');
  // Formula: sum from D2 to D(N) where N is the last transaction row (transactions.length + 1)
  sumCell.value = { formula: `SUM(D2:D${transactions.length + 1})` };
  sumCell.numFmt = 'Rp #,##0;[Red]-Rp #,##0';
  sumCell.font = { bold: true };
  
  // Style total row background
  totalRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // slate-100
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `dompetku_transaksi_${new Date().toISOString().split("T")[0]}.xlsx`);
}
