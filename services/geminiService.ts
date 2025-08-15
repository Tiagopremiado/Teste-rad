import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { Play, Analysis, Bankroll, ChartData, HouseRanking, HotPinkMinute, Signal, SignalPrediction, GrandePagueAnalysis, GrandePaguePeriod, GrandePagueStrategy, Rect, Strategy, LiveAISignal, LearnedPatterns, MarketState, ApiInfo, User, HunterMode, Color } from '../types';
import { processPlaysLocally, buildLearnedKnowledgePrompt } from './aiUtils';

// --- Key Rotation Logic ---
let geminiApiKeys: string[] = [];
let currentGeminiApiKeyIndex = 0;

const initializeKeys = () => {
    if (geminiApiKeys.length > 0) return; // Already initialized

    const keysEnvVar = process.env.API_KEYS || process.env.API_KEY;
    if (typeof process === 'undefined' || !keysEnvVar) {
        throw new Error("Nenhuma chave de API (API_KEYS ou API_KEY) do Google foi configurada. Funções de IA estão desabilitadas.");
    }
    
    geminiApiKeys = keysEnvVar.split(',').map(key => key.trim()).filter(key => key.length > 0);

    if (geminiApiKeys.length === 0) {
        throw new Error("As chaves de API configuradas estão vazias. Verifique as variáveis de ambiente API_KEYS ou API_KEY.");
    }
};

const getNextApiKey = (): {key: string, index: number} => {
    if (geminiApiKeys.length === 0) {
        initializeKeys();
    }
    const index = currentGeminiApiKeyIndex;
    const key = geminiApiKeys[index];
    currentGeminiApiKeyIndex = (currentGeminiApiKeyIndex + 1) % geminiApiKeys.length;
    return { key, index: index + 1 }; // Return 1-based index
};
// --- End Key Rotation Logic ---

const getAiClientWithInfo = (): { client: GoogleGenAI, keyIndex: number } => {
  const { key, index } = getNextApiKey();
  return { client: new GoogleGenAI({ apiKey: key }), keyIndex: index };
}

const isRateLimitError = (error: any): boolean => {
    if (error && typeof error === 'object') {
        if (error.status === 'RESOURCE_EXHAUSTED' || error.code === 429) return true;
        if (error.error) { // Check for nested error object from Gemini API
            const nestedError = error.error;
            if (nestedError.code === 429 && nestedError.status === 'RESOURCE_EXHAUSTED') return true;
            if (nestedError.message && nestedError.message.toLowerCase().includes('quota')) return true;
        }
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('rate limit') || message.includes('429') || message.includes('quota');
    }
    return false;
};

