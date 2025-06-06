const sheetsAllowed = ['aba1', 'aba2', 'aba3']; // Abas permitidas

// Função que lê a planilha (exemplo)
async function lerPlanilha(sheetName) {
  // Coloque aqui sua lógica para ler a planilha pelo Google Sheets API
  // Exemplo fixo para teste:
  return [
    ['id', 'nome', 'nota'],
    [1, 'João', 8.5],
    [2, 'Maria', 9.0],
  ];
}

// Função para transformar array em objetos
function transformarEmObjetos(dadosArray) {
  const [header, ...rows] = dadosArray;
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });
}

// Só uma vez exporta o handler!
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido.');
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/' || pathname === '') {
    return res.status(200).send('Servidor rodando! Use /dados?sheet=nome_da_aba para ver os dados.');
  }

  if (pathname === '/dados') {
    const sheetName = url.searchParams.get('sheet');

    if (!sheetName || !sheetsAllowed.includes(sheetName)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Sheet inválida ou não informada. Use um dos seguintes: ' + sheetsAllowed.join(', '),
      });
    }

    try {
      const dadosArray = await lerPlanilha(sheetName);
      const dados = transformarEmObjetos(dadosArray);
      return res.status(200).json({ sucesso: true, dados });
    } catch (error) {
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  if (pathname === '/index.js') {
    // Retorna os dados da aba padrão (exemplo: 'aba1')
    const sheetName = 'aba1';

    try {
      const dadosArray = await lerPlanilha(sheetName);
      const dados = transformarEmObjetos(dadosArray);
      return res.status(200).json({ sucesso: true, dados });
    } catch (error) {
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  return res.status(404).send('Rota não encontrada.');
};
