const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');
const { Parser } = require('json2csv');

function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    stream.pipe(csv())
      .on('data', (row) => results.push(normalizeRow(row)))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  return rows.map(normalizeRow);
}

function normalizeRow(row) {
  return {
    name: (row.name || row.ad || row.Name || row.Ad || '').toString().trim(),
    surname: (row.surname || row.soyad || row.Surname || row.Soyad || '').toString().trim(),
    school_no: (row.school_no || row.okul_no || row.School_No || row.Okul_No || '').toString().trim()
  };
}

async function parseFile(buffer, mimetype, filename) {
  if (filename && filename.endsWith('.xlsx')) {
    return parseExcel(buffer);
  }
  if (mimetype === 'text/csv' || (filename && filename.endsWith('.csv'))) {
    return parseCsv(buffer);
  }
  if (mimetype && mimetype.includes('spreadsheetml')) {
    return parseExcel(buffer);
  }
  return parseCsv(buffer);
}

function generateCsv(logs) {
  if (logs.length === 0) return '';
  const fields = Object.keys(logs[0]);
  const parser = new Parser({ fields, withBOM: true });
  return parser.parse(logs);
}

function generateExcel(logs) {
  const ws = xlsx.utils.json_to_sheet(logs);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Kayitlar');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { parseFile, generateCsv, generateExcel };
