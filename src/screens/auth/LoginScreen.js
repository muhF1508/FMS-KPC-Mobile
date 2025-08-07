import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiService from '../../services/ApiService';
import SessionHistoryModal from '../../components/SessionHistoryModal';

const LoginScreen = ({navigation}) => {
  // State for history modal
  const [showSessionHistory, setShowSessionHistory] = useState(false);

  const [selectedAction, setSelectedAction] = useState(null);
  const [timer, setTimer] = useState('00:00:00');
  const [formData, setFormData] = useState({
    id: '',
    unitNumber: '',
    workType: '',
    shiftType: '', // NEW: Shift type selection
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Timer management
  const intervalRef = useRef(null);
  const secondsRef = useRef(0);
  const scrollViewRef = useRef(null);

  // Data untuk dropdown Unit Number dan Work Type
  const unitNumbers = [
    {label: 'Unit DT001', value: 'DT001'},
    {label: 'Unit DT002', value: 'DT002'},
    {label: 'Unit DT003', value: 'DT003'},
    {label: 'Unit DT004', value: 'DT004'},
    {label: 'Unit DT005', value: 'DT005'},
  ];

  const workTypes = [
    {label: 'SHIFT CHANGE', value: 'SHIFT CHANGE'},
    {label: 'UNIT READY', value: 'UNIT READY'},
    {label: 'PEKERJAAN 01', value: 'PEKERJAAN 01'},
    {label: 'PEKERJAAN 02', value: 'PEKERJAAN 02'},
    {label: 'PEKERJAAN 03', value: 'PEKERJAAN 03'},
  ];

  // NEW: Shift type options
  const shiftTypes = [
    {label: 'Day Shift (06:00 - 18:00)', value: 'DAY', icon: 'weather-sunny'},
    {label: 'Night Shift (18:00 - 06:00)', value: 'NIGHT', icon: 'weather-night'},
  ];

  // Test API connection on component mount
  useEffect(() => {
    testApiConnection();
    setDefaultShiftType();
  }, []);

  // Set default shift type based on current time
  const setDefaultShiftType = () => {
    const currentHour = new Date().getHours();
    const defaultShift = currentHour >= 6 && currentHour < 18 ? 'DAY' : 'NIGHT';

    setFormData(prev => ({
      ...prev,
      shiftType: defaultShift,
    }));

    console.log(
      `🕐 Auto-selected ${defaultShift} shift based on current time (${currentHour}:00)`,
    );
  };

  const testApiConnection = async (retryCount = 0) => {
    const maxRetries = 3;

    try {
      console.log(
        `🔍 Testing API connection (attempt ${retryCount + 1}/${
          maxRetries + 1
        })...`,
      );
      setServerStatus('checking');

      // STEP 1: Test health endpoint - INI YANG UTAMA
      console.log('🏥 Step 1: Testing health endpoint...');
      const health = await apiService.checkHealth();
      console.log('🏥 Health response:', health);

      if (health.success) {
        console.log('✅ Health check successful');

        // LANGSUNG SET STATUS ONLINE setelah health check berhasil
        setServerStatus('online');
        console.log('✅ API Connection successful - Server is ONLINE');

        // STEP 2: Optional database test (tidak akan gagalkan proses login)
        try {
          console.log('🔍 Step 2: Testing database endpoint (optional)...');
          const dbTest = await apiService.testDatabase();
          console.log('🔍 Database test response:', dbTest);

          if (dbTest && dbTest.success) {
            console.log('✅ Database connection confirmed');
            console.log('📊 Employee count:', dbTest.data?.employee_count);
          } else {
            console.warn(
              '⚠️ Database test failed but health check passed - CONTINUING ANYWAY',
            );
            console.warn('⚠️ Database response:', dbTest);
          }
        } catch (dbError) {
          console.warn(
            '⚠️ Database test error (NON-CRITICAL):',
            dbError.message,
          );
          console.warn(
            '⚠️ App will continue working - health check already passed',
          );
          // TIDAK MENGUBAH server status - health check sudah berhasil
        }
      } else {
        // Health check gagal - ini baru masalah serius
        throw new Error(health.message || 'Health check failed');
      }
    } catch (error) {
      console.log(
        `💥 API Connection error (attempt ${retryCount + 1}):`,
        error.message,
      );

      // Retry logic hanya untuk health check yang gagal
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in 2 seconds...`);
        setTimeout(() => testApiConnection(retryCount + 1), 2000);
      } else {
        console.log('❌ All retry attempts failed - server is OFFLINE');
        setServerStatus('offline');
      }
    }
  };

  // Enhanced data getters with shift information
  const getUnitNumbers = useCallback(() => {
    return unitNumbers.map(unit => ({
      ...unit,
      color: unit.value === formData.unitNumber ? '#2196F3' : '#333',
      backgroundColor:
        unit.value === formData.unitNumber ? '#e3f2fd' : 'transparent',
    }));
  }, [formData.unitNumber]);

  const getWorkTypes = useCallback(() => {
    return workTypes.map(work => ({
      ...work,
      color: work.value === formData.workType ? '#2196F3' : '#333',
      backgroundColor:
        work.value === formData.workType ? '#e3f2fd' : 'transparent',
    }));
  }, [formData.workType]);

  const getShiftTypes = useCallback(() => {
    return shiftTypes.map(shift => ({
      ...shift,
      color: shift.value === formData.shiftType ? '#2196F3' : '#333',
      backgroundColor:
        shift.value === formData.shiftType ? '#e3f2fd' : 'transparent',
    }));
  }, [formData.shiftType]);

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fungsi untuk memformat waktu
  const formatTime = totalSeconds => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fungsi untuk start timer
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    secondsRef.current = 0;
    setTimer('00:00:00');

    intervalRef.current = setInterval(() => {
      secondsRef.current += 1;
      const formattedTime = formatTime(secondsRef.current);
      setTimer(formattedTime);
    }, 1000);
  }, []);

  // Event Handlers
  const handleActionButton = useCallback(
    action => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setSelectedAction(action);
      startTimer();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    },
    [startTimer],
  );

  const handleSubmit = useCallback(async () => {
    // Enhanced validation including shift type
    if (
      !formData.id ||
      !formData.unitNumber ||
      !formData.workType ||
      !formData.shiftType
    ) {
      Alert.alert('Error', 'Silakan isi semua field termasuk jenis shift');
      return;
    }
    if (!selectedAction) {
      Alert.alert('Error', 'Silakan pilih action terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting enhanced login process...');
      console.log('📝 Form data:', formData);
      console.log('⚙️ Selected action:', selectedAction);
      console.log('🕐 Shift type:', formData.shiftType);

      // Step 1: Validate employee
      console.log('🔍 Step 1: Validating employee...');
      const employeeResult = await apiService.validateEmployee(formData.id);

      if (!employeeResult.success) {
        Alert.alert('Error', employeeResult.message || 'Employee not found');
        setIsLoading(false);
        return;
      }

      console.log('✅ Employee validated:', employeeResult.data.NAME);

      // Step 2: Check shift timing
      const isWithinShift = apiService.isWithinShift(formData.shiftType);
      const shiftProgress = apiService.getShiftProgress(formData.shiftType);

      console.log(
        `🕐 Shift validation: Within shift: ${isWithinShift}, Progress: ${shiftProgress}%`,
      );

      // Warning if not within shift hours (but allow to continue)
      if (!isWithinShift) {
        const shiftLabel =
          formData.shiftType === 'DAY'
            ? 'Day (06:00-18:00)'
            : 'Night (18:00-06:00)';
        Alert.alert(
          'Shift Time Warning',
          `You're starting ${shiftLabel} shift outside normal hours. Continue anyway?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Continue',
              onPress: () => proceedWithLogin(employeeResult.data),
            },
          ],
        );
      } else {
        proceedWithLogin(employeeResult.data);
      }
    } catch (error) {
      console.error('💥 Login process failed:', error);
      Alert.alert('Error', 'Login failed: ' + error.message);
      setIsLoading(false);
    }
  }, [formData, selectedAction, timer, navigation]);

  const proceedWithLogin = employeeData => {
    try {
      console.log('🚀 Step 3: Proceeding to Dashboard...');

      // Enhanced session data with shift information
      const enhancedSessionData = {
        documentNumber: apiService.generateDocumentNumber(),
        operatorId: formData.id,
        unitId: formData.unitNumber,
        workType: formData.workType,
        actionType: selectedAction,
        shiftType: formData.shiftType, // NEW: Include shift type
        initialStatus: selectedAction, // NEW: Initial status from login
      };

      // Enhanced form data
      const enhancedFormData = {
        ...formData,
        shiftLabel: formData.shiftType === 'DAY' ? 'Day Shift' : 'Night Shift',
        shiftTime:
          formData.shiftType === 'DAY' ? '06:00 - 18:00' : '18:00 - 06:00',
      };

      navigation.navigate('Dashboard', {
        employee: employeeData,
        sessionData: enhancedSessionData,
        selectedAction,
        formData: enhancedFormData,
        currentTimer: timer,
        shiftType: formData.shiftType, // Pass shift type to dashboard
      });

      console.log('✅ Enhanced navigation successful!');
    } catch (error) {
      console.error('💥 Navigation failed:', error);
      Alert.alert('Error', 'Failed to proceed to dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setSelectedAction(null);
    setTimer('00:00:00');
    secondsRef.current = 0;
    setFormData({
      id: '',
      unitNumber: '',
      workType: '',
      shiftType: formData.shiftType, // Keep shift type when resetting
    });
  }, [formData.shiftType]);

  // Picker change handlers
  const handleUnitNumberChange = useCallback(value => {
    setFormData(prev => ({...prev, unitNumber: value}));
  }, []);

  const handleWorkTypeChange = useCallback(value => {
    setFormData(prev => ({...prev, workType: value}));
  }, []);

  const handleShiftTypeChange = useCallback(value => {
    setFormData(prev => ({...prev, shiftType: value}));
    console.log('🕐 Shift type changed to:', value);
  }, []);

  // Server status indicator
  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'online':
        return '#4CAF50';
      case 'offline':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'online':
        return 'Server Online';
      case 'offline':
        return 'Server Offline';
      default:
        return 'Checking...';
    }
  };

  const getServerStatusIcon = () => {
    switch (serverStatus) {
      case 'online':
        return 'check-circle';
      case 'offline':
        return 'close-circle';
      default:
        return 'clock';
    }
  };

  // Get shift timing info for display
  const getShiftTimingInfo = () => {
    if (!formData.shiftType) return null;

    const isWithinShift = apiService.isWithinShift(formData.shiftType);
    const progress = apiService.getShiftProgress(formData.shiftType);
    const shiftTimes = apiService.getShiftTimes(formData.shiftType);

    return {
      isWithinShift,
      progress,
      startTime: shiftTimes.startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTime: shiftTimes.endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const shiftInfo = getShiftTimingInfo();

  const renderContent = () => {
    return (
      <>
        {/* History Button */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowSessionHistory(true)}
            activeOpacity={0.7}>
            <Icon name="history" size={16} color="#2196F3" />
            <Text style={styles.historyButtonLabel}>History</Text>
          </TouchableOpacity>
        </View>
        {/* Server Status Indicator */}
        <View style={styles.serverStatusContainer}>
          <View style={styles.serverStatusContent}>
            <Icon 
              name={getServerStatusIcon()} 
              size={12} 
              color={getServerStatusColor()} 
              style={styles.serverStatusIconStyle}
            />
            <Text
              style={[styles.serverStatusText, {color: getServerStatusColor()}]}>
              {getServerStatusText()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={testApiConnection}>
            <Icon name="refresh" size={14} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/fms.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Mulai Sesi Anda</Text>
        </View>

        {/* Shift Information Display */}
        {formData.shiftType && shiftInfo && (
          <View style={styles.shiftInfoContainer}>
            <View style={styles.shiftInfoHeader}>
              <View style={styles.shiftTitleContainer}>
                <Icon 
                  name={formData.shiftType === 'DAY' ? 'weather-sunny' : 'weather-night'}
                  size={20} 
                  color={formData.shiftType === 'DAY' ? '#FF9800' : '#3F51B5'}
                  style={styles.shiftIcon}
                />
                <Text style={styles.shiftInfoTitle}>
                  {formData.shiftType} Shift
                </Text>
              </View>
              <Text style={styles.shiftInfoTime}>
                {shiftInfo.startTime} - {shiftInfo.endTime}
              </Text>
            </View>

            <View style={styles.shiftStatusContainer}>
              <View
                style={[
                  styles.shiftStatusIndicator,
                  {
                    backgroundColor: shiftInfo.isWithinShift
                      ? '#4CAF50'
                      : '#FF9800',
                  },
                ]}
              />
              <Text style={styles.shiftStatusText}>
                {shiftInfo.isWithinShift
                  ? 'Within shift hours'
                  : 'Outside shift hours'}
              </Text>
              {shiftInfo.isWithinShift && (
                <Text style={styles.shiftProgressText}>
                  Progress: {shiftInfo.progress}%
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.safetyTalkBtn,
              selectedAction === 'SAFETY TALK' && styles.selectedBtn,
              selectedAction === 'SAFETY TALK' && styles.pressedBtn,
            ]}
            onPress={() => handleActionButton('SAFETY TALK')}
            disabled={selectedAction === 'SAFETY TALK'}
            activeOpacity={1}>
            <Text style={styles.actionBtnText}>SAFETY TALK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.rainBtn,
              selectedAction === 'RAIN' && styles.selectedBtn,
              selectedAction === 'RAIN' && styles.pressedBtn,
            ]}
            onPress={() => handleActionButton('RAIN')}
            disabled={selectedAction === 'RAIN'}
            activeOpacity={1}>
            <Text style={styles.actionBtnText}>RAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.breakdownBtn,
              selectedAction === 'BREAKDOWN' && styles.selectedBtn,
              selectedAction === 'BREAKDOWN' && styles.pressedBtn,
            ]}
            onPress={() => handleActionButton('BREAKDOWN')}
            disabled={selectedAction === 'BREAKDOWN'}
            activeOpacity={1}>
            <Text style={styles.actionBtnText}>BREAKDOWN</Text>
          </TouchableOpacity>
        </View>

        {/* Timer */}
        {selectedAction && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{timer}</Text>
          </View>
        )}

        {/* Action Form */}
        {selectedAction ? (
          <View style={styles.actionForm}>
            <Text style={styles.formTitle}>{selectedAction}</Text>

            {/* ID Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan ID / Badge Number"
                placeholderTextColor="#999"
                value={formData.id}
                onChangeText={text =>
                  setFormData(prev => ({...prev, id: text}))
                }
              />
            </View>

            {/* Unit Number Picker */}
            <View style={styles.inputContainer}>
              <RNPickerSelect
                onValueChange={handleUnitNumberChange}
                items={getUnitNumbers()}
                placeholder={{
                  label: 'Pilih Unit Number',
                  value: null,
                  color: '#999',
                }}
                value={formData.unitNumber}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                fixAndroidTouchableBug={true}
                Icon={() => {
                  return <Text style={styles.dropdownArrow}>▼</Text>;
                }}
              />
            </View>

            {/* Work Type Picker */}
            <View style={styles.inputContainer}>
              <RNPickerSelect
                onValueChange={handleWorkTypeChange}
                items={getWorkTypes()}
                placeholder={{
                  label: 'Pilih Work Type',
                  value: null,
                  color: '#999',
                }}
                value={formData.workType}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                fixAndroidTouchableBug={true}
                Icon={() => {
                  return <Text style={styles.dropdownArrow}>▼</Text>;
                }}
              />
            </View>

            {/* NEW: Shift Type Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Jenis Shift:</Text>
              <View style={styles.shiftPickerContainer}>
                <RNPickerSelect
                  onValueChange={handleShiftTypeChange}
                  items={getShiftTypes()}
                  placeholder={{
                    label: 'Pilih Jenis Shift',
                    value: null,
                    color: '#999',
                  }}
                  value={formData.shiftType}
                  style={{
                    ...pickerSelectStyles,
                    inputAndroid: {
                      ...pickerSelectStyles.inputAndroid,
                      paddingLeft: formData.shiftType ? 50 : 16, // Add left padding when icon is shown
                    },
                    inputIOS: {
                      ...pickerSelectStyles.inputIOS,
                      paddingLeft: formData.shiftType ? 50 : 16, // Add left padding when icon is shown
                    }
                  }}
                  useNativeAndroidPickerStyle={false}
                  fixAndroidTouchableBug={true}
                  Icon={() => {
                    return <Icon name="chevron-down" size={20} color="#666" style={styles.pickerIcon} />;
                  }}
                />
                {formData.shiftType && (
                  <Icon 
                    name={formData.shiftType === 'DAY' ? 'weather-sunny' : 'weather-night'}
                    size={18} 
                    color={formData.shiftType === 'DAY' ? '#FF9800' : '#3F51B5'}
                    style={styles.shiftSelectedIcon}
                  />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}>
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Connecting...' : 'Mulai Shift'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetForm}
              activeOpacity={0.8}>
              <View style={styles.resetButtonContent}>
                <Icon name="refresh" size={16} color="#666" style={styles.resetIcon} />
                <Text style={styles.resetButtonText}>Reset</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginForm}>
            <Text style={styles.formTitle}>Login Operator</Text>
            <Text style={styles.instruction}>
              Pilih salah satu tombol di atas untuk memulai
            </Text>
          </View>
        )}
        {selectedAction && <View style={styles.bottomSpacing} />}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {selectedAction ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {renderContent()}
          </ScrollView>
        ) : (
          <View style={styles.centeredContent}>{renderContent()}</View>
        )}
      </KeyboardAvoidingView>

      {/* Session History Modal */}
      <SessionHistoryModal
        visible={showSessionHistory}
        onClose={() => setShowSessionHistory(false)}
      />
    </SafeAreaView>
  );
};

// Enhanced Styles untuk RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fafafa',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fafafa',
  },
  placeholder: {
    color: '#999',
    fontSize: 16,
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  // Top Controls
  topControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000,
  },
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  historyButtonIcon: {
    marginRight: 4,
  },
  historyButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  // Server status styles
  serverStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 10,
  },
  serverStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverStatusIconStyle: {
    marginRight: 4,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  retryButton: {
    marginLeft: 10,
    padding: 5,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#666',
  },
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 5,
  },
  // NEW: Shift info styles
  shiftInfoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  shiftInfoHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  shiftTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftIcon: {
    marginRight: 8,
  },
  shiftInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  shiftInfoTime: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
  },
  shiftStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  shiftStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  shiftStatusText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 'bold',
    marginRight: 10,
  },
  shiftProgressText: {
    fontSize: 11,
    color: '#1565C0',
    fontStyle: 'italic',
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  safetyTalkBtn: {
    backgroundColor: '#4CAF50',
  },
  rainBtn: {
    backgroundColor: '#2196F3',
  },
  breakdownBtn: {
    backgroundColor: '#FF9800',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  selectedBtn: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#000',
  },
  pressedBtn: {
    transform: [{translateY: 2}],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // Timer
  timerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  // Forms
  actionForm: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  loginForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  instruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Form inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  // Enhanced shift picker styles
  shiftPickerContainer: {
    position: 'relative',
  },
  pickerIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
    zIndex: 1,
  },
  shiftSelectedIcon: {
    position: 'absolute',
    left: 15,
    top: 12,
    zIndex: 1,
  },
  // Buttons
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2196F3',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: {
    marginRight: 4,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
  },
  // Bottom spacing
  bottomSpacing: {
    height: 50,
  },
});

export default LoginScreen;
