const { google } = require('googleapis');

const SPREADSHEET_ID = '19qGfL4IqwADP9cIAQlnW2TwrM4NgDGk6a8YMY8RNFFY';
const sheetsAllowed = ['MONDAX+EDUCACAO', 'ALUNOS', 'USUARIOS'];

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function lerPlanilha(sheetName, range = 'A1:AD14') {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const rangeStr = `'${sheetName}'!${range}`;

  console.log(`📄 Lendo planilha: ${sheetName}, intervalo: ${rangeStr}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeStr,
  });

  return res.data.values;
}

function transformarEmObjetos(dadosArray) {
  if (!dadosArray || dadosArray.length === 0) return [];
  const [header, ...rows] = dadosArray;
  return rows.map(row => {
    const obj = {};
    header.forEach((col, i) => {
      obj[col] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido.');
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api' || pathname === '/api/') {
    return res.status(200).send('Servidor rodando! Use /api/dados?sheet=nome_da_aba para ver os dados.');
  }

  if (pathname === '/api/dados') {
    const sheetName = url.searchParams.get('sheet');

    console.log(`🔍 Requisição recebida para sheet: "${sheetName}"`);

    if (!sheetName || !sheetsAllowed.includes(sheetName)) {
      console.warn(`⚠️ Sheet inválida ou não permitida: "${sheetName}"`);
      return res.status(400).json({
        sucesso: false,
        erro: 'Sheet inválida ou não informada. Use um dos seguintes: ' + sheetsAllowed.join(', '),
      });
    }

    try {
      const dadosArray = await lerPlanilha(sheetName);
      const dados = transformarEmObjetos(dadosArray);

      console.log(`✅ Dados obtidos da aba "${sheetName}" com ${dados.length} registros`);

      return res.status(200).json({ sucesso: true, sheet: sheetName, dados });
    } catch (error) {
      console.error(`❌ Erro ao ler a aba "${sheetName}":`, error);
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  return res.status(404).send('Rota não encontrada.');
};
