export interface HeatmapPoint {
  minute: number;
  count: number;
  temperature: 'Frio' | 'Morno' | 'Quente' | 'Super Quente';
}

// Dados reais extraídos da análise de ~150.000 rodadas fornecida pelo usuário.
const realCounts: { [minute: number]: number } = {
  "0": 172, "1": 162, "2": 187, "3": 178, "4": 187, "5": 182, "6": 167, "7": 180, "8": 182, "9": 161,
  "10": 170, "11": 177, "12": 179, "13": 179, "14": 201, "15": 197, "16": 182, "17": 163, "18": 179, "19": 175,
  "20": 175, "21": 181, "22": 194, "23": 193, "24": 176, "25": 174, "26": 156, "27": 177, "28": 222, "29": 174,
  "30": 184, "31": 196, "32": 151, "33": 189, "34": 194, "35": 165, "36": 186, "37": 205, "38": 165, "39": 176,
  "40": 171, "41": 196, "42": 187, "43": 181, "44": 213, "45": 203, "46": 184, "47": 188, "48": 186, "49": 180,
  "50": 181, "51": 170, "52": 174, "53": 168, "54": 191, "55": 173, "56": 194, "57": 178, "58": 177, "59": 179
};

export const heatmapData: HeatmapPoint[] = Array.from({ length: 60 }, (_, minute) => {
  const count = realCounts[minute] || 0;
  let temperature: 'Frio' | 'Morno' | 'Quente' | 'Super Quente';

  // Novos limites de temperatura baseados na escala de dados real (151 a 222)
  if (count < 170) temperature = 'Frio';
  else if (count < 185) temperature = 'Morno';
  else if (count < 200) temperature = 'Quente';
  else temperature = 'Super Quente';

  return { minute, count, temperature };
});