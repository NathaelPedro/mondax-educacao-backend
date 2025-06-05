const express = require('express');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

const SPREADSHEET_ID = '19qGfL4IqwADP9cIAQlnW2TwrM4NgDGk6a8YMY8RNFFY';

// Nome exato da aba da planilha, com acento e símbolos
const SHEET_NAME = "MONDAX+EDUCAÇÃO";

async function lerPlanilha() {
  // Parse JSON da variável de ambiente
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const range = `'${SHEET_NAME}'!A1:AD14`;
  console.log('Range usado:', range);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });

  return res.data.values;
}

// Função para transformar array de arrays em array de objetos JSON
function transformarEmObjetos(dadosArray) {
  const [header, ...rows] = dadosArray;
  return rows.map(row => {
    const obj = {};
    header.forEach((col, i) => {
      obj[col] = row[i] !== undefined ? row[i] : null; // preencher null se valor ausente
    });
    return obj;
  });
}

app.get('/', (req, res) => {
  res.send('Servidor rodando! Acesse /dados para ver os dados da planilha.');
});

app.get('/dados', async (req, res) => {
  try {
    const dadosArray = await lerPlanilha();
    const dados = transformarEmObjetos(dadosArray);
    res.json({ sucesso: true, dados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