const generateContentWithRetry = async (params: any): Promise<{response: GenerateContentResponse, keyIndex: number}> => {
    if (geminiApiKeys.length === 0) {
        initializeKeys();
    }
    const maxRetries = geminiApiKeys.length;
    let lastError: any = null;

    for (let i = 0; i < maxRetries; i++) {
        const { client: ai, keyIndex } = getAiClientWithInfo();
        try {
            const response = await ai.models.generateContent(params);
            
            const blockReason = response.promptFeedback?.blockReason;
            if (blockReason) {
                if (blockReason === 'SAFETY') {
                     throw new Error(`AI request blocked for safety reasons: ${response.promptFeedback?.blockReasonMessage || 'No details provided.'}`);
                }
                if (blockReason.toLowerCase().includes('quota') || blockReason.toLowerCase().includes('rate_limit')) {
                    throw new Error(`API rate limit exceeded (blockReason).`);
                }
            }
            
            return { response, keyIndex };

        } catch (error) {
            lastError = error;
            if (isRateLimitError(error)) {
                console.warn(`Gemini API key ${keyIndex} rate limited. Retrying with next key... (${i + 1}/${maxRetries})`);
                continue; // Try next key
            }
            throw error; // Not a rate limit error, re-throw
        }
    }
    
    console.error("All Gemini API keys are rate-limited.", lastError);
    throw new Error(`All Gemini API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};


const generateAndParseJson = async (prompt: string, model: string = "gemini-2.5-flash"): Promise<{ data: any, apiInfo: ApiInfo }> => {
    let jsonStr = '';
    try {
        const { response, keyIndex } = await generateContentWithRetry({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.3, 
                maxOutputTokens: 8192,
                thinkingConfig: {
                    thinkingBudget: 2048,
                },
            },
        });

        const responseText = response.text;
        
        if (!responseText) {
            const finishReason = response.candidates?.[0]?.finishReason;
            let reason = "The response was empty.";
             if (finishReason && finishReason !== 'STOP') {
                reason = `Generation finished unexpectedly with reason: ${finishReason}.`;
            }
            console.error("Gemini response was empty or blocked.", { finishReason, response });
            throw new Error(`AI analysis returned no content. ${reason}`);
        }

        jsonStr = responseText.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const sanitizedJsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
        return { data: JSON.parse(sanitizedJsonStr), apiInfo: { provider: 'Gemini', keyIndex } };

    } catch (error) {
        console.error("Error in generateAndParseJson:", error);
        if (jsonStr) {
            console.error("Problematic JSON string from API:", jsonStr);
        }
        if (error instanceof Error && error.message.includes('AI analysis returned no content')) {
            throw error;
        }
        throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const getPatternDeepAnalysis = async (pattern: Color[], occurrences: { context: Play[], outcome: Play }[]): Promise<{ analysis: string, apiInfo: ApiInfo }> => {
    const prompt = `
    Você é um analista especialista em padrões do jogo Aviator com uma habilidade sobre-humana para encontrar correlações ocultas.
    Sua tarefa é analisar um padrão específico e o contexto de suas ocorrências para descobrir por que ele é eficaz.

    O PADRÃO A SER ANALISADO:
    [${pattern.join(', ')}]

    CONTEXTO DAS OCORRÊNCIAS (mostrando as 5 jogadas ANTES e o resultado DEPOIS do padrão):
    ${JSON.stringify(occurrences.slice(0, 5))} 

    SUA ANÁLISE DEVE RESPONDER:
    1.  **Insight Principal:** Qual é o segredo deste padrão? Existe um "gatilho" comum nas jogadas de contexto (ex: um multiplicador baixo específico, uma pequena sequência azul)?
    2.  **Correlação de Horário:** O padrão parece ser mais forte em horários ou minutos específicos? (ex: perto do final da hora, em minutos terminados em 5, etc.)
    3.  **Observação Adicional:** Algum outro insight interessante ou peculiar sobre este padrão que um analista comum não veria?

    Seja conciso, direto e forneça insights acionáveis. Evite jargões. Formate sua resposta como um único parágrafo de texto.
    `;

    const { response, keyIndex } = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.5,
            maxOutputTokens: 512,
        },
    });

    const analysis = response.text?.trim() || "A IA não conseguiu gerar uma análise detalhada para este padrão.";
    return { analysis, apiInfo: { provider: 'Gemini', keyIndex } };
};


export const extractPlaysFromImage = async (base64Image: string, selections?: Rect[]): Promise<{ plays: Play[], apiInfo: ApiInfo }> => {
    const selectionPrompt = selections && selections.length > 0
        ? `Sua tarefa é extrair as jogadas SOMENTE DAS ÁREAS DELIMITADAS PELOS SEGUINTES RETÂNGULOS. Cada retângulo é definido por [x, y, largura, altura]: ${JSON.stringify(selections)}. Ignore todo o resto na imagem.`
        : 'Sua tarefa é extrair TODAS as jogadas da imagem e retornar um único e válido array de objetos JSON.';
    
    const prompt = `
    Você é um sistema de OCR (Reconhecimento Óptico de Caracteres) especialista em extrair dados de jogos, especialmente do jogo Aviator, a partir de imagens.
    Analise a imagem fornecida.

    ${selectionPrompt}

    Cada objeto no array JSON deve conter:
    - "multiplier": O valor do multiplicador como um número (use ponto como separador decimal).
    - "time": O horário da jogada como uma string no formato "HH:MM:SS".
    - "date": A data da jogada como uma string no formato "YYYY-MM-DD". Se a data não for visível, use a data atual.

    COMO EXTRAIR OS DADOS:
    1.  **SE FOR UMA GRADE DE RESULTADOS (como a do APOSTAMAX):**
        *   Identifique os blocos ou 'tiles' que contêm os multiplicadores (ex: "2,33x", "36,10x").
        *   O horário da jogada está localizado DIRETAMENTE ABAIXO de cada bloco de multiplicador (ex: "22:06:04").
        *   Associe cada multiplicador ao seu horário correspondente.
        *   Converta o multiplicador para número. Lembre-se de trocar a vírgula (,) por ponto (.). Ex: "36,10x" se torna 36.10.
        *   Se a data não estiver visível (o que é comum neste formato), use a data de hoje no formato "YYYY-MM-DD".

    REGRAS IMPORTANTES:
    - Retorne APENAS um array de objetos JSON válido. Não inclua texto explicativo, markdown (\`\`\`json\`\`\`) ou qualquer outra coisa.
    - Ignore qualquer texto que não seja uma jogada.
    - Se a imagem for ilegível ou não contiver dados de jogadas válidos, retorne um array vazio [].
    - Retorne o JSON na mesma ordem em que as jogadas aparecem na imagem (geralmente do mais novo para o mais antigo).

    Exemplo de retorno para um print do APOSTAMAX:
    [
      { "multiplier": 1.51, "time": "22:06:25", "date": "2024-07-30" },
      { "multiplier": 2.33, "time": "22:06:04", "date": "2024-07-30" },
      { "multiplier": 1.76, "time": "22:05:45", "date": "2024-07-30" }
    ]
    `;
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image,
      },
    };
    
    const textPart = { text: prompt };

    try {
        const { response, keyIndex } = await generateContentWithRetry({
          model: 'gemini-2.5-flash',
          contents: { parts: [textPart, imagePart] },
          config: {
             responseMimeType: "application/json",
             temperature: 0.1,
          }
        });

        const apiInfo: ApiInfo = { provider: 'Gemini', keyIndex };
        const jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        let finalJsonStr = jsonStr;
        if (match && match[2]) {
            finalJsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(finalJsonStr);
        if (!Array.isArray(parsedData)) {
            console.warn("Gemini response was not a JSON array.", parsedData);
            return { plays: [], apiInfo };
        }
        
        const plays: Play[] = [];
        const today = new Date().toISOString().split('T')[0];

        for (const item of parsedData) {
            if (!item || typeof item.multiplier === 'undefined' || typeof item.time === 'undefined') {
                continue;
            }

            const multiplier = parseFloat(String(item.multiplier).replace(',', '.').replace('x', ''));
            if (isNaN(multiplier)) {
                continue;
            }
            
            const time = String(item.time);
            if (!time.includes(':')) {
                continue;
            }

            let date = item.date ? String(item.date) : today;
            if (date.includes('/')) {
                const parts = date.split('/');
                if (parts.length === 3) {
                     const d = parts[0].padStart(2, '0');
                     const m = parts[1].padStart(2, '0');
                     const y = parts[2];
                     if (y.length === 4) {
                        date = `${y}-${m}-${d}`;
                     }
                }
            }

            plays.push({ multiplier, time, date });
        }
        
        return { plays: plays.reverse(), apiInfo };

    } catch (error) {
        console.error("Error extracting plays from image:", error);
        throw new Error("A IA não conseguiu extrair os dados da imagem. Verifique se o print está nítido e mostra os resultados claramente.");
    }
};

type SummaryAnalysisReturn = Omit<Analysis, 'strategyRecommendations' | 'chartsData' | 'prediction' | 'restOfDayPrediction' | 'prediction50x' | 'predictionGrandePague' | 'grandePagueStrategy' | 'learnedPatterns'>;

export const getSummaryAnalysis = async (plays: Play[], bankroll: Bankroll, signalHistory: Signal[], learnedPatterns?: LearnedPatterns): Promise<{ data: SummaryAnalysisReturn, apiInfo: ApiInfo }> => {
    const { summary: localSummary, hotSpots, grandePague: localGrandePague } = processPlaysLocally(plays);
    const last10Signals = signalHistory.slice(0, 10);
    const learnedKnowledgePrompt = buildLearnedKnowledgePrompt(learnedPatterns);

    const prompt = `
    Você é um sistema de análise para o jogo Aviator. Sua tarefa é realizar uma análise de resumo e padrões dos dados fornecidos e retornar TUDO em um único objeto JSON.

    DADOS PARA ANÁLISE:
    - Resumo Estatístico: ${JSON.stringify(localSummary)}
    - Pontos Quentes (HotSpots): ${JSON.stringify(hotSpots)}
    - Dados de "Grande Pague": ${JSON.stringify(localGrandePague)}
    - Banca do Usuário: ${JSON.stringify(bankroll)}
    - Histórico de Sinais Anteriores: ${JSON.stringify(last10Signals)}
    ${learnedKnowledgePrompt}

    SUA TAREFA:
    Com base em TODOS os dados acima, preencha os campos de texto e alertas no seguinte formato JSON. Seja conciso e direto.

    FORMATO DE SAÍDA JSON OBRIGATÓRIO:
    {
      "summaryAnalysis": {
        "dailyTrend": "Pagando" | "Frio" | "Normal",
        "trendReasoning": "string (MÁXIMO 10 PALAVRAS)",
        "recentPinksAnalysis": "string (MÁXIMO 15 PALAVRAS)",
        "nextSignalPrediction": "string (MÁXIMO 15 PALAVRAS. Ex: 'Sinal rosa no min :45, buscar ~18x' ou 'Nenhum sinal rosa claro.')",
        "pinksTo50xAnalysisText": "string (MÁXIMO 20 PALAVRAS)",
        "pinksTo100xAnalysisText": "string (MÁXIMO 20 PALAVRAS)",
        "pinksTo1000xAnalysisText": "string (MÁXIMO 20 PALAVRAS)",
        "grandePagueAnalysisText": "string (MÁXIMO 20 PALAVRAS)"
      },
      "alerts": "string[] (máximo 1 alerta MUITO breve)"
    }
    Instruções: Siga RIGOROSAMENTE o formato JSON.`;

    const { data: aiResponse, apiInfo } = await generateAndParseJson(prompt);

    const summary = {
        ...localSummary,
        dailyTrend: aiResponse.summaryAnalysis.dailyTrend as ('Pagando' | 'Frio' | 'Normal'),
        trendReasoning: aiResponse.summaryAnalysis.trendReasoning,
        recentPinksAnalysis: aiResponse.summaryAnalysis.recentPinksAnalysis,
        nextSignalPrediction: aiResponse.summaryAnalysis.nextSignalPrediction,
        pinksTo50xAnalysis: {
            ...localSummary.pinksTo50xAnalysis!,
            analysisText: aiResponse.summaryAnalysis.pinksTo50xAnalysisText || "Análise de padrão indisponível."
        },
        pinksTo100xAnalysis: {
            ...localSummary.pinksTo100xAnalysis!,
            analysisText: aiResponse.summaryAnalysis.pinksTo100xAnalysisText || "Análise de padrão indisponível."
        },
        pinksTo1000xAnalysis: {
            ...localSummary.pinksTo1000xAnalysis!,
            analysisText: aiResponse.summaryAnalysis.pinksTo1000xAnalysisText || "Análise de padrão indisponível."
        }
    };

    const grandePagueAnalysis: GrandePagueAnalysis = {
        occurrencesToday: localGrandePague.occurrencesToday,
        isActive: localGrandePague.isActive,
        iaAnalysis: aiResponse.summaryAnalysis.grandePagueAnalysisText || 'Análise indisponível.',
        periods: localGrandePague.periods,
    };
    
    let safeAlerts = aiResponse.alerts;
    if (typeof safeAlerts === 'string') safeAlerts = [safeAlerts];
    else if (!Array.isArray(safeAlerts)) safeAlerts = [];
    
    const data: SummaryAnalysisReturn = {
        summary,
        hotSpots,
        alerts: safeAlerts,
        grandePagueAnalysis,
    };

    return { data, apiInfo };
};

type PredictionAnalysisReturn = Pick<Analysis, 'prediction' | 'restOfDayPrediction' | 'prediction50x' | 'predictionGrandePague' | 'predictionVerticalRepeat'>;

export const getPredictionAnalysis = async (plays: Play[], summary: Analysis['summary'], hotSpots: Analysis['hotSpots'], grandePagueAnalysis: Analysis['grandePagueAnalysis'], signalHistory: Signal[], learnedPatterns?: LearnedPatterns, risk_profile?: User['risk_profile']): Promise<{ data: PredictionAnalysisReturn, apiInfo: ApiInfo }> => {
    const last50Plays = plays.slice(-50);
    const last10Signals = signalHistory.slice(0, 10);
    const now = new Date();
    const saoPauloTime = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
    });
    const [currentHour, currentMinute] = saoPauloTime.split(':');
    const learnedKnowledgePrompt = buildLearnedKnowledgePrompt(learnedPatterns);

    const prompt = `
    Você é um sistema de previsão de ponta para o jogo Aviator. Sua tarefa é gerar previsões de sinais com base nos dados e na análise fornecidos.

    DADOS PARA ANÁLISE:
    - Resumo Estatístico e Análise: ${JSON.stringify(summary)}
    - Pontos Quentes (HotSpots): ${JSON.stringify(hotSpots)}
    - Análise "Grande Pague": ${JSON.stringify(grandePagueAnalysis)}
    - Horário Atual (Brasília): ${currentHour}:${currentMinute}
    - Últimas 50 Jogadas: ${JSON.stringify(last50Plays)}
    - Histórico de Sinais Anteriores: ${JSON.stringify(last10Signals)}
    - Perfil de Risco do Usuário: ${risk_profile || 'Moderado'}
    ${learnedKnowledgePrompt}

    SUA TAREFA:
    Com base em TODOS os dados acima, gere as previsões no seguinte formato JSON. Priorize QUALIDADE sobre QUANTIDADE; retorne arrays vazios se não houver padrões claros.
    **FOCO ESPECIAL**: Para previsões de 'fiftyX', preste atenção especial em 'summary.pinksTo50xAnalysis'. A presença de rosas com mais de 20x ('hasOver20xInPinks: true') é um forte indicador de que um 50x+ está próximo. Use isso em seu 'reasoning'.
    **FOCO ESPECIAL**: Se 'summary.nextPlayColumn' corresponder a uma das 'hotSpots.hotColumns', gere um sinal em 'verticalRepeat'. Este é um sinal de alta prioridade.
    Ajuste a sensibilidade dos sinais ao perfil de risco:
    - Conservador: Exija maior certeza, menos sinais, foque em padrões muito fortes (ex: repetição de casa quente + minuto quente).
    - Moderado: Abordagem padrão e equilibrada.
    - Agressivo: Permita sinais mais especulativos baseados em padrões emergentes, mesmo que a confiança seja 'Média'.

    FORMATO DE SAÍDA JSON OBRIGATÓRIO:
    {
      "predictions": {
        "verticalRepeat": [ { "predictedMinute": ":${currentMinute}", "predictedHouse": "number (próxima casa a pagar)", "temperature": "'Quente'", "reasoning": "string (Ex: 'Repetição vertical na coluna ${summary?.nextPlayColumn}')" } ],
        "hourly": [ { "predictedMinute": ":MM", "predictedHouse": "number", "temperature": "'Quente'|'Morno'", "reasoning": "string" } ],
        "daily": [ { "predictedMinute": "HH:MM", "predictedHouse": "number", "temperature": "'Quente'|'Morno'", "reasoning": "string" } ],
        "fiftyX": [ { "predictedMinute": ":MM", "predictedHouse": "number", "temperature": "'Quente'", "reasoning": "string" } ],
        "grandePague": [ { "predictedMinute": ":MM", "predictedHouse": "number", "temperature": "'Grande Pague'", "reasoning": "string" } ]
      }
    }
    Instruções: Siga RIGOROSAMENTE o formato JSON.`;

    const { data: aiResponse, apiInfo } = await generateAndParseJson(prompt);

    const mapAndAddId = (predictions: any[]): SignalPrediction[] => {
        if (!Array.isArray(predictions)) return [];
        return predictions.map((p: Omit<SignalPrediction, 'id'>): SignalPrediction => ({
            ...p,
            id: crypto.randomUUID()
        }));
    };

    const predictions = aiResponse.predictions || {};

    const data: PredictionAnalysisReturn = {
        predictionVerticalRepeat: mapAndAddId(predictions.verticalRepeat),
        prediction: mapAndAddId(predictions.hourly),
        restOfDayPrediction: mapAndAddId(predictions.daily),
        prediction50x: mapAndAddId(predictions.fiftyX),
        predictionGrandePague: mapAndAddId(predictions.grandePague),
    };

    return { data, apiInfo };
};

