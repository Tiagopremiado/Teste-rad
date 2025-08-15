export interface User {
  id: string;
  display_name: string;
  created_at: string;
  whatsapp: string;
  role?: 'admin' | 'user';
  status: 'active' | 'pending_approval' | 'suspended';
  avatar_url: string;
  cover_photo_url: string;
  bio: string;
  risk_profile: 'Conservador' | 'Moderado' | 'Agressivo';
  registration_pending: boolean;
  affiliate_username?: string;
  followers_count: number;
  following_count: number;
  premium_expiry: string | null; // ISO string for timestamp
  is_lifetime: boolean;
  used_codes: string[];
}

export enum Color {
  Blue = 'Blue',
  Purple = 'Purple',
  Pink = 'Pink',
}

export interface Play {
  multiplier: number;
  date: string;
  time: string;
  color?: Color;
}

export interface PlayWithId extends Play {
  id: string;
}

export interface HouseOccurrence {
  triggerPlay: PlayWithId;
  precursorPlays: PlayWithId[];
  postcursorPlays: PlayWithId[];
}

export interface SelectedHouseDetails {
  houseNumber: number;
  occurrences: HouseOccurrence[];
}

export interface Bankroll {
  initialAmount: number;
  stopWin: number;
  stopLoss: number;
}

export interface BankrollTransaction {
  id: string;
  type: 'Win' | 'Loss' | 'Correction' | 'Start';
  amount: number;
  timestamp: string;
  newBankroll: number;
  notes?: string;
}

export interface IATacticWeights {
    patternHunter: number; // Caçador de Padrões
    hotMarket: number; // Apostador de Mercado Quente
    houseHunter: number; // Caçador de Casas
    hotSignalHunter: number; // Caçador de Sinais Quentes
    technicalAnalysis: number; // Análise Técnica
    automaticTriggers: number; // Gatilhos Automáticos (Pressão)
    extremeMultiplierProximity: number; // Proximidade de Multiplicador Extremo
    shortTermVolatility: number; // Volatilidade de Curto Prazo
    pinkPatternProximity: number; // Proximidade de Padrão Rosa
    ipvHunter: number; // Caçador de IPV (Indicador Preditivo de Virada)
}

export interface BankrollManagement {
  isActive: boolean;
  initialBankroll: number;
  currentBankroll: number;
  stopWinPercentage: number;
  stopLossPercentage: number;
  baseBet: number;
  onWinIncrease: number;
  onLossIncrease: number;
  maxBlueStreakStop: number; 
  minPurpleStreakGo: number; 
  history: BankrollTransaction[];
  managementType: 'ia' | 'manual';
  iaProfile: HunterMode;
  iaTacticWeights: IATacticWeights;
  autoActivateOnPressure: boolean;
  activateDefensiveModeOnPauseRisk?: boolean;
  isDualStrategyActive: boolean;
  consecutiveLosses: number;
  pinkHuntConsecutiveLosses: number;
  pinkHuntMaxLosses: number;
  isSmartPresetActive?: boolean;
}

export interface PinkChaseConfig {
    duration: number;
}

export interface LuxSignalsBotHistoryItem {
  id: string;
  round: number;
  bet1Amount: number;
  target1Multiplier: number;
  bet2Amount?: number | null;
  target2Multiplier?: number | null;
  actualMultiplier: number;
  profit: number;
  outcome: 'Win' | 'Loss';
  timestamp: string;
}

export interface LuxSignalsBotState {
  isActive: boolean;
  initialBankroll: number;
  currentBankroll: number;
  profitTargetPercentage: number;
  stopLossPercentage: number;
  history: LuxSignalsBotHistoryItem[];
  wins: number;
  losses: number;
  sessionStartBankroll: number;
  status: 'idle' | 'running' | 'paused_risk' | 'paused_confidence' | 'stopped_win' | 'stopped_loss';
  // New properties for advanced bot
  baseBetAmount: number;
  strategyMode: 'normal' | 'compounding' | 'recovery';
  lastLossAmount: number;
  currentCompoundBetAmount: number;
  currentCycleProfit: number;
  currentBet: {
    bet1: { amount: number; target: number };
    bet2: { amount: number; target: number };
  };
  apostaFuturaWin: {
    bet1: { amount: number; target: number };
    bet2: { amount: number; target: number };
  };
  apostaFuturaLoss: {
    bet1: { amount: number; target: number };
    bet2: { amount: number; target: number };
  };
}

