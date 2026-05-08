import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function downloadExcel(transactions) {
  if (!transactions || transactions.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transaksi');

  // Add Title Row
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = 'LAPORAN TRANSAKSI DOMPETKU';
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4B5563' }
  };

  // Add Subtitle Row
  const now = new Date();
  const subtitleText = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const subtitleRow = worksheet.getRow(2);
  subtitleRow.getCell(1).value = subtitleText;
  subtitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF6B7280' } };
  subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  subtitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE1E293B' }
  };

  // Leave one empty row (Row 3)
  worksheet.getRow(3).height = 20;

  // Define headers
  worksheet.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 20 },
    { header: 'Jenis', key: 'jenis', width: 15 },
    { header: 'Dompet', key: 'dompet', width: 25 },
    { header: 'Kategori', key: 'kategori', width: 30 },
    { header: 'Catatan', key: 'catatan', width: 35 },
    { header: 'Nominal', key: 'nominal', width: 20 },
  ];

  // Style header row (Row 4)
  const headerRow = worksheet.getRow(4);
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4B5563' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // Add data rows starting from Row 5
  transactions.forEach((tx, index) => {
    const dateStr = new Date(tx.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    
    // Format nominal for Excel: Income positive, Expense negative
    const excelNominal = tx.nominal < 0 ? Math.abs(tx.nominal) : -tx.nominal;

    const rowNumber = index + 5; // +4 for title, subtitle, empty, header
    const row = worksheet.getRow(rowNumber);
    
    // Tanggal (Column A)
    const tanggalCell = row.getCell(1);
    tanggalCell.value = dateStr;
    tanggalCell.font = { size: 11, color: { argb: 'FF1E293B' } };
    tanggalCell.alignment = { vertical: 'middle', horizontal: 'center' };
    tanggalCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Jenis (Column B)
    const jenisCell = row.getCell(2);
    jenisCell.value = tx.nominal < 0 ? 'Pemasukan' : 'Pengeluaran';
    jenisCell.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    jenisCell.alignment = { vertical: 'middle', horizontal: 'center' };
    jenisCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Dompet (Column C)
    const dompetCell = row.getCell(3);
    dompetCell.value = tx.wallet_id || 'Tidak diketahui';
    dompetCell.font = { size: 11, color: { argb: 'FF1E293B' } };
    dompetCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dompetCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Kategori (Column D)
    const kategoriCell = row.getCell(4);
    kategoriCell.value = tx.kategori;
    kategoriCell.font = { size: 11, color: { argb: 'FF1E293B' } };
    kategoriCell.alignment = { vertical: 'middle', horizontal: 'center' };
    kategoriCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Catatan (Column E)
    const catatanCell = row.getCell(5);
    catatanCell.value = tx.catatan || tx.kategori;
    catatanCell.font = { size: 11, color: { argb: 'FF1E293B' } };
    catatanCell.alignment = { vertical: 'middle', horizontal: 'left' };
    catatanCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    // Nominal (Column F)
    const nominalCell = row.getCell(6);
    nominalCell.value = excelNominal;
    nominalCell.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    nominalCell.alignment = { vertical: 'middle', horizontal: 'right' };
    nominalCell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
    nominalCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0'; // Excel native currency format with red for expenses, green for income

    // Apply color to nominal cell based on transaction type
    if (excelNominal > 0) {
      nominalCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } }; // Green for income
    } else {
      nominalCell.font = { bold: true, size: 11, color: { argb: 'FFE11D48' } }; // Red for expenses
    }
  });

  // Add Total Row
  const totalRowNumber = transactions.length + 5; // +4 for title, subtitle, empty, header
  const totalRow = worksheet.getRow(totalRowNumber);
  
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  
  const sumCell = totalRow.getCell(6);
  sumCell.value = { formula: `SUM(F5:F${totalRowNumber - 1})` };
  sumCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0'; // Excel native currency format
  sumCell.font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
  
  // Style total row background
  totalRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Auto-fit columns
  worksheet.columns.forEach((col, index) => {
    const columnLetter = String.fromCharCode(65 + index); // A, B, C, D, E, F
    const dataRange = worksheet.getColumn(columnLetter);
    if (dataRange) {
      let maxWidth = 0;
      dataRange.eachCell((cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxWidth = Math.max(maxWidth, cellValue.length * 1.2); // Estimate width
      });
      col.width = Math.min(maxWidth + 2, 50); // Cap at 50
    }
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Generate filename with current month and year
  const filename = `Laporan_DompetKu_${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}.xlsx`;
  
  saveAs(blob, filename);
}
