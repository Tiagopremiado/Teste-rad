import type { Play, HouseRanking, HotPinkMinute, GrandePaguePeriod, LearnedPatterns, MarketState, PinkPause, PlayWithId, PurplePressureAnalysis, TechnicalIndicators, PinkPatternAnalysis, PinkPatternOccurrence } from '../types';

const ANALYSIS_COLUMN_COUNT = 7;

export const processPlaysLocally = (plays: Play[]) => {
    if (!plays || plays.length === 0) {
        return {
            summary: { 
                totalPlays: 0, 
                pinkCount: 0, 
                purpleCount: 0, 
                blueCount: 0, 
                playsSinceLastPink: 0, 
                averagePinkInterval: 0, 
                dailyTrend: 'Normal' as 'Pagando' | 'Frio' | 'Normal',
                trendReasoning: '',
                recentPinksAnalysis: '',
                nextSignalPrediction: '',
                pinksSinceLast50x: 0, 
                pinksSinceLast100x: 0,
                pinksSinceLast1000x: 0,
                marketState: 'FRIO' as MarketState,
                marketStatePercentage: 10,
                sessionProfile: 'Conservadora' as const,
                nextPlayColumn: undefined,
                lastPinkMultiplier: null,
                averagePurpleMultiplier: 2.5,
                isMarketPaused: false,
                marketPauseDetails: { current: 0, average: 0, threshold: 25 },
                currentBlueStreak: 0,
                currentPurpleStreak: 0,
                shortTermVolatility: 0,
                pinksTo50xAnalysis: { averagePinks: 0, counts: [], lastCount: 0, analysisText: "", hasOver20xInPinks: false },
                pinksTo100xAnalysis: { averagePinks: 0, counts: [], lastCount: 0, analysisText: "", hasOver50xInPinks: false },
                pinksTo1000xAnalysis: { averagePinks: 0, counts: [], lastCount: 0, analysisText: "" }
            },
            hotSpots: { pinkIntervals: [], hottestHousesAfterPink: [], hottestMinutes: [], repeatingPinkHouses: [], nonRepeatingPinkHouses: [], houseRanking: [], hottestPinkMinutes: [], hottest50xMinutes: [], hottest100xMinutes: [], hottest1000xMinutes: [], repeatingHousesSequence: [], hotColumns: [] },
            chartsData: { colorFrequencyByHour: [], pinkDistributionByHouse: [] },
            grandePague: { occurrencesToday: 0, isActive: false, periods: [], iaAnalysis: '' },
            pinkPauseHistory: [],
            purplePressureAnalysis: { level: 'Baixa', percentage: 0, factors: [] } as PurplePressureAnalysis,
            technicalIndicators: { sma20: [], bollingerUpper: [], bollingerLower: [], rsi: [], aiConfidence: [] },
            pinkPatternAnalysis: {
                doublePink: { isActive: false, isAlerting: false, triggerPlays: [], alertWindow: { start: 2, end: 8 }, countdown: 0, history: [] },
                closeRepetition: { isActive: false, isAlerting: false, triggerPlays: [], alertWindow: { start: 1, end: 7 }, countdown: 0, lastDistance: 0, history: [] },
            }
        };
    }

    const playsWithIds: PlayWithId[] = plays.map((play, index) => ({
        ...play,
        id: `${play.date}-${play.time}-${play.multiplier.toFixed(2)}-${index}`
    }));
    
    let pinkCount = 0, purpleCount = 0, blueCount = 0;
    const pinkIndices: number[] = [];
    const colorFrequencyByHour: { [hour: string]: { Blue: number, Purple: number, Pink: number } } = {};
    const pinkMinutes: number[] = [];
    const pinksByColumn: { [column: number]: { multiplier: number, time: string }[] } = {};
    let lastPinkMultiplier: number | null = null;
    let currentBlueStreak = 0;
    let currentPurpleStreak = 0;

    plays.forEach((play, index) => {
        const hour = play.time.split(':')[0] + ":00";
        if (!colorFrequencyByHour[hour]) colorFrequencyByHour[hour] = { Blue: 0, Purple: 0, Pink: 0 };
        
        const column = (index % ANALYSIS_COLUMN_COUNT) + 1;

        if (play.multiplier >= 10) {
            pinkCount++;
            pinkIndices.push(index);
            colorFrequencyByHour[hour].Pink++;
            pinkMinutes.push(parseInt(play.time.split(':')[1]));
            if (!pinksByColumn[column]) pinksByColumn[column] = [];
            pinksByColumn[column].push({ multiplier: play.multiplier, time: play.time });
            lastPinkMultiplier = play.multiplier;
            currentBlueStreak = 0;
            currentPurpleStreak++;
        } else if (play.multiplier >= 2) {
            purpleCount++;
            colorFrequencyByHour[hour].Purple++;
            currentBlueStreak = 0;
            currentPurpleStreak++;
        } else {
            blueCount++;
            colorFrequencyByHour[hour].Blue++;
            currentBlueStreak++;
            currentPurpleStreak = 0;
        }
    });
    
    const doublePinkHistory: PinkPatternOccurrence[] = [];
    const closeRepetitionHistory: PinkPatternOccurrence[] = [];

    if (pinkIndices.length >= 2) {
        for (let i = 1; i < pinkIndices.length; i++) {
            const currentPinkIndex = pinkIndices[i];
            const prevPinkIndex = pinkIndices[i - 1];
            const distance = currentPinkIndex - prevPinkIndex;

            const occurrence: PinkPatternOccurrence = {
                triggerPlays: [playsWithIds[prevPinkIndex], playsWithIds[currentPinkIndex]],
                outcomePlays: playsWithIds.slice(currentPinkIndex + 1, currentPinkIndex + 1 + 10),
                distance: distance,
            };

            if (distance === 1) {
                doublePinkHistory.push(occurrence);
            }
            if (distance > 1 && distance <= 7) { // Close repetition is NOT distance 1
                closeRepetitionHistory.push(occurrence);
            }
        }
    }


    const pinkPatternAnalysis: PinkPatternAnalysis = {
        doublePink: {
            isActive: false,
            isAlerting: false,
            triggerPlays: [],
            alertWindow: { start: 2, end: 8 },
            countdown: 0,
            history: doublePinkHistory,
        },
        closeRepetition: {
            isActive: false,
            isAlerting: false,
            triggerPlays: [],
            alertWindow: { start: 1, end: 7 },
            countdown: 0,
            lastDistance: 0,
            history: closeRepetitionHistory,
        },
    };

    if (pinkIndices.length >= 2) {
        const lastPinkIndex = pinkIndices[pinkIndices.length - 1];
        const secondLastPinkIndex = pinkIndices[pinkIndices.length - 2];
        const playsSinceLastPink = plays.length - 1 - lastPinkIndex;
        const distance = lastPinkIndex - secondLastPinkIndex;

        // Double Pink Pattern
        if (distance === 1) {
            pinkPatternAnalysis.doublePink.isActive = true;
            pinkPatternAnalysis.doublePink.triggerPlays = [playsWithIds[secondLastPinkIndex], playsWithIds[lastPinkIndex]];
            if (playsSinceLastPink >= pinkPatternAnalysis.doublePink.alertWindow.start && playsSinceLastPink <= pinkPatternAnalysis.doublePink.alertWindow.end) {
                pinkPatternAnalysis.doublePink.isAlerting = true;
                pinkPatternAnalysis.doublePink.countdown = pinkPatternAnalysis.doublePink.alertWindow.end - playsSinceLastPink;
            }
        }

        // Close Repetition Pattern
        if (distance > 1 && distance <= 7) {
            pinkPatternAnalysis.closeRepetition.isActive = true;
            pinkPatternAnalysis.closeRepetition.triggerPlays = [playsWithIds[secondLastPinkIndex], playsWithIds[lastPinkIndex]];
            pinkPatternAnalysis.closeRepetition.lastDistance = distance;
            if (playsSinceLastPink >= pinkPatternAnalysis.closeRepetition.alertWindow.start && playsSinceLastPink <= pinkPatternAnalysis.closeRepetition.alertWindow.end) {
                pinkPatternAnalysis.closeRepetition.isAlerting = true;
                pinkPatternAnalysis.closeRepetition.countdown = pinkPatternAnalysis.closeRepetition.alertWindow.end - playsSinceLastPink;
            }
        }
    }


    const purplePlays = plays.filter(p => p.multiplier >= 2 && p.multiplier < 10);
    const averagePurpleMultiplier = purplePlays.length > 0
        ? purplePlays.reduce((sum, play) => sum + play.multiplier, 0) / purplePlays.length
        : 2.5; // A reasonable default if no purples exist

    const hotColumns = Object.entries(pinksByColumn)
        .filter(([_, pinks]) => pinks.length > 1)
        .map(([column, pinks]) => ({
            column: parseInt(column),
            count: pinks.length,
            lastTime: pinks[pinks.length - 1].time
        }))
        .sort((a, b) => b.count - a.count);

    const pinkIntervals: number[] = [];
    for (let i = 1; i < pinkIndices.length; i++) {
        pinkIntervals.push(pinkIndices[i] - pinkIndices[i-1]);
    }
    
    const averagePinkInterval = pinkIntervals.length > 0 ? pinkIntervals.reduce((a, b) => a + b, 0) / pinkIntervals.length : 0;
    const lastPinkIndex = pinkIndices.length > 0 ? pinkIndices[pinkIndices.length - 1] : -1;
    const playsSinceLastPink = lastPinkIndex !== -1 ? plays.length - 1 - lastPinkIndex : plays.length;

    let nextPlayColumn: number | undefined;

    // --- Calculation for nextPlayColumn based ONLY on the last 50 plays ---
    const playsForSuggestion = plays.slice(-50);
    const lastPinkIndexInSlice = playsForSuggestion.map(p => p.multiplier >= 10).lastIndexOf(true);

    if (lastPinkIndexInSlice !== -1) {
        const playsAfterLastPinkInSlice = playsForSuggestion.slice(lastPinkIndexInSlice + 1);
        const blueCountAfterLastPinkInSlice = playsAfterLastPinkInSlice.filter(p => p.multiplier < 2).length;
        
        // Suggestion is only valid if there are at most 2 blue plays after the last pink
        if (blueCountAfterLastPinkInSlice <= 2) {
            const playsSinceLastPinkInSlice = playsForSuggestion.length - 1 - lastPinkIndexInSlice;
            nextPlayColumn = (playsSinceLastPinkInSlice % ANALYSIS_COLUMN_COUNT) + 1;
        }
    }
    
    // --- High Value Multiplier Analysis ---
    const analyzeHighTier = (tier: number, upperTier?: number) => {
        const tierIndices = plays.reduce((acc, play, index) => {
            if (play.multiplier >= tier && (upperTier ? play.multiplier < upperTier : true)) acc.push(index);
            return acc;
        }, [] as number[]);

        const pinksBetweenTier: number[] = [];
        
        if (tierIndices.length > 1) {
            for (let i = 1; i < tierIndices.length; i++) {
                const start = tierIndices[i-1];
                const end = tierIndices[i];
                const pinksInRange = plays.slice(start + 1, end).filter(p => p.multiplier >= 10).length;
                pinksBetweenTier.push(pinksInRange);
            }
        }
        
        const lastTierIndex = tierIndices.length > 0 ? tierIndices[tierIndices.length - 1] : -1;
        const playsSinceLastTier = lastTierIndex !== -1 ? plays.slice(lastTierIndex + 1) : plays;
        
        const pinksSinceLastTier = playsSinceLastTier.filter(p => p.multiplier >= 10);
        const lastCount = pinksSinceLastTier.length;

        // Check for specific value pinks within the current sequence
        const hasOver20xInPinks = pinksSinceLastTier.some(p => p.multiplier > 20);
        const hasOver50xInPinks = pinksSinceLastTier.some(p => p.multiplier > 50);

        const averagePinks = pinksBetweenTier.length > 0 ? pinksBetweenTier.reduce((a, b) => a + b, 0) / pinksBetweenTier.length : 5; // Default to 5 if no data
        
        return { 
            averagePinks, 
            counts: pinksBetweenTier, 
            lastCount, 
            analysisText: "", 
            hasOver20xInPinks,
            hasOver50xInPinks
        };
    };
    
    const pinksTo50xAnalysis = analyzeHighTier(50, 100);
    const pinksTo100xAnalysis = analyzeHighTier(100, 1000);
    const pinksTo1000xAnalysis = analyzeHighTier(1000);

    const allPinks = plays.filter(p => p.multiplier >= 10);
    const pinksSinceLast50x = (() => {
      const last50xIndex = plays.map(p => p.multiplier >= 50).lastIndexOf(true);
      if (last50xIndex === -1) return allPinks.filter(p => p.multiplier < 50).length;
      return plays.slice(last50xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 50).length;
    })();

    const pinksSinceLast100x = (() => {
      const last100xIndex = plays.map(p => p.multiplier >= 100).lastIndexOf(true);
      if (last100xIndex === -1) return allPinks.filter(p => p.multiplier < 100).length;
      return plays.slice(last100xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 100).length;
    })();
    
    const pinksSinceLast1000x = (() => {
      const last1000xIndex = plays.map(p => p.multiplier >= 1000).lastIndexOf(true);
      if (last1000xIndex === -1) return allPinks.filter(p => p.multiplier < 1000).length;
      return plays.slice(last1000xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 1000).length;
    })();

    // Short-Term Volatility
    const last15PlaysForVolatility = plays.slice(-15);
    let shortTermVolatility = 0;
    if (last15PlaysForVolatility.length > 1) {
        const multipliers = last15PlaysForVolatility.map(p => p.multiplier);
        const mean = multipliers.reduce((a, b) => a + b) / multipliers.length;
        const stdDev = Math.sqrt(multipliers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / multipliers.length);
        // Normalize to a 0-100 score, capping at a reasonable std dev of 10 for a max score
        shortTermVolatility = Math.min(100, stdDev * 10);
    }


    const houseFrequency: { [house: number]: number } = {};
    pinkIntervals.forEach(interval => {
        if (interval >= 1 && interval <= 25) {
            houseFrequency[interval] = (houseFrequency[interval] || 0) + 1;
        }
    });

    const houseRanking: HouseRanking[] = [];
    for (let i = 1; i <= 25; i++) {
        houseRanking.push({ house: i, count: houseFrequency[i] || 0 });
    }
    houseRanking.sort((a, b) => b.count - a.count);
    const hottestHousesAfterPink = houseRanking.slice(0, 5).map(h => h.house);
    
    const repeatingPinkHouses: number[] = [];
    const nonRepeatingPinkHouses: number[] = [];
    const seenHouses = new Set<number>();
    pinkIntervals.forEach(interval => {
        if (seenHouses.has(interval)) {
            repeatingPinkHouses.push(interval);
        } else {
            nonRepeatingPinkHouses.push(interval);
            seenHouses.add(interval);
        }
    });
    
    let repeatingHousesSequence: number[] | undefined;
    if (pinkIntervals.length > 2) {
        const lastInterval = pinkIntervals[pinkIntervals.length - 1];
        if (lastInterval === pinkIntervals[pinkIntervals.length - 2]) {
             const sequence = [lastInterval];
             if (lastInterval > 1) sequence.push(lastInterval - 1);
             if (lastInterval < 25) sequence.push(lastInterval + 1);
             repeatingHousesSequence = sequence;
        }
    }


    const minuteCounts: Record<string, number> = {};
    const fiftyXMinuteCounts: Record<string, number> = {};
    const hundredXMinuteCounts: Record<string, number> = {};
    const thousandXMinuteCounts: Record<string, number> = {};

    plays.forEach(play => {
        const minute = play.time.split(':')[1];
        if (!minute) return;

        if (play.multiplier >= 10) {
            minuteCounts[minute] = (minuteCounts[minute] || 0) + 1;
        }
        if (play.multiplier >= 50) {
            fiftyXMinuteCounts[minute] = (fiftyXMinuteCounts[minute] || 0) + 1;
        }
        if (play.multiplier >= 100) {
            hundredXMinuteCounts[minute] = (hundredXMinuteCounts[minute] || 0) + 1;
        }
        if (play.multiplier >= 1000) {
            thousandXMinuteCounts[minute] = (thousandXMinuteCounts[minute] || 0) + 1;
        }
    });

    const hottestMinutes = Object.keys(minuteCounts).sort((a, b) => minuteCounts[b] - minuteCounts[a]).slice(0, 5).map(m => `:${m}`);
    const hottestPinkMinutes: HotPinkMinute[] = Object.entries(minuteCounts)
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .map(([minute, count]) => ({ minute: `:${minute}`, count }));

    const hottest50xMinutes = Object.keys(fiftyXMinuteCounts).sort((a, b) => fiftyXMinuteCounts[b] - fiftyXMinuteCounts[a]).slice(0, 3).map(m => `:${m}`);
    const hottest100xMinutes = Object.keys(hundredXMinuteCounts).sort((a, b) => hundredXMinuteCounts[b] - hundredXMinuteCounts[a]).slice(0, 3).map(m => `:${m}`);
    const hottest1000xMinutes = Object.keys(thousandXMinuteCounts).sort((a, b) => thousandXMinuteCounts[b] - thousandXMinuteCounts[a]).slice(0, 3).map(m => `:${m}`);

    const chartsData = {
        colorFrequencyByHour: Object.entries(colorFrequencyByHour).map(([hour, counts]) => ({ hour, ...counts })),
        pinkDistributionByHouse: houseRanking,
    };
    
    // Grande Pague Analysis
    let grandePaguePeriods: GrandePaguePeriod[] = [];
    let currentPeriod: GrandePaguePeriod | null = null;
    let nonPinkStreak = 0;
    
    plays.forEach(play => {
        if (play.multiplier >= 2) { // Purple or Pink
            if (!currentPeriod) {
                currentPeriod = { startTime: play.time, endTime: play.time, plays: [play] };
            } else {
                currentPeriod.plays.push(play);
                currentPeriod.endTime = play.time;
            }
            nonPinkStreak = 0;
        } else { // Blue
            nonPinkStreak++;
            if (currentPeriod && nonPinkStreak >= 3) {
                if (currentPeriod.plays.filter(p => p.multiplier >= 10).length >= 1 && currentPeriod.plays.length >= 7) {
                    grandePaguePeriods.push(currentPeriod);
                }
                currentPeriod = null;
            } else if (currentPeriod) {
                 currentPeriod.plays.push(play);
                 currentPeriod.endTime = play.time;
            }
        }
    });
    // Add the last period if it qualifies
    if (currentPeriod && currentPeriod.plays.filter(p => p.multiplier >= 10).length >= 1 && currentPeriod.plays.length >= 7) {
        grandePaguePeriods.push(currentPeriod);
    }
    
    const isActiveGrandePague = currentPeriod !== null && grandePaguePeriods.includes(currentPeriod);

    // Market State analysis
    const ANALYSIS_WINDOW = 24;
    const lastPlays = plays.slice(-ANALYSIS_WINDOW);
    
    let marketScore = 0;

    lastPlays.forEach((play, index) => {
        // A value from 0 (oldest) to 1 (newest) that gives more weight to recent plays
        const recencyFactor = (index + 1) / ANALYSIS_WINDOW; 
        
        if (play.multiplier >= 10) {
            // Pinks have a base score and a recency multiplier
            marketScore += 2.0 * recencyFactor;
        } else if (play.multiplier >= 2) {
            // Purples have a smaller, constant score
            marketScore += 0.4;
        }
    });

    // New thresholds for the new scoring system.
    // Super Quente: > 5.0 (e.g., 2-3 recent pinks, or 1 pink + many purples)
    // Quente: > 3.0 (e.g., 1 recent pink and some purples)
    // Morno: > 1.5 (e.g., a few purples)
    const pinkInLast24 = lastPlays.some(p => p.multiplier >= 10);

    let marketState: MarketState = 'FRIO';
    let marketStatePercentage = 10;
    
    // Super Quente requires a high score AND at least one pink in the window.
    if (marketScore > 5.0 && pinkInLast24) {
        marketState = 'MUITO_QUENTE';
        marketStatePercentage = 95;
    } else if (marketScore > 3.0) {
        marketState = 'QUENTE';
        marketStatePercentage = 75;
    } else if (marketScore > 1.5) {
        marketState = 'MORNO';
        marketStatePercentage = 45;
    } else {
        marketState = 'FRIO';
        marketStatePercentage = 15;
    }

    const avgPauseDuration = averagePinkInterval; 
    const isMarketPaused = playsSinceLastPink > Math.max(25, avgPauseDuration * 1.1);

    // Pink Pause History
    const pinkPauseHistory: PinkPause[] = [];
    const PAUSE_THRESHOLD = 25;
    let pauseStartIndex = -1;

    playsWithIds.forEach((play, index) => {
        if (play.multiplier >= 10) {
            if (pauseStartIndex !== -1) {
                const duration = index - pauseStartIndex;
                if (duration >= PAUSE_THRESHOLD) {
                    const pausePlays = playsWithIds.slice(pauseStartIndex, index);
                    const triggerPlay = playsWithIds[pauseStartIndex - 1];
                    let probableTrigger = "Pausa padrão do mercado.";
                    if (triggerPlay) {
                        if (triggerPlay.multiplier > 50) {
                            probableTrigger = `Após vela alta de ${triggerPlay.multiplier.toFixed(0)}x`;
                        } else {
                            const precedingPinks = playsWithIds.slice(Math.max(0, pauseStartIndex - 15), pauseStartIndex).filter(p => p.multiplier >= 10).length;
                            if (precedingPinks >= 3) {
                                probableTrigger = `Após cluster de ${precedingPinks} rosas.`;
                            }
                        }
                    }

                    pinkPauseHistory.push({
                        id: `pause-${pauseStartIndex}`,
                        duration,
                        startTime: pausePlays[0].time,
                        endTime: pausePlays[pausePlays.length - 1].time,
                        plays: pausePlays,
                        probableTrigger,
                    });
                }
            }
            pauseStartIndex = -1; 
        } else {
            if (pauseStartIndex === -1 && index > 0 && plays[index-1].multiplier >= 10) {
                pauseStartIndex = index;
            }
        }
    });

    const purplePressureAnalysis: PurplePressureAnalysis = (() => {
        let percentage = 0;
        const factors: string[] = [];

        if (currentBlueStreak > 2) {
            const blueFactor = Math.min((currentBlueStreak - 2) * 15, 60);
            percentage += blueFactor;
            factors.push(`${currentBlueStreak} azuis seguidos`);
        }

        if (marketState === 'QUENTE' || marketState === 'MUITO_QUENTE') {
            percentage += 25;
            factors.push("Mercado aquecido");
        } else if (marketState === 'FRIO' && currentBlueStreak > 4) {
             percentage -= 15;
        }

        const lastPlay = plays[plays.length - 1];
        if (lastPlay && lastPlay.multiplier < 1.1) {
            percentage += 20;
            factors.push(`Última vela muito baixa (${lastPlay.multiplier.toFixed(2)}x)`);
        }
        
        const last15Plays = plays.slice(-15);
        const purplesInLast15 = last15Plays.filter(p => p.multiplier >= 2 && p.multiplier < 10).length;
        if (purplesInLast15 > 4) {
            const purpleDensityFactor = (purplesInLast15 - 4) * 8;
            percentage += purpleDensityFactor;
            if(purpleDensityFactor > 0) factors.push("Alta densidade de roxos");
        }

        percentage = Math.max(0, Math.min(100, percentage));

        let level: 'Baixa' | 'Construindo' | 'ALTA' | 'CRÍTICA' = 'Baixa';
        if (percentage >= 90) level = 'CRÍTICA';
        else if (percentage >= 70) level = 'ALTA';
        else if (percentage >= 40) level = 'Construindo';
        
        return { level, percentage, factors };
    })();

    // --- Technical Indicators Calculation ---
    const technicalIndicators: TechnicalIndicators = {
        sma20: [],
        bollingerUpper: [],
        bollingerLower: [],
        rsi: [],
    };

    const multipliers = plays.map(p => p.multiplier);

    // SMA and Bollinger Bands
    const smaPeriod = 20;
    for (let i = 0; i < multipliers.length; i++) {
        if (i < smaPeriod - 1) {
            technicalIndicators.sma20.push(null);
            technicalIndicators.bollingerUpper.push(null);
            technicalIndicators.bollingerLower.push(null);
        } else {
            const window = multipliers.slice(i - smaPeriod + 1, i + 1);
            const sma = window.reduce((sum, val) => sum + val, 0) / smaPeriod;
            technicalIndicators.sma20.push(sma);

            const stdDev = Math.sqrt(window.map(x => Math.pow(x - sma, 2)).reduce((a, b) => a + b) / smaPeriod);
            technicalIndicators.bollingerUpper.push(sma + (stdDev * 2));
            technicalIndicators.bollingerLower.push(sma - (stdDev * 2));
        }
    }

    // RSI
    const rsiPeriod = 14;
    const changes = multipliers.slice(1).map((val, i) => val - multipliers[i]);
    const gains = changes.map(c => (c > 0 ? c : 0));
    const losses = changes.map(c => (c < 0 ? -c : 0));

    let avgGain = gains.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    let avgLoss = losses.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    
    for (let i = 0; i < multipliers.length; i++) {
        if (i < rsiPeriod) {
            technicalIndicators.rsi.push(null);
        } else {
             if (i > rsiPeriod) {
                avgGain = (avgGain * (rsiPeriod - 1) + gains[i - 1]) / rsiPeriod;
                avgLoss = (avgLoss * (rsiPeriod - 1) + losses[i - 1]) / rsiPeriod;
            }
            if (avgLoss === 0) {
                technicalIndicators.rsi.push(100);
            } else {
                const rs = avgGain / avgLoss;
                technicalIndicators.rsi.push(100 - (100 / (1 + rs)));
            }
        }
    }

    // AI Confidence Score
    const aiConfidence: (number | null)[] = [];
    let lastPinkIndexForConfidence = -1;
    let currentBlueStreakForConfidence = 0;
    for (let i = 0; i < plays.length; i++) {
        if (plays[i].multiplier >= 10) lastPinkIndexForConfidence = i;
        currentBlueStreakForConfidence = plays[i].multiplier < 2 ? currentBlueStreakForConfidence + 1 : 0;

        if (i < 20) {
            aiConfidence.push(null);
            continue;
        }

        let score = 50.0;
        const window = plays.slice(i - 49, i + 1);
        const pinksInWindow = window.filter(p => p.multiplier >= 10).length;
        const purplesInWindow = window.filter(p => p.multiplier >= 2 && p.multiplier < 10).length;
        const marketScore = (pinksInWindow * 2.5) + (purplesInWindow * 0.5);
        score += (marketScore - 6) * 2.5;

        const playsSince = lastPinkIndexForConfidence === -1 ? i + 1 : i - lastPinkIndexForConfidence;
        if (playsSince > 25) {
            score -= Math.min((playsSince - 25) * 2, 30);
        }
        
        if (currentBlueStreakForConfidence > 3) {
            score += Math.min((currentBlueStreakForConfidence - 3) * 5, 25);
        }

        const rsiValue = technicalIndicators.rsi[i];
        if (rsiValue !== null) {
            if (rsiValue < 30) score += (30 - rsiValue) * 0.5;
            if (rsiValue > 70) score -= (rsiValue - 70) * 0.5;
        }
        
        aiConfidence.push(Math.max(0, Math.min(100, score)));
    }
    technicalIndicators.aiConfidence = aiConfidence;

    return {
        summary: { 
            totalPlays: plays.length, 
            pinkCount, 
            purpleCount, 
            blueCount, 
            playsSinceLastPink, 
            averagePinkInterval,
            pinksSinceLast50x,
            pinksSinceLast100x,
            pinksSinceLast1000x,
            marketState,
            marketStatePercentage,
            nextPlayColumn,
            lastPinkMultiplier,
            averagePurpleMultiplier,
            isMarketPaused,
            marketPauseDetails: { current: playsSinceLastPink, average: avgPauseDuration, threshold: 25 },
            currentBlueStreak,
            currentPurpleStreak,
            shortTermVolatility,
            pinksTo50xAnalysis,
            pinksTo100xAnalysis,
            pinksTo1000xAnalysis,
        },
        hotSpots: { 
            pinkIntervals, 
            hottestHousesAfterPink, 
            hottestMinutes, 
            repeatingPinkHouses, 
            nonRepeatingPinkHouses, 
            houseRanking, 
            hottestPinkMinutes, 
            hottest50xMinutes, 
            hottest100xMinutes,
            hottest1000xMinutes,
            repeatingHousesSequence,
            hotColumns
        },
        chartsData,
        grandePague: { occurrencesToday: grandePaguePeriods.length, isActive: isActiveGrandePague, periods: grandePaguePeriods, iaAnalysis: '' },
        pinkPauseHistory,
        purplePressureAnalysis,
        technicalIndicators,
        pinkPatternAnalysis,
    };
};

export const buildLearnedKnowledgePrompt = (patterns?: LearnedPatterns): string => {
    if (!patterns || Object.values(patterns).every(arr => arr === undefined || arr.length === 0)) return "";

    const formatSection = (title: string, items?: string[]): string => {
        if (!items || items.length === 0) return "";
        return `\n**${title}**\n- ${items.join('\n- ')}`;
    };

    let prompt = "\n\n--- BASE DE CONHECIMENTO DA IA (Aprendizado Prévio) ---";
    prompt += formatSection("Gatilhos de Alto Valor (>10x):", patterns.highValueTriggers);
    prompt += formatSection("Padrões de Sequência:", patterns.streakPatterns);
    prompt += formatSection("Padrões Baseados em Horário:", patterns.timeBasedPatterns);
    prompt += formatSection("Observações Gerais:", patterns.generalObservations);
    prompt += "\n----------------------------------------------------";
    return prompt;
};