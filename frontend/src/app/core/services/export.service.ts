import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  /**
   * Export array of JSON objects to CSV file and trigger browser download
   */
  exportToCsv(filename: string, rows: Record<string, any>[], columnMap?: { key: string; label: string }[]) {
    if (!rows || rows.length === 0) return;

    const keys = columnMap ? columnMap.map((c) => c.key) : Object.keys(rows[0]);
    const headers = columnMap ? columnMap.map((c) => c.label) : keys;

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        keys
          .map((k) => {
            const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    // Add UTF-8 BOM so Microsoft Excel opens it correctly with UTF-8 chars
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open a clean, printable report window with school branding
   */
  printReport(title: string, schoolName: string, htmlTableContent: string) {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${schoolName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .school-name { font-size: 20px; font-weight: 800; color: #0f172a; }
            .report-title { font-size: 15px; font-weight: 700; color: #4338ca; margin-top: 4px; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 700; text-align: left; text-transform: uppercase; font-size: 10px; color: #475569; }
            td { border: 1px solid #e2e8f0; padding: 8px 10px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
            .badge-present { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
            .badge-absent { background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
            .badge-late { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="school-name">${schoolName}</div>
              <div class="report-title">${title}</div>
            </div>
            <div class="meta">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>SchoolSense Multi-Tenant SaaS</div>
            </div>
          </div>
          ${htmlTableContent}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }
}
