const sheetsAllowed = ['aba1', 'aba2', 'aba3']; // Exemplo das abas permitidas

// Função fictícia que lê a planilha e retorna array de dados
async function lerPlanilha(sheetName) {
  // Seu código para ler a planilha via API Google Sheets
}

// Função fictícia que transforma array em objetos
function transformarEmObjetos(dadosArray) {
  // Seu código para transformar dados
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido.');
  }

  if (req.url === '/' || req.url === '') {
    return res.status(200).send('Servidor rodando! Use /dados?sheet=nome_da_aba para ver os dados.');
  }

  if (req.url.startsWith('/dados')) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const sheetName = url.searchParams.get('sheet');

      if (!sheetName || !sheetsAllowed.includes(sheetName)) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Sheet inválida ou não informada. Use um dos seguintes: ' + sheetsAllowed.join(', '),
        });
      }

      const dadosArray = await lerPlanilha(sheetName);
      const dados = transformarEmObjetos(dadosArray);

      return res.status(200).json({ sucesso: true, dados });
    } catch (error) {
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  }

  return res.status(404).send('Rota não encontrada.');
};
