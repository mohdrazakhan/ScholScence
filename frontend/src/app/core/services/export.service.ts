import { Injectable } from '@angular/core';

export interface ColumnDef {
  header?: string;
  label?: string;
  key: string;
  formatter?: (val: any, row?: any) => string;
}

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  /**
   * Export array of JSON objects to CSV file and trigger browser download
   */
  exportToCsv(filename: string, rows: Record<string, any>[], columnMap?: ColumnDef[]) {
    if (!rows || rows.length === 0) return;

    let headers: string[];
    let extractors: ((row: any) => string)[];

    if (columnMap && columnMap.length > 0) {
      headers = columnMap.map((c) => c.header || c.label || c.key);
      extractors = columnMap.map((c) => (row: any) => {
        const val = row[c.key];
        if (c.formatter) return c.formatter(val, row);
        return val !== undefined && val !== null ? String(val) : '';
      });
    } else {
      const keys = Object.keys(rows[0]);
      headers = keys;
      extractors = keys.map((k) => (row: any) => (row[k] !== undefined && row[k] !== null ? String(row[k]) : ''));
    }

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        extractors.map((fn) => `"${fn(row).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\r\n');

    // Add UTF-8 BOM so Microsoft Excel opens it correctly with UTF-8 chars
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/\s+/g, '_')}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open a clean, printable report window with school branding
   */
  printReport(title: string, subtitleOrSchoolName: string, rowsOrHtml: any[] | string, columns?: ColumnDef[]) {
    let htmlTable = '';

    if (typeof rowsOrHtml === 'string') {
      htmlTable = rowsOrHtml;
    } else if (Array.isArray(rowsOrHtml) && columns) {
      const headerThs = columns.map((c) => `<th>${c.header || c.label || c.key}</th>`).join('');
      const bodyTrs = rowsOrHtml
        .map((row) => {
          const tds = columns
            .map((c) => {
              const raw = row[c.key];
              const val = c.formatter ? c.formatter(raw, row) : raw !== undefined && raw !== null ? String(raw) : '';
              return `<td>${val}</td>`;
            })
            .join('');
          return `<tr>${tds}</tr>`;
        })
        .join('');

      htmlTable = `
        <table>
          <thead>
            <tr>${headerThs}</tr>
          </thead>
          <tbody>
            ${bodyTrs}
          </tbody>
        </table>
      `;
    }

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .school-name { font-size: 18px; font-weight: 800; color: #0f172a; }
            .report-title { font-size: 14px; font-weight: 700; color: #4338ca; margin-top: 4px; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 700; text-align: left; text-transform: uppercase; font-size: 10px; color: #475569; }
            td { border: 1px solid #e2e8f0; padding: 8px 10px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="school-name">SchoolSense • Campus Management System</div>
              <div class="report-title">${title}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${subtitleOrSchoolName}</div>
            </div>
            <div class="meta">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>Official Academic Document</div>
            </div>
          </div>
          ${htmlTable}
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

