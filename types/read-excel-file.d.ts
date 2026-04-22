/**
 * Minimal ambient type declaration for `read-excel-file`.
 *
 * The package has subpath-only exports (no default `.` entry):
 *   - `read-excel-file/browser`   ← client components
 *   - `read-excel-file/node`      ← server code
 *   - `read-excel-file/web-worker`
 *   - `read-excel-file/universal`
 *
 * We only use the browser variant. If server-side parsing is ever needed,
 * add a similar declaration for `read-excel-file/node`.
 */
declare module 'read-excel-file/browser' {
  type Cell = string | number | boolean | Date | null;
  type Row = Cell[];

  /**
   * Parses an .xlsx File/Blob in the browser and resolves with a 2D array
   * where `rows[0]` is the header row and subsequent rows are data.
   */
  export default function readXlsxFile(input: File | Blob): Promise<Row[]>;
}
