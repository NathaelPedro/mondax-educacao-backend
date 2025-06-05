const express = require('express');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

const SPREADSHEET_ID = '19qGfL4IqwADP9cIAQlnW2TwrM4NgDGk6a8YMY8RNFFY';

// Lista das abas válidas
const sheetsAllowed = ['MONDAX+EDUCAÇÃO', 'alunos', 'usuarios'];

// Parse da variável de ambiente com as credenciais JSON
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
console.log('Credenciais carregadas:', {
  project_id: credentials.project_id,
  client_email: credentials.client_email,
  private_key_id: credentials.private_key_id,
});  // não exibe private_key para segurança

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function lerPlanilha(sheetName, range = 'A1:AD14') {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const rangeStr = `'${sheetName}'!${range}`;
  console.log('Range usado:', rangeStr);

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

app.get('/', (req, res) => {
  res.send('Servidor rodando! Use /dados?sheet=nome_da_aba para ver os dados.');
});

app.get('/dados', async (req, res) => {
  try {
    const sheetName = req.query.sheet;
    if (!sheetName || !sheetsAllowed.includes(sheetName)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Sheet inválida ou não informada. Use um dos seguintes: ' + sheetsAllowed.join(', '),
      });
    }

    const dadosArray = await lerPlanilha(sheetName);
    const dados = transformarEmObjetos(dadosArray);
    res.json({ sucesso: true, sheet: sheetName, dados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
