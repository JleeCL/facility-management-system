import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const toRows = (reports) =>
  reports.map((r) => [
    r.id.slice(0, 8),
    r.location ? `${r.location.building} / ${r.location.floor} / ${r.location.room}` : '-',
    r.description?.slice(0, 60) || '-',
    STATUS_LABELS[r.status] || r.status,
    r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy') : '-',
  ]);

export const exportReportsToPDF = (reports, title = 'FMS Reports') => {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text(title, 14, 16);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 24);
  autoTable(pdf, {
    startY: 30,
    head: [['ID', 'Location', 'Description', 'Status', 'Submitted']],
    body: toRows(reports),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  pdf.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportReportsToExcel = (reports, title = 'FMS Reports') => {
  const rows = reports.map((r) => ({
    ID: r.id.slice(0, 8),
    Building: r.location?.building || '-',
    Floor: r.location?.floor || '-',
    Room: r.location?.room || '-',
    Description: r.description || '-',
    Status: STATUS_LABELS[r.status] || r.status,
    Submitted: r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy') : '-',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reports');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
