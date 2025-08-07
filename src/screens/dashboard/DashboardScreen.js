import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import content components
import WorkContent from '../../components/WorkContent';
import DelayContent from '../../components/DelayContent';
import IdleContent from '../../components/IdleContent';
import MTContent from '../../components/MTContent';
import GanttChartModal from '../../components/GanttChartModal';

// Import services
import apiService from '../../services/ApiService';
import ActivityHistoryService from '../../services/ActivityHistoryService';
import sqliteService from '../../services/SQLiteService';

const DashboardScreen = ({route, navigation}) => {
  // data dari LoginScreen
  const {
    employee,
    sessionData,
    selectedAction,
    formData,
    currentTimer,
    shiftType,
  } = route?.params || {};

  // State untuk tab navigation
  const [activeTab, setActiveTab] = useState('work');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);

  // Gantt chart modal state
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // Timer states
  const [sessionTimer, setSessionTimer] = useState(currentTimer || '00:00:00');
  const timerIntervalRef = useRef(null);
  const timerSecondsRef = useRef(0);

  // Global Activity Timer State
  const [globalActivity, setGlobalActivity] = useState({
    isActive: false,
    activityName: '',
    activityCode: '',
    sourceTab: '',
    startTime: null,
    duration: '00:00:00',
    seconds: 0,
    isSaved: false, // Flag to prevent double save
  });

  const globalActivityRef = useRef(null);

  // Enhanced global state with shift information
  const [globalData, setGlobalData] = useState({
    // Data dari login
    selectedAction: selectedAction || 'SHIFT CHANGE',
    formData: formData || {},
    currentTimer: sessionTimer,
    employee: employee || {},
    sessionData: sessionData || {},

    // NEW: Shift information
    shiftType: shiftType || 'DAY',
    shiftLabel: formData?.shiftLabel || 'Day Shift',
    shiftTime: formData?.shiftTime || '06:00 - 18:00',

    // Session info
    sessionId: null,
    documentNumber: sessionData?.documentNumber || '',

    // Data dashboard
    hmAwal: '',
    hmAkhir: '',
    isHmAwalSet: false,

    // Work data
    workData: {
      loads: 0,
      productivity: '0 bcm/h',
      hours: '0.00',
    },

    // Dashboard info
    welcomeId: employee?.EMP_ID || formData?.id || '18971',
    welcomeName: employee?.NAME || 'Operator',
    status: selectedAction || 'SHIFT CHANGE',
  });

  // Real-time date/time state
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: '',
  });

  // Sync status state
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    isSyncing: false,
    pendingSync: 0,
  });

  // Modal states
  const [showHmAwalModal, setShowHmAwalModal] = useState(true);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [hmAkhirShift, setHmAkhirShift] = useState('');

  const parseTimerToSeconds = timeString => {
    if (!timeString || typeof timeString !== 'string') return 0;

    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  useEffect(() => {
    const initializeSQLite = async () => {
      try {
        await sqliteService.initialize();
        console.log('✅ SQLite initialized successfully in Dashboard');
      } catch (error) {
        console.error('❌ Failed to initialize SQLite:', error);
      }
    };

    const updateSyncStatus = async () => {
      const status = await sqliteService.getSyncStatus();
      setSyncStatus(status);
    };

    // Initialize
    initializeSQLite();
    updateSyncStatus();

    // Update sync status every 30 seconds
    const syncInterval = setInterval(updateSyncStatus, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  // FIX: Separate dependencies instead of boolean expression
  useEffect(() => {
    if (selectedAction && currentTimer) {
      console.log('🔄 Restoring global activity from Login...');
      console.log(`📝 Action: ${selectedAction}, Timer: ${currentTimer}`);

      const currentSeconds = parseTimerToSeconds(currentTimer);

      // Calculate timer dari Login
      const loginStartTime = new Date(Date.now() - currentSeconds * 1000);

      console.log(`⏰ Calculated start time: ${loginStartTime.toISOString()}`);
      console.log(`⏱️ Current seconds: ${currentSeconds}`);

      // Set global activity state dengan data dari Login
      setGlobalActivity({
        isActive: true,
        activityName: selectedAction,
        activityCode: selectedAction,
        sourceTab: 'initial', // Nama kategori untuk activity dari Login
        startTime: loginStartTime,
        duration: currentTimer,
        seconds: currentSeconds,
      });

      // Start interval timer untuk melanjutkan timer
      if (globalActivityRef.current) {
        clearInterval(globalActivityRef.current);
      }

      globalActivityRef.current = setInterval(() => {
        setGlobalActivity(prev => {
          if (!prev.isActive) return prev;

          const newSeconds = prev.seconds + 1;
          const hours = Math.floor(newSeconds / 3600);
          const minutes = Math.floor((newSeconds % 3600) / 60);
          const secs = newSeconds % 60;
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          return {
            ...prev,
            seconds: newSeconds,
            duration: formattedTime,
          };
        });
      }, 1000);

      updateGlobalData({
        status: selectedAction, // Update status dari Login
      });

      console.log(
        `✅ Global activity restored: ${selectedAction} (${currentTimer})`,
      );
    }
  }, [selectedAction, currentTimer]); // FIX: Separated dependencies

  // ============ SHIFT MANAGEMENT ============

  useEffect(() => {
    // Check if within shift hours and log shift info
    const isWithinShift = apiService.isWithinShift(globalData.shiftType);
    const progress = apiService.getShiftProgress(globalData.shiftType);

    console.log(
      `🕐 Shift Info: ${globalData.shiftType} (${globalData.shiftTime})`,
    );
    console.log(`🕐 Within shift: ${isWithinShift}, Progress: ${progress}%`);

    if (!isWithinShift) {
      console.log('⚠️ Starting outside normal shift hours');
    }
  }, [globalData.shiftType]);

  // ============ HISTORY FUNCTIONS ============

  useEffect(() => {
    loadHistoryCount();
  }, [globalData.welcomeId]);

  const loadHistoryCount = async () => {
    try {
      const count = await ActivityHistoryService.getHistoryCount(
        globalData.welcomeId,
      );
      setHistoryCount(count);
      console.log(`📊 History count loaded: ${count} activities`);
    } catch (error) {
      console.error('Failed to load history count:', error);
    }
  };

  // ============ GLOBAL ACTIVITY FUNCTIONS ============

  const startGlobalActivity = async (activityName, activityCode, sourceTab) => {
    console.log(
      `🚀 Starting global activity: ${activityName} (${activityCode}) from ${sourceTab}`,
    );

    if (globalActivity.isActive) {
      console.log(
        `🔄 Switching from ${globalActivity.activityName} to ${activityName}`,
      );
      await stopGlobalActivity(true);
    }

    const startTime = new Date();

    if (globalActivityRef.current) {
      clearInterval(globalActivityRef.current);
    }

    const newActivity = {
      isActive: true,
      activityName,
      activityCode,
      sourceTab,
      startTime,
      duration: '00:00:00',
      seconds: 0,
      isSaved: false, // Reset save flag for new activity
    };

    setGlobalActivity(newActivity);

    globalActivityRef.current = setInterval(() => {
      setGlobalActivity(prev => {
        if (!prev.isActive) return prev;

        const newSeconds = prev.seconds + 1;
        const hours = Math.floor(newSeconds / 3600);
        const minutes = Math.floor((newSeconds % 3600) / 60);
        const secs = newSeconds % 60;
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        return {
          ...prev,
          seconds: newSeconds,
          duration: formattedTime,
        };
      });
    }, 1000);

    updateGlobalData({
      status: activityName,
    });

    console.log(`✅ Global activity started: ${activityName}`);
  };

  const stopGlobalActivity = async (autoSave = false) => {
    if (!globalActivity.isActive) {
      console.log('⚠️ No active global activity to stop');
      return;
    }

    console.log(`🛑 Stopping global activity: ${globalActivity.activityName}`);
    console.log(
      `⏱️ Duration: ${globalActivity.duration} (${globalActivity.seconds} seconds)`,
    );

    if (globalActivityRef.current) {
      clearInterval(globalActivityRef.current);
    }

    const endTime = new Date();
    const activityToSave = {...globalActivity};

    if (activityToSave.seconds >= 5) {
      const newHistory = await ActivityHistoryService.addActivity(
        globalData.welcomeId,
        {
          activityName: activityToSave.activityName,
          activityCode: activityToSave.activityCode,
          sourceTab: activityToSave.sourceTab,
          startTime: activityToSave.startTime,
          endTime: endTime,
          duration: activityToSave.duration,
          totalSeconds: activityToSave.seconds,
        },
      );

      if (newHistory) {
        setHistoryCount(newHistory.length);
        console.log(
          `📚 Activity added to history. New count: ${newHistory.length}`,
        );
      } else {
        console.log(
          `⚠️ Activity too short (${activityToSave.seconds}s), not saving to history`,
        );
      }
    }

    setGlobalActivity({
      isActive: false,
      activityName: '',
      activityCode: '',
      sourceTab: '',
      startTime: null,
      duration: '00:00:00',
      seconds: 0,
    });

    // auto-save to database jika ada documentNumber dan duration (lebih dari 5 detik)
    if (
      autoSave &&
      globalData.documentNumber &&
      activityToSave.startTime &&
      activityToSave.seconds >= 5 &&
      !activityToSave.isSaved // Prevent double save
    ) {
      try {
        console.log(`💾 Auto-saving activity: ${activityToSave.activityName}`);

        const activityData = {
          activityName: activityToSave.activityName,
          activityCode: activityToSave.activityCode,
          startTime: activityToSave.startTime,
          endTime: endTime,
          sessionNumber: globalData.documentNumber,
          category: activityToSave.sourceTab, // Map sourceTab to category
        };

        const response = await apiService.saveActivity(activityData);

        if (response.success) {
          // Mark as saved to prevent duplicate
          setGlobalActivity(prev => ({...prev, isSaved: true}));
          console.log(
            `✅ Activity ${activityToSave.activityName} auto-saved successfully`,
          );
        } else {
          console.warn(`⚠️ Failed to auto-save activity:`, response.message);
        }
      } catch (error) {
        console.error(`💥 Error auto-saving activity:`, error.message);
      }
    } else if (activityToSave.seconds < 5) {
      console.log(
        `⚠️ Activity too short (${activityToSave.seconds}s), not saving to database`,
      );
    } else if (activityToSave.isSaved) {
      console.log(
        `⚠️ Activity ${activityToSave.activityName} already saved, skipping duplicate save`,
      );
    }

    // Update global status
    updateGlobalData({
      status: 'READY',
    });

    console.log(
      `🏁 Global activity stopped: ${activityToSave.activityName} (Duration: ${activityToSave.duration})`,
    );
  };

  // ============ TIMER MANAGEMENT ============

  useEffect(() => {
    console.log('🕐 Initializing session timer...');

    const parseTimer = timeString => {
      const parts = timeString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      }
      return 0;
    };

    timerSecondsRef.current = parseTimer(currentTimer || '00:00:00');

    timerIntervalRef.current = setInterval(() => {
      timerSecondsRef.current += 1;
      const formattedTime = formatSessionTime(timerSecondsRef.current);
      setSessionTimer(formattedTime);
    }, 1000);

    // FIX: Proper cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (globalActivityRef.current) {
        clearInterval(globalActivityRef.current);
      }
    };
  }, [currentTimer]); // Added dependency

  const formatSessionTime = totalSeconds => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // DateTime timer
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const formattedDate = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const formattedTime =
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' WITA';

      setCurrentDateTime({
        date: formattedDate,
        time: formattedTime,
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateGlobalData = newData => {
    setGlobalData(prev => ({
      ...prev,
      ...newData,
      currentTimer: sessionTimer,
    }));
  };

  // ============ HANDLERS ============

  const handleTabNavigation = async tabName => {
    const newTab = tabName.toLowerCase();
    console.log(`🔄 Switching to ${newTab} tab`);
    setActiveTab(newTab);
  };

  const handleHmAwalSubmit = async () => {
    if (!globalData.hmAwal || globalData.hmAwal.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Awal');
      return;
    }

    const hmValue = parseInt(globalData.hmAwal);
    if (isNaN(hmValue) || hmValue < 0 || hmValue > 999999) {
      Alert.alert('Error', 'HM Awal harus berupa angka valid (0-999999)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Creating enhanced session with HM Awal:', hmValue);

      // FIX: Use object parameter to match ApiService method signature
      const sessionData = {
        operatorId: globalData.sessionData.operatorId,
        unitId: globalData.sessionData.unitId,
        hmAwal: hmValue,
        shiftType: globalData.shiftType,
        initialStatus: globalData.sessionData.initialStatus,
      };

      const response = await apiService.createSession(sessionData);

      if (response.success) {
        console.log('✅ Enhanced session created successfully:', response.data);

        updateGlobalData({
          isHmAwalSet: true,
          sessionId: response.data.sessionId || response.data.id,
          documentNumber: response.data.documentNumber,
        });

        setSessionCreated(true);
        setShowHmAwalModal(false);

        Alert.alert(
          'Success',
          `Session berhasil dibuat!\n` +
            `Document Number: ${response.data.documentNumber}\n` +
            `HM Awal: ${hmValue}\n` +
            `Shift: ${globalData.shiftLabel} (${globalData.shiftTime})`,
        );
      } else {
        throw new Error(response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('❌ Session creation failed:', error);

      Alert.alert(
        'Session Creation Failed',
        `${error.message}\n\nContinue in offline mode?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Continue Offline',
            onPress: () => {
              updateGlobalData({
                isHmAwalSet: true,
                sessionId: 'offline_' + Date.now(),
                documentNumber: globalData.sessionData.documentNumber,
              });
              setSessionCreated(true);
              setShowHmAwalModal(false);
              Alert.alert(
                'Offline Mode',
                'Session dibuat dalam mode offline. Data akan disinkronkan saat koneksi tersedia.',
              );
            },
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAkhirShift = () => {
    Alert.alert('Konfirmasi', 'Apakah anda yakin ingin mengakhiri shift?', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Ya',
        onPress: () => {
          setShowEndShiftModal(true);
        },
      },
    ]);
  };

  const handleEndShiftSubmit = async () => {
    if (!hmAkhirShift || hmAkhirShift.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Akhir');
      return;
    }

    const hmValue = parseInt(hmAkhirShift);
    if (isNaN(hmValue) || hmValue < 0 || hmValue > 999999) {
      Alert.alert('Error', 'HM Akhir harus berupa angka valid (0-999999)');
      return;
    }

    const hmAwalValue = parseInt(globalData.hmAwal);
    if (hmValue <= hmAwalValue) {
      Alert.alert(
        'Error',
        `HM Akhir (${hmValue}) harus lebih besar dari HM Awal (${hmAwalValue})`,
      );
      return;
    }

    setIsEndingShift(true);

    try {
      if (globalActivity.isActive) {
        await stopGlobalActivity(true);
      }

      if (globalData.sessionId && globalData.documentNumber) {
        const response = await apiService.endSession(
          globalData.sessionId,
          hmValue,
          'SHIFT_END',
        );

        if (response.success) {
          console.log('✅ Session ended successfully with backend');
        }
      }

      // New Function: Clear activity history after successful shift
      console.log('🧹 Clearing activity history...');
      await ActivityHistoryService.clearHistory(globalData.welcomeId);
      setHistoryCount(0);

      const sessionDuration = sessionTimer;
      const hmDifference = hmValue - hmAwalValue;

      setShowEndShiftModal(false);

      Alert.alert(
        'Shift Selesai!',
        `Ringkasan ${globalData.shiftLabel}:\n\n` +
          `Operator: ${
            globalData.employee?.NAME || globalData.welcomeId
          }\n` +
          `Unit: ${globalData.formData?.unitNumber}\n` +
          `Shift: ${globalData.shiftLabel} (${globalData.shiftTime})\n` +
          `Durasi: ${sessionDuration}\n` +
          `HM Awal: ${globalData.hmAwal}\n` +
          `HM Akhir: ${hmValue}\n` +
          `Total HM: ${hmDifference} HM\n` +
          `Total Loads: ${globalData.workData.loads}\n` +
          `Productivity: ${globalData.workData.productivity}\n` +
          `Activities Logged: ${historyCount}`,
        [
          {
            text: 'Selesai',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error) {
      console.error('💥 Error ending shift:', error);
      Alert.alert('Error', `Gagal mengakhiri shift: ${error.message}`);
    } finally {
      setIsEndingShift(false);
    }
  };

  const handleEndShiftModalClose = () => {
    setShowEndShiftModal(false);
    setHmAkhirShift('');
  };

  // Status color mapping
  const getStatusColor = status => {
    switch (status) {
      case 'SAFETY TALK':
        return '#4CAF50';
      case 'RAIN':
        return '#2196F3';
      case 'BREAKDOWN':
        return '#FF9800';
      case 'SHIFT CHANGE':
        return '#00BCD4';
      case 'WORK':
        return '#4CAF50';
      case 'DELAY':
        return '#FF5722';
      case 'IDLE':
        return '#9E9E9E';
      case 'MT':
        return '#673AB7';
      default:
        return '#00BCD4';
    }
  };

  const renderContent = () => {
    const contentProps = {
      globalData: {
        ...globalData,
        globalActivity,
        startGlobalActivity,
        stopGlobalActivity,
      },
      updateGlobalData,
      setActiveTab: handleTabNavigation,
      apiService,
    };

    switch (activeTab) {
      case 'work':
        return <WorkContent {...contentProps} />;
      case 'delay':
        return <DelayContent {...contentProps} />;
      case 'idle':
        return <IdleContent {...contentProps} />;
      case 'mt':
        return <MTContent {...contentProps} navigation={navigation} />;
      default:
        return <WorkContent {...contentProps} />;
    }
  };

  const getActiveTabStatus = () => {
    if (activeTab === 'work') return 'WORK';
    return activeTab.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mining Dashboard Header */}
      <View style={styles.headerSection}>
        {/* Top Row */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>
              Welcome : {globalData.welcomeId} / Shift {globalData.shiftType === 'DAY' ? 'Day' : 'Night'}
            </Text>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.productivityText}>
              Productivity : {globalData.workData.productivity}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.statusLabel}>Status : </Text>
            <Text
              style={[
                styles.statusValue,
                {color: getStatusColor(getActiveTabStatus())},
              ]}>
              {getActiveTabStatus()}
            </Text>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.headerBottomRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.unitText}>
              {globalData.formData?.unitNumber || 'N/A'} | HM Awal : {globalData.hmAwal || '0'}
            </Text>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.loadsText}>
              {globalData.workData.loads} Load(s) | {globalData.workData.hours || '0.0'} hour(s) | {currentDateTime.date} {currentDateTime.time}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.timerText}>{sessionTimer}</Text>
          </View>
        </View>
      </View>

      {/* HM Awal Modal - Enhanced with shift info */}
      <Modal
        visible={showHmAwalModal && !globalData.isHmAwalSet}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Masukkan HM Awal</Text>
            <Text style={styles.modalSubtitle}>
              Silakan masukkan Hour Meter awal sebelum memulai{' '}
              {globalData.shiftLabel}
            </Text>

            {employee && (
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeInfoText}>
                  Operator: {employee.NAME} ({employee.EMP_ID})
                </Text>
                <Text style={styles.employeeInfoText}>
                  Unit: {globalData.formData?.unitNumber}
                </Text>
                <View style={styles.employeeShiftInfo}>
                  <Icon 
                    name={globalData.shiftType === 'DAY' ? 'weather-sunny' : 'weather-night'}
                    size={12} 
                    color={globalData.shiftType === 'DAY' ? '#FF9800' : '#3F51B5'}
                  />
                  <Text style={styles.employeeInfoText}>
                    {globalData.shiftLabel}: {globalData.shiftTime}
                  </Text>
                </View>
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: 1200"
              placeholderTextColor="#999"
              value={globalData.hmAwal}
              onChangeText={text => updateGlobalData({hmAwal: text})}
              keyboardType="numeric"
              autoFocus={true}
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                isLoading && styles.modalButtonDisabled,
              ]}
              onPress={handleHmAwalSubmit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.modalButtonText}>
                  Simpan & Mulai {globalData.shiftLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Shift Modal - Enhanced */}
      <Modal
        visible={showEndShiftModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleEndShiftModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Akhir {globalData.shiftLabel}</Text>
            <Text style={styles.modalSubtitle}>
              Masukkan Hour Meter akhir untuk menyelesaikan{' '}
              {globalData.shiftLabel}
            </Text>

            <View style={styles.sessionSummary}>
              <View style={styles.summaryTitleContainer}>
                <Icon name="chart-bar" size={16} color="#333" />
                <Text style={styles.summaryTitle}>
                  Ringkasan {globalData.shiftLabel}
                </Text>
              </View>
              <Text style={styles.summaryText}>
                Operator: {globalData.employee?.NAME || globalData.welcomeId}
              </Text>
              <Text style={styles.summaryText}>
                Unit: {globalData.formData?.unitNumber}
              </Text>
              <View style={styles.summaryItemContainer}>
                <Icon name="clock" size={12} color="#666" />
                <Text style={styles.summaryText}>
                  Shift: {globalData.shiftTime}
                </Text>
              </View>
              <Text style={styles.summaryText}>
                HM Awal: {globalData.hmAwal}
              </Text>
              <Text style={styles.summaryText}>Durasi: {sessionTimer}</Text>
              <Text style={styles.summaryText}>
                Total Loads: {globalData.workData.loads}
              </Text>
              <Text style={styles.summaryText}>
                Productivity: {globalData.workData.productivity}
              </Text>
              <Text style={styles.summaryText}>Activities: {historyCount}</Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan HM Akhir (contoh: 1250)"
              placeholderTextColor="#999"
              value={hmAkhirShift}
              onChangeText={setHmAkhirShift}
              keyboardType="numeric"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  isEndingShift && styles.modalButtonDisabled,
                ]}
                onPress={handleEndShiftModalClose}
                disabled={isEndingShift}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  isEndingShift && styles.modalButtonDisabled,
                ]}
                onPress={handleEndShiftSubmit}
                disabled={isEndingShift}>
                {isEndingShift ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    Akhiri {globalData.shiftLabel}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW: Gantt Chart Modal (replaces ActivityHistoryModal) */}
      <GanttChartModal
        visible={showGanttModal}
        onClose={() => setShowGanttModal(false)}
        sessionNumber={globalData.documentNumber}
        operatorName={globalData.welcomeName}
        shiftType={globalData.shiftType}
      />

      {/* Main Content Area */}
      <View style={styles.contentArea}>{renderContent()}</View>

      {/* Global Activity Banner (when active) */}
      {globalActivity.isActive && (
        <View style={styles.globalActivityBanner}>
          <View style={styles.globalActivityContent}>
            <View style={styles.globalActivityLabelContainer}>
              <Icon name="record-circle" size={12} color="#4CAF50" />
              <Text style={styles.globalActivityLabel}>Active:</Text>
            </View>
            <Text style={styles.globalActivityText} numberOfLines={1}>
              {globalActivity.activityName}
            </Text>
            <Text style={styles.globalActivityTime}>
              {globalActivity.duration}
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced Floating Action Button for Gantt Chart */}
      <TouchableOpacity
        style={styles.fabGantt}
        onPress={() => setShowGanttModal(true)}
        activeOpacity={0.8}>
        <Icon 
          name="chart-gantt" 
          size={24} 
          color="#fff" 
        />
        {historyCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>
              {historyCount > 99 ? '99+' : historyCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'work' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('WORK')}>
          <View style={styles.navIcon}>
            <Icon 
              name="cog" 
              size={22} 
              color={activeTab === 'work' ? '#4CAF50' : '#999'} 
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'work' && styles.activeNavLabel,
            ]}>
            WORK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'delay' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('DELAY')}>
          <View style={styles.navIcon}>
            <Icon 
              name="clock-alert" 
              size={22} 
              color={activeTab === 'delay' ? '#FF5722' : '#999'} 
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'delay' && styles.activeNavLabel,
            ]}>
            DELAY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'idle' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('IDLE')}>
          <View style={styles.navIcon}>
            <Icon 
              name="pause-circle" 
              size={22} 
              color={activeTab === 'idle' ? '#9E9E9E' : '#999'} 
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'idle' && styles.activeNavLabel,
            ]}>
            IDLE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'mt' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('MT')}>
          <View style={styles.navIcon}>
            <Icon 
              name="tools" 
              size={22} 
              color={activeTab === 'mt' ? '#673AB7' : '#999'} 
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'mt' && styles.activeNavLabel,
            ]}>
            MT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.akhirShiftButton}
          onPress={handleAkhirShift}>
          <Text style={styles.akhirShiftText}>AKHIR{'\n'}SHIFT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerSection: {
    backgroundColor: '#FFD700',
    padding: 15,
    paddingTop: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  productivityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  sessionInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfoIcon: {
    marginRight: 4,
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  creatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  creatingText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 2,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIcon: {
    marginRight: 4,
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pendingSync: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  pendingSyncText: {
    fontSize: 9,
    color: '#FF9800',
    marginLeft: 2,
  },
  leftColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  welcomeLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  welcomeValue: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  shiftValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  productivityLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  productivityValue: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  employeeInfo: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  employeeInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 4,
  },
  employeeShiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionSummary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  summaryItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Content area
  contentArea: {
    flex: 1,
  },
  // Enhanced Floating Action Button untuk Gantt Chart
  fabGantt: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
  },
  fabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  fabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Global Activity Banner (when active)
  globalActivityBanner: {
    position: 'absolute',
    bottom: 95,
    left: 15,
    right: 90,
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 998,
  },
  globalActivityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  globalActivityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  globalActivityLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 4,
  },
  globalActivityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 8,
    flex: 1,
  },
  globalActivityTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  // Bottom navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeNavButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    shadowColor: '#2196F3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  navIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconText: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  activeNavLabel: {
    color: '#2196F3',
  },
  akhirShiftButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: '#F44336',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  akhirShiftText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default DashboardScreen;