export interface Strategy {
  name: string;
  description: string;
  entrySuggestion: string;
  betValues: {
    mainBet: number;
    secondaryBet?: number | null;
  };
  targetMultipliers: {
    mainTarget: number;
    secondaryTarget?: number | null;
  };
  risk: 'Baixo' | 'Médio' | 'Alto';
  isBestFit: boolean;
}

export interface ChartData {
   colorFrequencyByHour: { hour: string; Blue: number; Purple: number; Pink: number }[];
   pinkDistributionByHouse: { house: number; count: number }[];
}

export interface HouseRanking {
  house: number;
  count: number;
}

export type HighlightedStat = 
  | 'hottestMinutes' 
  | 'playsSinceLastPink' 
  | 'maxPurpleStreak' 
  | 'lastPurpleStreak' 
  | 'maxPinkStreak' 
  | 'allPinks'
  | 'hottestHouses'
  | 'pinksSince50x'
  | 'pinksSince100x'
  | 'pinksSince1000x'
  | 'pinksTo50x'
  | 'pinksTo100x'
  | 'pinksTo1000x'
  | 'hottest50xMinutes'
  | 'hottest100xMinutes'
  | 'hottest1000xMinutes'
  | 'hotColumns'
  | null;

export interface HotPinkMinute {
    minute: string;
    count: number;
}

export type AutoCollectionStatus = 'idle' | 'running' | 'error';

export type SignalOutcome = 'Win' | 'Loss' | 'Pending';
export type SignalTemperature = 'Quente' | 'Morno' | 'Grande Pague';

export interface SignalPrediction {
  predictedMinute: string; // e.g., ":45"
  predictedHouse: number;
  temperature: SignalTemperature; // 'Quente' for pink, 'Morno' for purple streak
  reasoning: string;
  id: string;
}

export interface Signal {
  prediction: SignalPrediction;
  outcome: SignalOutcome;
  timestamp: string; // ISO string
}

export interface GrandePaguePeriod {
    startTime: string;
    endTime: string;
    plays: Play[];
}

export interface GrandePagueStrategy {
    bet1Amount: number;
    bet1Exit: number;
    bet2Amount: number;
    bet2Exit: number;
    reasoning: string;
}

export interface GrandePagueAnalysis {
  occurrencesToday: number;
  isActive: boolean;
  iaAnalysis: string;
  periods: GrandePaguePeriod[];
}

export interface LearnedPatterns {
    highValueTriggers: string[];
    streakPatterns: string[];
    timeBasedPatterns: string[];
    generalObservations: string[];
    [key: string]: string[] | undefined;
}

export interface TrainingStatus {
    message: string;
    fileName: string;
    processedCount: number;
    totalCount: number;
    isComplete: boolean;
    error: string | null;
}

export interface AILearningProgress {
    totalPlaysAnalyzed: number;
    wins: number;
    losses: number;
}

export type MarketState = 'MUITO_QUENTE' | 'QUENTE' | 'MORNO' | 'FRIO';

export type HunterMode = 'Conservador' | 'Moderado' | 'Elite';

export interface PinkPressureAnalysis {
  level: 'Baixa' | 'Construindo' | 'Eminente' | 'CRÍTICA';
  percentage: number;
  factors: string[];
}

export interface PurplePressureAnalysis {
  level: 'Baixa' | 'Construindo' | 'ALTA' | 'CRÍTICA';
  percentage: number;
  factors: string[];
}

export interface PinkPause {
  id: string;
  duration: number;
  startTime: string;
  endTime: string;
  plays: PlayWithId[];
  probableTrigger: string; 
}

export interface PinkPauseRiskAnalysis {
  level: 'Baixo' | 'Médio' | 'Alto' | 'CRÍTICO';
  percentage: number;
  factors: string[];
}

export interface TechnicalIndicators {
  rsi: (number | null)[];
  sma20: (number | null)[];
  bollingerUpper: (number | null)[];
  bollingerLower: (number | null)[];
  aiConfidence?: (number | null)[];
}

export interface MinuteTrendData {
    minute: number;
    trend: 'up' | 'down' | 'stable';
    latestSma: number;
    detailedSeries: { date: string; count: number }[];
}

export interface PinkPatternOccurrence {
  triggerPlays: PlayWithId[];
  outcomePlays: PlayWithId[];
  distance: number;
}

export interface GenericPatternOccurrence {
  triggerPlays: PlayWithId[];
  outcomePlays: PlayWithId[];
}

export interface PinkPatternState {
  isActive: boolean;
  isAlerting: boolean;
  triggerPlays: PlayWithId[];
  alertWindow: { start: number; end: number };
  countdown: number;
  lastDistance?: number;
  history?: PinkPatternOccurrence[];
}