export const getStrategyRecommendations = async (plays: Play[], bankroll: Bankroll, summary: Analysis['summary'], hotSpots: Analysis['hotSpots'], learnedPatterns?: LearnedPatterns, risk_profile?: User['risk_profile']): Promise<{ strategies: Strategy[], apiInfo: ApiInfo }> => {
    const last50Plays = plays.slice(-50);
    const learnedKnowledgePrompt = buildLearnedKnowledgePrompt(learnedPatterns);
    const prompt = `
    Você é um especialista em estratégias para o jogo Aviator. Analise os dados fornecidos e crie 2-3 recomendações de estratégia.

    DADOS:
    - Resumo Estatístico: ${JSON.stringify(summary)}
    - Pontos Quentes: ${JSON.stringify(hotSpots)}
    - Banca: ${JSON.stringify(bankroll)}
    - Últimas 50 Jogadas: ${JSON.stringify(last50Plays)}
    - Perfil de Risco do Usuário: ${risk_profile || 'Moderado'}
    ${learnedKnowledgePrompt}

    TAREFA:
    Retorne um objeto JSON com uma chave "recommendations" contendo um array de objetos de estratégia. A primeira deve ser a "Melhor Estratégia" (isBestFit: true).
    Adapte as estratégias ao perfil de risco:
    - Conservador: Foco em segurança. Saídas baixas (ex: 1.5x-1.9x), foco em cobrir apostas e garantir lucro mínimo. Risco "Baixo".
    - Moderado: Equilíbrio entre segurança e lucro. Saídas padrão (ex: 2.0x) e uma segunda aposta para lucros maiores (5x-10x). Risco "Médio".
    - Agressivo: Foco em altos retornos. Saídas mais altas (ex: 3x-5x), com a segunda aposta buscando alvos ousados (>20x). Risco "Alto".

    FORMATO OBRIGATÓRIO:
    {
      "recommendations": [
        {
          "name": "string", "description": "string", "entrySuggestion": "string",
          "betValues": { "mainBet": "number", "secondaryBet": "number|null" },
          "targetMultipliers": { "mainTarget": "number", "secondaryTarget": "number|null" },
          "risk": "'Baixo' | 'Médio' | 'Alto'", "isBestFit": boolean
        }
      ]
    }
    Instruções: Siga RIGOROSAMENTE o formato JSON.
    `;
    const { data: aiResponse, apiInfo } = await generateAndParseJson(prompt);
    return { strategies: aiResponse.recommendations || [], apiInfo };
};

