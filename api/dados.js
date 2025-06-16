import { google } from 'googleapis';

const SPREADSHEET_ID = '19qGfL4IqwADP9cIAQlnW2TwrM4NgDGk6a8YMY8RNFFY';
const sheetsAllowed = ['MONDAX+EDUCAÇÃO', 'ALUNOS', 'USUARIOS'];

let credentials;

try {
  console.log('GOOGLE_CREDENTIALS raw:', process.env.GOOGLE_CREDENTIALS);
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  console.log('credentials.client_email:', credentials.client_email);
} catch (e) {
  console.error('Erro ao parsear GOOGLE_CREDENTIALS:', e);
  // Pode decidir falhar aqui ou seguir com credentials undefined
  credentials = null;
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function lerPlanilha(sheetName, range = 'A1:AD14') {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const rangestr = `${sheetName}!${range}`;

  console.log(`📄 Lendo planilha: ${sheetName}, intervalo: ${rangestr}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: rangestr,
  });

  return res.data.values;
}

function transformarEmObjetos(dadosArray) {
  if (!dadosArray || dadosArray.length === 0) return [];

  const headers = dadosArray[0];
  const objetos = dadosArray.slice(1).map((linha) => {
    const obj = {};
    linha.forEach((valor, index) => {
      obj[headers[index]] = valor;
    });
    return obj;
  });

  return objetos;
}

export default async function handler(req, res) {
  const { sheet } = req.query;

  if (!sheet || !sheetsAllowed.includes(sheet)) {
    return res.status(400).json({ erro: 'Planilha inválida ou não especificada.' });
  }

  if (!credentials) {
    return res.status(500).json({ erro: 'Credenciais do Google não configuradas corretamente.' });
  }

  try {
    const dadosBrutos = await lerPlanilha(sheet);
    const dadosFormatados = transformarEmObjetos(dadosBrutos);

    return res.status(200).json({ sucesso: true, dados: dadosFormatados });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return res.status(500).json({ erro: 'Erro ao buscar dados da planilha.', detalhes: error.message });
  }
}