export interface PinkPatternAnalysis {
  doublePink: PinkPatternState;
  closeRepetition: PinkPatternState;
}

export interface DailyRankedPattern {
  rank: number;
  name: string;
  pattern?: Color[];
  occurrences: number;
  hits: number;
  hitRate: number;
  avgMultiplier: number;
  history?: GenericPatternOccurrence[] | PinkPatternOccurrence[];
}

export interface Analysis {
  summary?: {
    totalPlays: number;
    pinkCount: number;
    purpleCount: number;
    blueCount: number;
    playsSinceLastPink: number;
    averagePinkInterval: number;
    dailyTrend?: 'Pagando' | 'Frio' | 'Normal';
    trendReasoning?: string;
    pinksSinceLast50x: number;
    pinksSinceLast100x: number;
    pinksSinceLast1000x: number;
    recentPinksAnalysis?: string;
    marketState: MarketState;
    marketStatePercentage: number;
    sessionProfile?: 'Conservadora' | 'Agressiva' | 'Instável';
    recentPinkCeiling?: { average: number; max: number; };
    nextPlayColumn?: number;
    averagePurpleMultiplier?: number;
    lastPinkMultiplier?: number | null;
    isMarketPaused?: boolean;
    marketPauseDetails?: { current: number; average: number; threshold: number; };
    currentBlueStreak?: number;
    currentPurpleStreak?: number; // New
    shortTermVolatility?: number; // New
    pinksTo50xAnalysis?: {
        averagePinks: number;
        counts: number[];
        lastCount: number;
        analysisText?: string;
        hasOver20xInPinks: boolean;
    };
    pinksTo100xAnalysis?: {
        averagePinks: number;
        counts: number[];
        lastCount: number;
        analysisText?: string;
        hasOver50xInPinks: boolean;
    };
     pinksTo1000xAnalysis?: {
        averagePinks: number;
        counts: number[];
        lastCount: number;
        analysisText?: string;
    };
    nextSignalPrediction?: string;
  };
  hotSpots?: {
    pinkIntervals: number[];
    hottestHousesAfterPink: number[];
    hottestMinutes: string[];
    hottestPinkMinutes?: HotPinkMinute[];
    hottest50xMinutes?: string[];
    hottest100xMinutes?: string[];
    hottest1000xMinutes?: string[];
    repeatingPinkHouses: number[];
    repeatingHousesSequence?: number[];
    nonRepeatingPinkHouses: number[];
    houseRanking: HouseRanking[];
    hotColumns?: { column: number; count: number; lastTime: string; }[];
  };
  alerts?: string[];
  strategyRecommendations?: Strategy[];
  chartsData?: ChartData;
  prediction?: SignalPrediction[] | null;
  restOfDayPrediction?: SignalPrediction[] | null;
  prediction50x?: SignalPrediction[] | null;
  grandePagueAnalysis?: GrandePagueAnalysis;
  predictionGrandePague?: SignalPrediction[] | null;
  predictionVerticalRepeat?: SignalPrediction[] | null;
  grandePagueStrategy?: GrandePagueStrategy | null;
  learnedPatterns?: LearnedPatterns;
  pinkPauseHistory?: PinkPause[];
  pinkPauseRisk?: PinkPauseRiskAnalysis;
  purplePressureAnalysis?: PurplePressureAnalysis;
  technicalIndicators?: TechnicalIndicators;
  pinkPatternAnalysis?: PinkPatternAnalysis;
  dailyPatternRanking?: DailyRankedPattern[];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SocialComment {
  id: string;
  author_id: string;
  text: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  author_id: string;
  timestamp: string;
  category: 'Vitória' | 'Estratégia' | 'Dúvida' | 'Sugestão';
  text: string;
  imageUrl?: string;
  likedBy: string[];
  comments: SocialComment[];
}

export interface WeeklyChallenge {
  title: string;
  description: string;
  lastWinnerId?: string; // UID of the last winner
}

export interface ExclusiveContent {
  title: string;
  type: 'video' | 'pdf';
  url: string;
}

export type SuggestionStatus = 'Nova' | 'Em Análise' | 'Implementada' | 'Rejeitada';

export interface Suggestion {
  id: string;
  author_id: string;
  text: string;
  timestamp: string;
  upvotes: string[]; // array of user uids
  status: SuggestionStatus;
}

export type LiveSignalLevel = 'Gold' | 'FollowUp' | 'Opportunity';

export interface LiveAISignal {
  target: string;
  confidence: 'Alta' | 'Média' | 'Baixa';
  trigger: string;
  level: LiveSignalLevel;
}

export interface LiveSignalHistoryItem {
  id: string;
  signal: LiveAISignal;
  timestamp: string;
  outcome: SignalOutcome;
  triggerPlay: Play;
  resultPlay: Play | null;
  contextPlays: Play[];
}

export interface AIBotHistoryItem {
    id: string;
    timestamp: string;
    plan: {
        bet1: { amount: number; target: number; };
        bet2: { amount: number; target: number; };
    };
    resultPlay: Play;
    profit: number;
    reason: string;
    confidenceScore: number;
    context: {
        marketState: MarketState;
        isMarketPaused: boolean;
        playsSinceLastPink: number;
        last5Plays: Play[];
        pinkPressure: PinkPressureAnalysis | null;
        purplePressure: PurplePressureAnalysis | null;
        pinkPauseRisk: PinkPauseRiskAnalysis | null;
        pinkPatternStatus: string;
    }
}


export interface AIBotLifetimeStats {
    wins: number;
    losses: number;
    totalProfit: number;
}

export interface WinningPatternResult {
    pattern: Color[];
    winCount: number;
    totalCount: number;
    avgMultiplier: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    lastOccurrencePlays: Play[];
}

export interface LosingPatternResult {
    pattern: Color[];
    lossCount: number;
    totalCount: number;
}

export interface HotTriggerResult {
    multiplierRange: string;
    count: number;
}


export type TriggerHighlight = {
    plays: PlayWithId[];
    type: 'hot-minute' | 'grande-pague' | 'streak' | 'pattern';
} | null;

export interface Notification {
  id: string;
  timestamp: string;
  read: boolean;
  type: 'pattern' | 'signal' | 'hot_minute' | 'info';
  title: string;
  message: string;
}

export interface AnalysisCountdowns {
  summary: number;
  prediction: number;
  strategy: number;
}

export interface ImportFeedback {
    newPatternsCount: number;
    totalPatternsCount: number;
    delta: {
        [key in keyof LearnedPatterns]: number;
    };
}


export interface TacticScore {
    score: number;
    reason: string;
    target: number;
    weight: number;
    weightedScore: number;
}

export interface ConfidenceReport {
    finalScore: number;
    scores: Partial<Record<keyof IATacticWeights, TacticScore>>;
}

export interface CopilotSuggestion {
    id: string;
    type: 'preset' | 'tactic';
    title: string;
    message: string;
    action: {
        label: string;
        targetPreset?: HunterMode;
        targetTactic?: {
            key: keyof IATacticWeights;
            recommendedWeight: number;
        };
    };
}

export interface ApiInfo {
  provider: 'Gemini' | 'Local';
  keyIndex: number;
}

export interface BetResult {
  didWin: boolean;
  withdrawnAt: number;
}

export interface RoundResult {
  play: Play;
  bets: {
    bet1: { amount: number; target: number; };
    bet2: { amount: number; target: number; };
  };
  result: {
    bet1: BetResult | null;
    bet2: BetResult | null;
  };
  profit: number;
}

export interface BacktestResult {
  netProfit: number;
  winRate: number;
  wins: number;
  losses: number;
  totalEntries: number;
  strategyName: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'user' | 'post' | 'notification_mass' | 'manual_signal';
  targetId: string; // Can be user UID, post ID, or group name for mass notifications
  details: string;
}

export interface MassNotificationEntry {
  id: string;
  timestamp: string;
  targetGroup: 'all' | 'premium' | 'free';
  title: string;
  message: string;
}

export interface AdminSignal {
  id: string;
  type: 'HighMultiplier' | 'BigPayout' | 'RiskAlert';
  title: string;
  message: string;
  timestamp: string;
  sentBy: string; // Admin's display_name
}

export interface AdminSignalLogEntry extends AdminSignal {
    withdrawn: boolean;
    withdrawnTimestamp?: string;
}

export interface CommunityHighlight {
    type: 'legend' | 'top_profile';
    userId: string | null;
}

export interface AdminNotification {
  id: string;
  type: 'new_user' | 'expiring_plan' | 'new_post' | 'new_suggestion';
  message: string;
  timestamp: string;
  read: boolean;
  targetId: string; // user.id, post.id, etc.
}

export interface AdminNotificationSettings {
  newUser: boolean;
  expiringPlans: boolean;
  newPost: boolean;
  newSuggestion: boolean;
}