export const getChartsData = async (plays: Play[]): Promise<{ chartsData: ChartData, apiInfo: ApiInfo }> => {
    const { chartsData } = processPlaysLocally(plays);
    return { chartsData, apiInfo: { provider: 'Local', keyIndex: 0 } };
};

export const getGrandePagueStrategy = async (periodPlays: Play[]): Promise<{ strategy: GrandePagueStrategy, apiInfo: ApiInfo }> => {
    const prompt = `
    Você é um estrategista de apostas hiper-focado do Aviator. Você está analisando um período de "Grande Pague", um momento raro de alta lucratividade. Sua tarefa é criar a estratégia PERFEITA de duas apostas para maximizar o lucro durante esta sequência específica de jogadas.

    CONTEXTO:
    - Este é um período de "Grande Pague", o que significa que o algoritmo estava pagando com frequência (muitos multiplicadores roxos/rosas). Estratégias cautelosas padrão podem não se aplicar.
    - Você deve definir uma estratégia com duas apostas concorrentes.

    O HISTÓRICO EXATO DE JOGADA POR JOGADA PARA ESTE PERÍODO:
    ${JSON.stringify(periodPlays)}

    SUA TAREFA:
    Retorne um único objeto JSON com a estratégia de aposta ideal.
    1.  bet1Amount: O valor da primeira aposta. Suponha uma banca de $100 para cálculo, então aposta deve ser uma porcentagem razoável (ex: $1, $2, $5).
    2.  bet1Exit: O multiplicador no qual sacar a primeira aposta. Este deve ser um alvo seguro e consistente (ex: 1.5x, 1.8x, 2.0x) para garantir lucro.
    3.  bet2Amount: O valor da segunda aposta, geralmente menor que a primeira.
    4.  bet2Exit: O multiplicador para a segunda aposta. Esta é a aposta "deixe rolar". Analise o potencial na sequência e escolha um alvo alto, mas realista.
    5.  reasoning: Uma explicação CONCISA (máximo de 25 palavras) do porquê esta estratégia é ideal para esta sequência de jogadas específica. Exemplo: "Garantir lucro na Aposta 1, deixar a Aposta 2 correr para pegar os multiplicadores altos vistos no início do período."

    FORMATO DE SAÍDA OBRIGATÓRIO, SOMENTE JSON:
    {
      "bet1Amount": "number",
      "bet1Exit": "number",
      "bet2Amount": "number",
      "bet2Exit": "number",
      "reasoning": "string"
    }
    `;
    const { data, apiInfo } = await generateAndParseJson(prompt);
    return { strategy: data, apiInfo };
};

