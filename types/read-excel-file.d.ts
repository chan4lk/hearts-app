/**
 * Minimal ambient type declaration for `read-excel-file`.
 *
 * The package ships JavaScript only; we supply the shape we actually use
 * (default export returning a row matrix) so TypeScript is happy.
 */
declare module 'read-excel-file' {
  type Cell = string | number | boolean | Date | null;
  type Row = Cell[];

  /**
   * Parses an .xlsx file in the browser and resolves with a 2D array where
   * `rows[0]` is the header row and subsequent rows are data.
   */
  export default function readXlsxFile(input: File | Blob): Promise<Row[]>;
}
