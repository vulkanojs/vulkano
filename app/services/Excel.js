const ExcelJS = require('exceljs');

/**
 *
 *  Example:
 *
 *  const [
 *    file
 *  ] = req.files || [];
 *
 *  const {
 *    path: filePath
 *  } = file || {};
 *
 *  return Excel.readFile(filePath).then( (rows) => rows )

*/

module.exports = {

  getHeaders(file) {

    const workbook = new ExcelJS.Workbook();
    return workbook.xlsx.readFile(file)
      .then( () => {

        const worksheet = workbook.getWorksheet();

        const columns = [];

        // get headers from the first row of your data
        const headerRow = worksheet.getRow(1);

        const p = new Promise( (resolve) => {
          headerRow.eachCell( (cell) => {
            columns.push( String(cell.value || '').trim() );
          });
          resolve();
        });

        return Promise.all([p]).then( () => columns );

      })
      .catch( (err) => {
        console.log(err);
        return [];
      });

  },

  readFile(file, includeFirstRow) {

    const workbook = new ExcelJS.Workbook();
    return workbook.xlsx.readFile(file)
      .then( () => {

        const worksheet = workbook.getWorksheet();

        // Remove the headers
        if (!includeFirstRow) {
          worksheet.spliceRows(0, 1);
        }

        const rows = [];

        // Iterate over all rows that have values in a worksheet
        const p = new Promise( (resolve) => {
          worksheet.eachRow( (row) => {
            rows.push( (row.values || []).slice(1) );
          });
          resolve();
        });

        return Promise.all([p]).then( () => rows );

      })
      .catch( (err) => {
        console.log(err);
        return [];
      });

  }

};