export const getHolisticTrainingFeedback = async (playsChunk: Play[], existingPatterns: LearnedPatterns): Promise<{ patterns: LearnedPatterns, summary: string | null, apiInfo: ApiInfo }> => {
    const prompt = `
    Você é um sistema de Treinamento Holístico de IA para o Aviator. Sua tarefa é analisar um novo LOTE de jogadas e extrair NOVO conhecimento com base nele, considerando os padrões já aprendidos.
    Sua resposta DEVE ser um objeto JSON que corresponda ao esquema fornecido. IMPORTANTE: Certifique-se de que todas as strings dentro do JSON usem aspas duplas e que quaisquer aspas duplas internas dentro das strings sejam escapadas com uma barra invertida (\\").

    CONHECIMENTO PRÉ-EXISTENTE (use para contexto, mas não o repita):
    ${JSON.stringify(existingPatterns)}
    
    NOVO LOTE DE DADOS DE TREINAMENTO (analise para encontrar novos padrões):
    ${JSON.stringify(playsChunk.map(p => ({ m: p.multiplier, t: p.time })))}

    SUA TAREFA:
    Analise o NOVO LOTE e identifique novos padrões ou refine os existentes.
    Forneça suas descobertas no formato JSON. Se nenhum novo padrão for encontrado em uma categoria, retorne um array vazio.
    Além disso, forneça um resumo breve da descoberta NOVA mais importante no campo 'learningSummary'.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            learningSummary: {
                type: Type.STRING,
                description: "Um resumo muito breve, de uma única frase, do padrão NOVO mais significativo encontrado neste lote. Exemplo: 'Descobriu-se que após 2 azuis e um roxo, uma rosa é mais provável.'",
            },
            learnedPatterns: {
                type: Type.OBJECT,
                properties: {
                    highValueTriggers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array de strings com 1-3 novos padrões que precedem multiplicadores altos >10x",
                    },
                    streakPatterns: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array de strings com 1-3 novos padrões sobre sequências de cores",
                    },
                    timeBasedPatterns: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array de strings com 1-3 novos padrões de tempo/minuto que se repetem",
                    },
                    generalObservations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array de strings com 1-3 novas observações gerais ou correlações",
                    },
                },
                required: ["highValueTriggers", "streakPatterns", "timeBasedPatterns", "generalObservations"],
            },
        },
        required: ["learningSummary", "learnedPatterns"],
    };
    
    try {
        const { response, keyIndex } = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.3,
                maxOutputTokens: 8192, // Set to max to allow for large pattern descriptions
                thinkingConfig: {
                    thinkingBudget: 2048, // Reserve plenty de tokens para a saída
                },
            },
        });

        const jsonStr = response.text?.trim();
        
        if (!jsonStr) {
            const finishReason = response.candidates?.[0]?.finishReason;
            let reason = "A resposta estava vazia.";
             if (finishReason && finishReason !== 'STOP') {
                reason = `Geração finalizada inesperadamente: ${finishReason}.`;
            }
            throw new Error(`Análise de treinamento da IA não retornou conteúdo. ${reason}`);
        }
        
        const aiResponse = JSON.parse(jsonStr);
        const apiInfo: ApiInfo = { provider: 'Gemini', keyIndex };

        const defaultPatterns: LearnedPatterns = {
            highValueTriggers: [],
            streakPatterns: [],
            timeBasedPatterns: [],
            generalObservations: [],
        };

        return { 
            patterns: aiResponse.learnedPatterns || defaultPatterns, 
            summary: aiResponse.learningSummary || null,
            apiInfo 
        };
    } catch (error) {
        console.error("Error in getHolisticTrainingFeedback:", error);
        if (error instanceof Error && error.message.includes('Análise de treinamento da IA não retornou conteúdo')) {
            throw error;
        }
        throw new Error(`Gemini API call failed during training: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const getModerationFlags = async (posts: { id: string; text: string }[]): Promise<{ data: { flaggedPosts: { postId: string; reason: string }[] }, apiInfo: ApiInfo }> => {
    const prompt = `
    Você é um moderador de conteúdo experiente para uma comunidade online de apostadores. Sua tarefa é analisar a seguinte lista de posts e identificar qualquer conteúdo que viole as regras da comunidade.
    Regras a serem aplicadas:
    1.  **Spam/Propaganda:** Posts que promovem outros serviços, links externos suspeitos, ou são repetitivos.
    2.  **Assédio/Discurso de Ódio:** Ataques pessoais, insultos, conteúdo discriminatório ou ofensivo.
    3.  **Conteúdo Inapropriado:** Linguagem adulta, imagens NSFW, ou tópicos não relacionados ao propósito da comunidade.
    4.  **Informações Falsas/Perigosas:** Conselhos de apostas irresponsáveis ou garantias de lucro.

    Analise os seguintes posts:
    ${JSON.stringify(posts)}

    Retorne um objeto JSON que corresponda estritamente ao esquema fornecido. Para cada post que você sinalizar, inclua o 'postId' e um 'reason' curto e claro para a sinalização. Se nenhum post violar as regras, retorne um array 'flaggedPosts' vazio.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            flaggedPosts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        postId: { type: Type.STRING },
                        reason: { type: Type.STRING, description: "Uma breve explicação do porquê o post foi sinalizado." },
                    },
                    required: ["postId", "reason"],
                },
            },
        },
        required: ["flaggedPosts"],
    };
    
    try {
        const { response, keyIndex } = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.1,
            },
        });

        const jsonStr = response.text?.trim();
        if (!jsonStr) {
             throw new Error("A análise de moderação da IA não retornou conteúdo.");
        }
        const aiResponse = JSON.parse(jsonStr);
        const apiInfo: ApiInfo = { provider: 'Gemini', keyIndex };
        return { data: aiResponse, apiInfo };

    } catch (error) {
        console.error("Error in getModerationFlags:", error);
        throw new Error(`A chamada à API Gemini falhou durante a moderação: ${error instanceof Error ? error.message : String(error)}`);
    }
};