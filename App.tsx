import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePremiumAccess } from './hooks/usePremiumAccess';
import { useAviatorData } from './hooks/useAviatorData';
import { useSocialData } from './hooks/useSocialData';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ErrorDisplay from './components/ErrorDisplay';
import ImageAnnotationModal from './components/ImageAnnotationModal';
import DataInputHub from './components/DataInputHub';
import PremiumModal from './components/PremiumModal';
import type { Rect, User, Notification, AuditLogEntry } from './types';
import WhatsAppButton from './components/WhatsAppButton';
import PatternChaserPanel from './components/PatternChaserPanel';
import ProfileManager from './components/ProfileManager';
import SocialClub from './components/SocialClub';
import HelpModal from './components/HelpModal';
import { AdminDashboard } from './components/AdminDashboard';
import NotificationModal from './components/NotificationModal';
import AdminSignalBanner from './components/AdminSignalBanner';
import AffiliateRegistrationModal from './components/AffiliateRegistrationModal';
import PendingApprovalModal from './components/PendingApprovalModal';
import PremiumWarningModal from './components/PremiumWarningModal';
import ToastContainer from './components/ToastContainer';
import { supabase } from './services/supabase';


const App: React.FC = () => {
  const { 
    currentProfile, 
    profiles, 
    selectProfile, 
    createProfile, 
    deleteProfile, 
    logout,
    updateProfile,
    grantPremium,
    revokePremium,
    submitAffiliateUsername,
    activatePremium,
    isPremiumLoading,
    premiumError,
  } = useAuth();
  
  const {
      posts,
      suggestions,
      userMap,
      addPost,
      deletePost,
      likePost,
      commentOnPost,
      addSuggestion,
      upvoteSuggestion,
      updateSuggestion,
      followingMap,
      toggleFollow,
  } = useSocialData(currentProfile, profiles);

  const [activeView, setActiveView] = useState<'dashboard' | 'social' | 'admin'>('dashboard');
  const [isPatternChaserVisible, setIsPatternChaserVisible] = useState(true);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [sessionEndContext, setSessionEndContext] = useState<any | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const [isPremiumWarningOpen, setIsPremiumWarningOpen] = useState(false);
  const [premiumModalMode, setPremiumModalMode] = useState<'default' | 'expired'>('default');

  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);
  const shownToastIds = useRef(new Set<string>());


  const {
      isPremium,
      expiryTimestamp,
  } = usePremiumAccess(currentProfile);
  
  useEffect(() => {
    if (!currentProfile) return;

    const wasPremiumKey = `was_premium_${currentProfile.id}`;
    const seenExpiredKey = `has_seen_expired_modal_${currentProfile.id}`;
    
    if (isPremium) {
        localStorage.setItem(wasPremiumKey, 'true');
    } else {
        const wasPremium = localStorage.getItem(wasPremiumKey) === 'true';
        const hasSeenExpiredForThisTimestamp = localStorage.getItem(seenExpiredKey) === String(expiryTimestamp);

        if (wasPremium && !hasSeenExpiredForThisTimestamp) {
            setPremiumModalMode('expired');
            setIsPremiumModalOpen(true);
            localStorage.setItem(seenExpiredKey, String(expiryTimestamp));
            localStorage.removeItem(wasPremiumKey);
        }
    }
    
    if (expiryTimestamp && expiryTimestamp !== Infinity) {
        const now = Date.now();
        const timeLeft = expiryTimestamp - now;
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        
        if (timeLeft > 0 && timeLeft <= threeDays) {
            const dismissed = sessionStorage.getItem('dismissed_premium_warning');
            if (!dismissed) {
                setIsPremiumWarningOpen(true);
            }
        }
    }
  }, [currentProfile, isPremium, expiryTimestamp]);

  
  const {
    error,
    analysis,
    localAnalysis,
    historicalData,
    clearData,
    isProcessing,
    handleFileUpload,
    handlePastedText,
    handleImageUpload, 
    dismissError, 
    
    isSummaryLoading,
    isStrategyLoading,
    isChartLoading,
    isPredictionLoading,

    isGrandePagueStrategyLoading,
    isTraining,
    trainingStatus,
    aiLearningProgress,
    aiBotLifetimeStats,
    updateAIBotLifetimeStats,
    lastApiCallInfo,
    aiBotHistory,
    addAIBotHistoryItem,
    handleRefineKnowledge,
    latestLearnings,

    handleAnalyzeSummary,
    handleAnalyzePredictions,
    handleAnalyzeStrategies,
    handleAnalyzeCharts,
    handleAnalyzeGrandePagueStrategy,
    handleHolisticTraining,
    handlePredictionFeedback,
    signalHistory,
    
    handleBackup,
    handleRestore,
    lastBackupExists,
    handleRestoreLastBackup,
    isAlarmMuted,
    toggleAlarmMute,

    highlightedGrandePaguePeriod,
    lastAnalysisHash,

    setError,
    autoCollectionStatus,
    collectionCountdown,
    autoCollectionError,
    toggleAutoCollection,
    isCollecting,
    collectionStats,
    isLiveSignalActive,
    toggleLiveSignal,
    liveSignalHistory,
    bankrollManagement,
    updateBankrollManagement,
    resetBankrollSession,
    addBankrollTransaction,
    addBankrollFunds,
    hunterMode,
    updateHunterMode,
    handleLearnedPatternsUpload,
    isAutoTraining,
    autoTrainingProgress,
    autoTrainingTriggerCount,
    isPatternHunterModeActive,
    togglePatternHunterMode,
    winningPatterns,
    losingPatterns,
    setFoundPatterns,
    isHouseHunterModeActive,
    toggleHouseHunterMode,
    currentTargetHouse,
    pinkChaseConfig,
    updatePinkChaseConfig,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    analysisCountdowns,
    addNotification,
    pinkPressureAnalysis,
    pinkPauseRisk,
    isAutoAnalysisPaused,
    toggleAutoAnalysis,
    purplePressureAnalysis,
    pinkPatternAnalysis,
    importFeedback,
    dismissImportFeedback,
    alertingPanels,
    adminSignal,
    dismissAdminSignal,
    luxSignalsBot,
    updateLuxSignalsBot,
    startLuxSignalsBot,
    stopLuxSignalsBot,
  } = useAviatorData(currentProfile, isPremium);

  useEffect(() => {
    const newNotifications = notifications.filter(n => !shownToastIds.current.has(n.id));

    if (newNotifications.length > 0) {
        setVisibleToasts(prevToasts => [...newNotifications.reverse(), ...prevToasts].slice(0, 5));
        newNotifications.forEach(n => shownToastIds.current.add(n.id));
    }
  }, [notifications]);

  const handleToastDismiss = (id: string) => {
    setVisibleToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  const [annotationFile, setAnnotationFile] = useState<File | null>(null);
  const [isDataInputModalOpen, setIsDataInputModalOpen] = useState(false);
  
  const handleAnnotationComplete = (file: File, selections?: Rect[]) => {
      handleImageUpload(file, selections);
      setAnnotationFile(null);
  };
  
  const handleAnnotationCancel = () => {
      setAnnotationFile(null);
  };

  const closeDataInputModal = () => setIsDataInputModalOpen(false);
  
  const hasCoreAnalysis = !!analysis.summary;

  const isApiLoading = isProcessing || isSummaryLoading || isStrategyLoading || isPredictionLoading || isGrandePagueStrategyLoading || isTraining;
  
  const togglePatternChaserVisibility = React.useCallback(() => setIsPatternChaserVisible(prev => !prev), []);
  
  const showPremiumModal = () => {
    setPremiumModalMode('default');
    setIsPremiumModalOpen(true);
  };
  
  const hidePremiumModal = () => {
    setIsPremiumModalOpen(false);
    setTimeout(() => setPremiumModalMode('default'), 300);
  };

  const handleViewChange = (view: 'dashboard' | 'social' | 'admin') => {
    if (view === 'social' && !isPremium) {
      showPremiumModal();
    } else {
      setActiveView(view);
    }
  };
  
  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);

  const handleShareWin = (sessionData: any) => {
    const profit = sessionData?.profitOrLoss ?? 0;
    const postData = {
        text: `META ATINGIDA! 🔥\n\nConsegui um lucro de R$ ${profit.toFixed(2)} com a ajuda do Co-Piloto IA. Que ferramenta incrível!\n\n#RadarAviator #Vitoria #Aviator`,
        category: 'Vitória' as const,
    };
    localStorage.setItem('SHARED_POST_DATA_KEY', JSON.stringify(postData));
    
    setSessionEndContext(sessionData);
    setActiveView('social');
  };

  const handleReturnFromShare = () => {
    setActiveView('dashboard');
  };

  const clearSessionEndContext = () => {
    setSessionEndContext(null);
  };
  
  const sendNotificationToUser = async (uid: string, title: string, message: string): Promise<boolean> => {
      try {
          const newNotification: Omit<Notification, 'id'> = {
              type: 'info',
              title: `Mensagem do Admin: ${title}`,
              message,
              timestamp: new Date().toISOString(),
              read: false,
          };
          const { error } = await supabase.from('notifications').insert([{ ...newNotification, user_id: uid, id: crypto.randomUUID() }]);
          if (error) throw error;
          return true;
      } catch (e) {
          console.error("Failed to send notification:", e);
          return false;
      }
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    setSelectedNotification(notification);
  };
  
  const handleRemindLater = () => {
    sessionStorage.setItem('dismissed_premium_warning', 'true');
    setIsPremiumWarningOpen(false);
  };

  const handleRenewFromWarning = () => {
    setIsPremiumWarningOpen(false);
    showPremiumModal();
  };


  if (!currentProfile) {
    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern z-0 opacity-50"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0"></div>
            <ProfileManager 
                profiles={profiles}
                onSelectProfile={selectProfile}
                onCreateProfile={createProfile}
                onDeleteProfile={deleteProfile}
            />
        </div>
    );
  }
  
  if (currentProfile.registration_pending) {
    return (
      <AffiliateRegistrationModal
        onSubmitUsername={(username) => submitAffiliateUsername(currentProfile.id, username)}
        affiliateLink="https://sortenabet.bet.br?ref=92362b811f5e"
      />
    );
  }

  if (activeView === 'admin' && currentProfile.role === 'admin') {
    return (
        <AdminDashboard 
            allUsers={profiles}
            currentUser={currentProfile}
            onExit={() => setActiveView('dashboard')}
            updateProfile={updateProfile}
            deleteProfile={deleteProfile}
            grantPremium={grantPremium}
            revokePremium={revokePremium}
            allPosts={posts}
            deletePost={deletePost}
            userMap={userMap}
            sendNotification={sendNotificationToUser}
            suggestions={suggestions}
            updateSuggestion={updateSuggestion}
        />
    );
  }
  
  const isPendingApproval = !currentProfile.registration_pending && currentProfile.status === 'pending_approval';

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans">
       <ToastContainer toasts={visibleToasts} onDismiss={handleToastDismiss} />
       {isPendingApproval && (
           <PendingApprovalModal onReturnToLogin={logout} />
       )}
       <AdminSignalBanner signal={adminSignal} onDismiss={dismissAdminSignal} />
       <HelpModal open={isHelpModalOpen} onClose={closeHelpModal} />
       <PremiumWarningModal
            open={isPremiumWarningOpen}
            onClose={handleRemindLater}
            onRenew={handleRenewFromWarning}
            expiryTimestamp={expiryTimestamp || 0}
        />
       <PremiumModal
        open={isPremiumModalOpen}
        onClose={hidePremiumModal}
        onActivate={activatePremium}
        isLoading={isPremiumLoading}
        error={premiumError}
        mode={premiumModalMode}
       />
       <NotificationModal notification={selectedNotification} onClose={() => setSelectedNotification(null)} />
      
      {activeView === 'dashboard' && (
          <PatternChaserPanel
            isVisible={isPatternChaserVisible}
            localAnalysis={localAnalysis}
            historicalDataLength={historicalData.length}
            currentTargetHouse={currentTargetHouse}
            pinkPatternAnalysis={pinkPatternAnalysis}
            isAlerting={alertingPanels.patternChaser}
          />
      )}
      
      {isDataInputModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start pt-20 z-50 p-4" 
          onClick={closeDataInputModal}
        >
            <div 
              className="bg-gray-900 border border-lime-500/50 rounded-xl shadow-2xl shadow-lime-500/20 max-w-2xl w-full animate-fade-in-up p-6" 
              onClick={e => e.stopPropagation()}
            >
                <DataInputHub 
                    onFileUploaded={(file) => { handleFileUpload(file); closeDataInputModal(); }}
                    onTextPasted={(text) => { handlePastedText(text); closeDataInputModal(); }}
                    onImageUploaded={(file) => { setAnnotationFile(file); closeDataInputModal(); }}
                    isLoading={isProcessing}
                    onReset={() => { clearData(); closeDataInputModal(); }}
                    hasData={historicalData.length > 0}
                    onBackup={() => { handleBackup(); closeDataInputModal(); }}
                    onRestore={(file) => { handleRestore(file); closeDataInputModal(); }}
                    onRestoreLast={() => { handleRestoreLastBackup(); closeDataInputModal(); }}
                    lastBackupExists={lastBackupExists}
                    onTrainHolistic={(file) => { handleHolisticTraining(file); closeDataInputModal(); }}
                    trainingStatus={trainingStatus}
                    isTraining={isTraining}
                    hasCoreAnalysis={hasCoreAnalysis}
                    isAdmin={currentProfile.role === 'admin'}
                    autoCollection={{
                        status: autoCollectionStatus,
                        countdown: collectionCountdown,
                        error: autoCollectionError,
                        isCollecting: isCollecting,
                        stats: collectionStats,
                        toggle: toggleAutoCollection,
                    }}
                />
            </div>
        </div>
      )}

      {annotationFile && (
          <ImageAnnotationModal 
              imageFile={annotationFile}
              onAnalyze={handleAnnotationComplete}
              onClose={handleAnnotationCancel}
          />
      )}

      <Header 
        user={currentProfile} 
        onLogout={logout} 
        onOpenDataInput={() => setIsDataInputModalOpen(true)}
        onOpenPremiumModal={showPremiumModal}
        isCollecting={isCollecting}
        autoCollectionStatus={autoCollectionStatus}
        onOpenAdminLogin={() => {}} // Admin login is handled by profile system now
        isApiLoading={isApiLoading}
        lastApiCall={lastApiCallInfo}
        isPatternChaserVisible={isPatternChaserVisible}
        onTogglePatternChaser={togglePatternChaserVisibility}
        isPremium={isPremium}
        expiryTimestamp={expiryTimestamp}
        activeView={activeView}
        onViewChange={handleViewChange}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        clearAllNotifications={clearAllNotifications}
        isAutoAnalysisPaused={isAutoAnalysisPaused}
        onToggleAutoAnalysis={toggleAutoAnalysis}
        onOpenHelpModal={openHelpModal}
        localAnalysis={localAnalysis}
      />
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'dashboard' ? (
          <>
            {error && <ErrorDisplay message={error} onClear={clearData} onDismiss={dismissError}/>}
            
            {historicalData.length > 0 ? (
              <Dashboard 
                analysis={analysis}
                localAnalysis={localAnalysis}
                historicalData={historicalData}
                user={currentProfile}
                isProcessing={isProcessing}
                loadingStates={{
                    summary: isSummaryLoading,
                    strategy: isStrategyLoading,
                    chart: isChartLoading,
                    prediction: isPredictionLoading
                }}
                analysisHandlers={{
                    summary: handleAnalyzeSummary,
                    prediction: handleAnalyzePredictions,
                    strategy: handleAnalyzeStrategies,
                    chart: handleAnalyzeCharts,
                    analyzeGrandePagueStrategy: handleAnalyzeGrandePagueStrategy,
                    toggleAutoCollection: toggleAutoCollection,
                    clearCache: clearData,
                }}
                predictionHandlers={{
                    feedback: handlePredictionFeedback
                }}
                alarmHandlers={{
                    isMuted: isAlarmMuted,
                    toggleMute: toggleAlarmMute
                }}
                signalHistory={signalHistory}
                liveSignalHistory={liveSignalHistory}
                highlightedGrandePaguePeriod={highlightedGrandePaguePeriod}
                lastAnalysisHash={lastAnalysisHash}
                aiLearningProgress={aiLearningProgress}
                aiBotLifetimeStats={aiBotLifetimeStats}
                updateAIBotLifetimeStats={updateAIBotLifetimeStats}
                aiBotHistory={aiBotHistory}
                addAIBotHistoryItem={addAIBotHistoryItem}
                handleRefineKnowledge={handleRefineKnowledge}
                lastApiCallInfo={lastApiCallInfo}
                latestLearnings={latestLearnings}
                autoCollection={{
                    status: autoCollectionStatus,
                    countdown: collectionCountdown,
                    error: autoCollectionError,
                    isCollecting: isCollecting,
                    stats: collectionStats,
                }}
                isLiveSignalActive={isLiveSignalActive}
                toggleLiveSignal={toggleLiveSignal}
                hunterMode={hunterMode}
                updateHunterMode={updateHunterMode}
                bankrollManagement={{
                    state: bankrollManagement,
                    update: updateBankrollManagement,
                    reset: resetBankrollSession,
                    addTransaction: addBankrollTransaction,
                    addFunds: addBankrollFunds,
                }}
                isPremium={isPremium}
                showPremiumModal={showPremiumModal}
                isTraining={isTraining}
                trainingStatus={trainingStatus}
                handleHolisticTraining={handleHolisticTraining}
                learnedPatterns={analysis.learnedPatterns}
                handleLearnedPatternsUpload={handleLearnedPatternsUpload}
                isAutoTraining={isAutoTraining}
                autoTrainingProgress={autoTrainingProgress}
                autoTrainingTriggerCount={autoTrainingTriggerCount}
                isPatternHunterModeActive={isPatternHunterModeActive}
                togglePatternHunterMode={togglePatternHunterMode}
                winningPatterns={winningPatterns}
                losingPatterns={losingPatterns}
                setFoundPatterns={setFoundPatterns}
                isHouseHunterModeActive={isHouseHunterModeActive}
                toggleHouseHunterMode={toggleHouseHunterMode}
                currentTargetHouse={currentTargetHouse}
                pinkChaseConfig={pinkChaseConfig}
                updatePinkChaseConfig={updatePinkChaseConfig}
                analysisCountdowns={analysisCountdowns}
                pinkPressureAnalysis={pinkPressureAnalysis}
                pinkPauseRisk={pinkPauseRisk}
                purplePressureAnalysis={purplePressureAnalysis}
                pinkPatternAnalysis={pinkPatternAnalysis}
                addNotification={addNotification}
                importFeedback={importFeedback}
                dismissImportFeedback={dismissImportFeedback}
                onShareWin={handleShareWin}
                sessionEndContext={sessionEndContext}
                clearSessionEndContext={clearSessionEndContext}
                alertingPanels={alertingPanels}
                luxSignalsBot={luxSignalsBot}
                updateLuxSignalsBot={updateLuxSignalsBot}
                startLuxSignalsBot={startLuxSignalsBot}
                stopLuxSignalsBot={stopLuxSignalsBot}
              />
            ) : (
                 <div className="text-center py-20 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                    <div className="text-6xl mb-4" role="img" aria-label="avião">✈️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Radar Aviator</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Para começar, adicione um histórico de jogadas clicando em "Adicionar Dados" acima.
                    </p>
                </div>
            )}
          </>
        ) : (
          <SocialClub
            currentUser={currentProfile}
            updateUserProfile={(updates) => updateProfile(currentProfile.id, updates)}
            canReturnFromShare={sessionEndContext !== null}
            onReturnFromShare={handleReturnFromShare}
            clearSessionEndContext={clearSessionEndContext}
            posts={posts}
            suggestions={suggestions}
            userMap={userMap}
            addPost={addPost}
            likePost={likePost}
            commentOnPost={commentOnPost}
            addSuggestion={addSuggestion}
            upvoteSuggestion={upvoteSuggestion}
            followingMap={followingMap}
            toggleFollow={toggleFollow}
          />
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default App;