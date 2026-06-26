// scripts/data/retorno-templates.js
// Templates declarativos de retorno por Tipo de Ordem.
// Formato:
//   "NOME DO TIPO": [
//     { condicao: { campo: "nome", valor: "X" }, blocos: [{ texto: "..." }] },
//     { blocos: [{ texto: "..." }] }  // else (opcional)
//   ]

export const retornoTemplates = {
  'CORTE POR FALTA DE PAGAMENTO': [
    {
      condicao: { campo: 'situacao_corte', valor: 'CLIENTE CORTADO' },
      blocos: [
        { texto: 'CORTE EXECUTADO CONFORME ORDEM DE SERVIÇO {situacao_corte}' },
        { texto: '{descricao}' },
      ],
    },
    {
      // else
      blocos: [{ texto: '{situacao_corte}.' }, { texto: '{descricao}' }],
    },
  ],
};
