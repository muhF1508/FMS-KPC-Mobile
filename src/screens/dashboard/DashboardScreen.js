import React, {useState, useEffect, useRef, use} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import content components (pastikan path sesuai struktur project Anda)
import DashboardContent from '../../components/DashboardContent';
import WorkContent from '../../components/WorkContent';
import DelayContent from '../../components/DelayContent';
import IdleContent from '../../components/IdleContent';
import MTContent from '../../components/MTContent';

// Import API service
import apiService from '../../services/ApiService';

const DashboardScreen = ({route, navigation}) => {
  // Data dari LoginScreen
  const {employee, sessionData, selectedAction, formData, currentTimer} =
    route?.params || {};

  // State untuk tab navigation
  const [activeTab, setActiveTab] = useState('work');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);

  // Timer states
  const [sessionTimer, setSessionTimer] = useState(currentTimer || '00:00:00');
  const timerIntervalRef = useRef(null);
  const timerSecondsRef = useRef(0);

  // Global state yang bisa diakses semua content components
  const [globalData, setGlobalData] = useState({
    // Data dari login
    selectedAction: selectedAction || 'SHIFT CHANGE',
    formData: formData || {},
    currentTimer: sessionTimer,
    employee: employee || {},
    sessionData: sessionData || {},

    // Session info
    sessionId: null,
    documentNumber: sessionData?.documentNumber || '',

    // Data dashboard
    hmAwal: '',
    hmAkhir: '',
    isHmAwalSet: false,

    // Data dari berbagai content
    delayData: {
      activeCode: null,
      activeName: '',
      startTime: '',
      endTime: '',
      isActive: false,
      reason: '',
      duration: '00:00:00',
    },
    workData: {
      loads: 0,
      productivity: '0 bcm/h',
      hours: '0.00',
    },
    idleData: {
      reason: '',
      description: '',
      startTime: '',
      endTime: '',
      isActive: false,
      duration: '00:00:00',
    },
    mtData: {
      type: '',
      description: '',
      status: '',
      startTime: '',
      endTime: '',
      isActive: false,
      duration: '00:00:00',
    },

    // Dashboard info
    welcomeId: employee?.EMP_ID || formData?.id || '18971',
    welcomeName: employee?.NAME || 'Operator',
    shiftType: 'Shift Day',
    status: selectedAction || 'SHIFT CHANGE',
  });

  // Real-time date/time state
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: '',
  });

  // State untuk menampilkan modal popup Hm Awal dan Hm Akhir
  const [showHmAwalModal, setShowHmAwalModal] = useState(true);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [hmAkhirShift, setHmAkhirShift] = useState('');

  // Timer management for session duration
  useEffect(() => {
    console.log('🕐 Initializing session timer...');

    // Parse initial timer dari LoginScreen
    const parseTimer = timeString => {
      const parts = timeString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      }
      return 0; // Default to 0 seconds if format is invalid
    };

    // Set initial timer seconds dari currentTimer yang diterima dari LoginScreen
    timerSecondsRef.current = parseTimer(currentTimer || '00:00:00');

    // Start timer interval
    timerIntervalRef.current = setInterval(() => {
      timerSecondsRef.current += 1; // Increment timer by 1 second
      const formattedTime = formatSessionTime(timerSecondsRef.current);

      setSessionTimer(formattedTime);

      // Update global data dengan timer terbaru
      setGlobalData(prev => ({
        ...prev,
        currentTimer: formattedTime,
      }));
    }, 1000);

    console.log(`✅ Session timer started from: ${currentTimer}`);

    // Cleanup function to clear interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        console.log('🛑 Session timer stopped');
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Format timer function
  const formatSessionTime = totalSeconds => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // DateTime timer for real-time updates
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

  // Save session data to AsyncStorage for offline access
  useEffect(() => {
    const saveSessionData = async () => {
      try {
        await AsyncStorage.setItem(
          'current_session_data',
          JSON.stringify({
            ...globalData,
            sessionData: sessionTimer,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error('Failed to save session data:', error);
      }
    };

    if (globalData.sessionId) {
      saveSessionData();
    }
  }, [globalData, sessionTimer]);

  const updateGlobalData = newData => {
    setGlobalData(prev => ({
      ...prev,
      ...newData,
      currentTimer: sessionTimer,
    }));
  };

  const handleHmAwalSubmit = async () => {
    if (!globalData.hmAwal || globalData.hmAwal.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Awal');
      return;
    }

    // Validate HM format
    const hmValue = parseInt(globalData.hmAwal);
    if (isNaN(hmValue) || hmValue < 0 || hmValue > 999999) {
      Alert.alert('Error', 'HM Awal harus berupa angka valid (0-999999)');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Creating session with HM Awal:', hmValue);

      // Create session with backend
      const response = await apiService.createSession(
        globalData.sessionData.operatorId,
        globalData.sessionData.unitId,
        hmValue,
        globalData.sessionData.actionType,
      );

      if (response.success) {
        console.log('✅ Session created successfully:', response.session);

        updateGlobalData({
          isHmAwalSet: true,
          sessionId: response.session.sessionId,
          documentNumber: response.documentNumber,
        });

        setSessionCreated(true);
        setShowHmAwalModal(false);

        Alert.alert(
          'Success',
          `Session berhasil dibuat!\nDocument Number: ${response.documentNumber}\nHM Awal: ${hmValue}`,
        );
      } else {
        throw new Error(response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('❌ Session creation failed:', error);

      // Handle offline mode - allow to continue without backend
      Alert.alert(
        'Session Creation Failed',
        `${error.message}\n\nContinue in offline mode?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
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

    // Validate HM format
    const hmValue = parseInt(hmAkhirShift);
    if (isNaN(hmValue) || hmValue < 0 || hmValue > 999999) {
      Alert.alert('Error', 'HM Akhir harus berupa angka valid (0-999999)');
      return;
    }

    // Validate HM Akhir should be greater than HM Awal
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
      console.log('🔄 Ending shift with HM Akhir:', hmValue);

      // End session with backend if online
      if (globalData.sessionId && globalData.documentNumber) {
        console.log('💾 Ending session with backend...');

        const response = await apiService.endSession(
          globalData.sessionId,
          hmValue,
          'SHIFT_END',
        );

        if (response.success) {
          console.log('✅ Session ended successfully with backend');
        } else {
          console.warn(
            '⚠️ Failed to end session with backend:',
            response.message,
          );
        }
      }

      // Calculate session summary
      const sessionDuration = globalData.currentTimer;
      const hmDifference = hmValue - hmAwalValue;

      // Save final session data
      const finalSessionData = {
        ...globalData,
        hmAkhir: hmValue,
        endTime: new Date().toISOString(),
        status: 'SHIFT_ENDED',
        summary: {
          duration: sessionDuration,
          hmDifference: hmDifference,
          totalLoads: globalData.workData.loads,
          productivity: globalData.workData.productivity,
        },
      };

      await AsyncStorage.setItem(
        'last_session_data',
        JSON.stringify(finalSessionData),
      );

      setShowEndShiftModal(false);

      // Show summary before navigation
      Alert.alert(
        'Shift Selesai! 🎉',
        `Ringkasan Shift:\n\n` +
          `👤 Operator: ${
            globalData.employee?.NAME || globalData.welcomeId
          }\n` +
          `🚛 Unit: ${globalData.formData?.unitNumber}\n` +
          `⏰ Durasi: ${sessionDuration}\n` +
          `📏 HM Awal: ${globalData.hmAwal}\n` +
          `📏 HM Akhir: ${hmValue}\n` +
          `📊 Total HM: ${hmDifference} jam\n` +
          `📦 Total Loads: ${globalData.workData.loads}\n` +
          `🏆 Productivity: ${globalData.workData.productivity}\n\n` +
          `Terima kasih atas kerja keras Anda! 💪`,
        [
          {
            text: 'Selesai',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error) {
      console.error('💥 Error ending shift:', error);

      Alert.alert(
        'Error',
        `Gagal mengakhiri shift: ${error.message}\n\nLanjut offline?`,
        [
          {
            text: 'Coba Lagi',
            style: 'cancel',
          },
          {
            text: 'Lanjut Offline',
            onPress: async () => {
              // Save offline and navigate
              try {
                const offlineSessionData = {
                  ...globalData,
                  hmAkhir: hmValue,
                  endTime: new Date().toISOString(),
                  status: 'SHIFT_ENDED_OFFLINE',
                };
                await AsyncStorage.setItem(
                  'last_session_data',
                  JSON.stringify(offlineSessionData),
                );
              } catch (saveError) {
                console.error('Failed to save offline data:', saveError);
              }

              setShowEndShiftModal(false);
              navigation.navigate('Login');
            },
          },
        ],
      );
    } finally {
      setIsEndingShift(false);
    }
  };

  const handleEndShiftModalClose = () => {
    setShowEndShiftModal(false);
    setHmAkhirShift('');
  };

  // Navigation handlers
  const handleTabNavigation = tabName => {
    setActiveTab(tabName.toLowerCase());
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

  // Render content berdasarkan active tab
  const renderContent = () => {
    const contentProps = {
      globalData,
      updateGlobalData,
      setActiveTab,
      apiService, // Pass apiService to all components
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

  // Get active tab title for status
  const getActiveTabStatus = () => {
    if (activeTab === 'work') return 'WORK';
    return activeTab.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Layout Header Section */}
      <View style={styles.headerSection}>
        {/* Baris atas - Welcome/ID, productivity, status */}
        <View style={styles.topRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.welcomeLabel}>Welcome :</Text>
            <Text style={styles.welcomeValue}>{globalData.welcomeName}</Text>
            <Text style={styles.shiftValue}>{globalData.shiftType}</Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.productivityLabel}>Productivity :</Text>
            <Text style={styles.productivityValue}>
              {globalData.workData.productivity}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.statusLabel}>Status :</Text>
            <Text
              style={[
                styles.statusValue,
                {color: getStatusColor(getActiveTabStatus())},
              ]}>
              {getActiveTabStatus()}
            </Text>
          </View>
        </View>

        {/* Baris bawah - Unit/Hm Awal, Load/Hours/Date, Timer */}
        <View style={styles.bottomRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.infoText}>
              Unit: {globalData.formData?.unitNumber || 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              {globalData.hmAwal || '0'} Hm Awal
            </Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.infoText}>
              {globalData.workData.loads} Load(s) | {globalData.workData.hours}{' '}
              hour(s)
            </Text>
            <Text style={styles.infoText}>
              {currentDateTime.date} {currentDateTime.time}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.timerText}>{sessionTimer}</Text>
          </View>
        </View>

        {/* Session Info Row */}
        <View style={styles.sessionInfoRow}>
          <Text style={styles.sessionInfoText}>
            Doc: {globalData.documentNumber || 'N/A'}
            {globalData.sessionId &&
              ` | Session: ${globalData.sessionId.toString().slice(-6)}`}
            {!sessionCreated && ' | ⚠️ Creating...'}
          </Text>
        </View>
      </View>

      {/* Modal popup blocking untuk input Hm Awal (WAJIB DIISI) */}
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
              Silakan masukkan Hour Meter awal sebelum memulai shift
            </Text>

            {employee && (
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeInfoText}>
                  Operator: {employee.NAME} ({employee.EMP_ID})
                </Text>
                <Text style={styles.employeeInfoText}>
                  Unit: {globalData.formData?.unitNumber}
                </Text>
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
                  Simpan & Mulai Session
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal HM Akhir untuk End Shift */}
      <Modal
        visible={showEndShiftModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleEndShiftModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Akhir Shift</Text>
            <Text style={styles.modalSubtitle}>
              Masukkan Hour Meter akhir untuk menyelesaikan shift
            </Text>

            {/* Current Session Summary */}
            <View style={styles.sessionSummary}>
              <Text style={styles.summaryTitle}>📊 Ringkasan Shift</Text>
              <Text style={styles.summaryText}>
                Operator: {globalData.employee?.NAME || globalData.welcomeId}
              </Text>
              <Text style={styles.summaryText}>
                Unit: {globalData.formData?.unitNumber}
              </Text>
              <Text style={styles.summaryText}>
                HM Awal: {globalData.hmAwal}
              </Text>
              <Text style={styles.summaryText}>
                Durasi: {globalData.currentTimer}
              </Text>
              <Text style={styles.summaryText}>
                Total Loads: {globalData.workData.loads}
              </Text>
              <Text style={styles.summaryText}>
                Productivity: {globalData.workData.productivity}
              </Text>
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
                  <Text style={styles.modalSubmitText}>Akhiri Shift</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dynamic Main Content Area - based on active tab */}
      <View style={styles.contentArea}>{renderContent()}</View>

      {/* Global delay code input - always visible above bottom navigation */}
      <View style={styles.globalDelayInputContainer}>
        <Text style={styles.delayInputLabel}>Quick Delay:</Text>
        <View style={styles.delayInputRow}>
          <TextInput
            style={styles.delayCodeInput}
            placeholder="001, 004, 005, 006, 007"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={3}
          />
          <TouchableOpacity style={styles.delayStartButton}>
            <Text style={styles.delayStartButtonText}>START</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation Section - Always visible */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'work' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('WORK')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⚙️</Text>
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
            <Text style={styles.navIconText}>⏱️</Text>
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
            <Text style={styles.navIconText}>⏸️</Text>
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
            <Text style={styles.navIconText}>📋</Text>
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
    paddingTop: 25,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  sessionInfoRow: {
    alignItems: 'center',
    marginTop: 5,
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
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
  // Global delay input
  globalDelayInputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayInputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  delayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  delayCodeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginRight: 8,
    textAlign: 'center',
    width: 120,
  },
  delayStartButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  delayStartButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Bottom navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
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
