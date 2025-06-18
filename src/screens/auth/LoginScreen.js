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
import apiService from '../../services/ApiService';

const LoginScreen = ({navigation}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [timer, setTimer] = useState('00:00:00');
  const [formData, setFormData] = useState({
    id: '',
    unitNumber: '',
    workType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // checking online or offline

  // Timer management
  const intervalRef = useRef(null);
  const secondsRef = useRef(0);

  // ScrollView ref for auto-scroll
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
    {label: 'Pekerjaan C', value: 'Pekerjaan C'},
    {label: 'Pekerjaan D', value: 'Pekerjaan D'},
    {label: 'Pekerjaan E', value: 'Pekerjaan E'},
  ];

  // Test API connection on component mount
  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      console.log('🔍 Testing API connection...');
      setServerStatus('checking');

      const health = await apiService.checkHealth();

      if (health.success) {
        console.log('✅ API Connection successful');
        setServerStatus('online');

        // Also test database
        const dbTest = await apiService.testDatabase();
        if (dbTest.success) {
          console.log('✅ Database connection successful');
          console.log('📊 Employee count:', dbTest.data.employee_count);
        }
      } else {
        console.log('⚠️ API Connection failed:', health.message);
        setServerStatus('offline');
      }
    } catch (error) {
      console.log('💥 API Connection error:', error.message);
      setServerStatus('offline');
    }
  };

  // Data untuk dropdown Unit Number dan Work Type dengan highlight
  const getUnitNumbers = useCallback(() => {
    return unitNumbers.map(unit => ({
      ...unit,
      // Style untuk selected item
      color: unit.value === formData.unitNumber ? '#2196F3' : '#333',
      backgroundColor:
        unit.value === formData.unitNumber ? '#e3f2fd' : 'transparent',
    }));
  }, [formData.unitNumber]);

  const getWorkTypes = useCallback(() => {
    return workTypes.map(work => ({
      ...work,
      // Style untuk selected item
      color: work.value === formData.workType ? '#2196F3' : '#333',
      backgroundColor:
        work.value === formData.workType ? '#e3f2fd' : 'transparent',
    }));
  }, [formData.workType]);

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
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Reset seconds
    secondsRef.current = 0;
    setTimer('00:00:00');

    // Start new interval
    intervalRef.current = setInterval(() => {
      secondsRef.current += 1;
      const formattedTime = formatTime(secondsRef.current);
      setTimer(formattedTime);
    }, 1000);
  }, []);

  // Event Handlers
  const handleActionButton = useCallback(
    action => {
      // Clear previous timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set new action
      setSelectedAction(action);
      // Start timer
      startTimer();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    },
    [startTimer],
  );

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!formData.id || !formData.unitNumber || !formData.workType) {
      Alert.alert('Error', 'Silakan isi semua field');
      return;
    }
    if (!selectedAction) {
      Alert.alert('Error', 'Silakan pilih action terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting login process...');
      console.log('📝 Form data:', formData);
      console.log('⚙️ Selected action:', selectedAction);

      // Step 1: Validate employee
      console.log('🔍 Step 1: Validating employee...');
      const employeeResult = await apiService.validateEmployee(formData.id);

      if (!employeeResult.success) {
        Alert.alert('Error', employeeResult.message || 'Employee not found');
        setIsLoading(false);
        return;
      }

      console.log('✅ Employee validated:', employeeResult.data.NAME);

      // Step 2: Create session
      console.log('📝 Step 2: Creating session...');
      const documentNumber = apiService.generateDocumentNumber();

      // Step 3: Navigate to Dashboard with session data
      // HM Awal will be handled in Dashboard modal
      console.log('🚀 Step 3: Navigating to Dashboard...');

      navigation.navigate('Dashboard', {
        employee: employeeResult.data,
        sessionData: {
          documentNumber: documentNumber,
          operatorId: formData.id,
          unitId: formData.unitNumber,
          workType: formData.workType,
          actionType: selectedAction,
        },
        selectedAction,
        formData,
        currentTimer: timer,
      });

      console.log('✅ Navigation successful!');
    } catch (error) {
      console.error('💥 Login process failed:', error);
      Alert.alert('Error', 'Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedAction, timer, navigation]);

  const resetForm = useCallback(() => {
    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Reset all states
    setSelectedAction(null);
    setTimer('00:00:00');
    secondsRef.current = 0;
    setFormData({
      id: '',
      unitNumber: '',
      workType: '',
    });
  }, []);

  // Picker change handlers
  const handleUnitNumberChange = useCallback(value => {
    setFormData(prev => ({...prev, unitNumber: value}));
  }, []);

  const handleWorkTypeChange = useCallback(value => {
    setFormData(prev => ({...prev, workType: value}));
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
        return '🟢 Server Online';
      case 'offline':
        return '🔴 Server Offline';
      default:
        return '🟡 Checking...';
    }
  };

  const renderContent = () => {
    return (
      <>
        {/* Server Status Indicator - Always at top */}
        <View style={styles.serverStatusContainer}>
          <Text
            style={[styles.serverStatusText, {color: getServerStatusColor()}]}>
            {getServerStatusText()}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={testApiConnection}>
            <Text style={styles.retryButtonText}>↻</Text>
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
                  return <Text style={styles.dropdownArrow}></Text>;
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
                  disabled: true,
                }}
                value={formData.workType}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                fixAndroidTouchableBug={true}
                Icon={() => {
                  return <Text style={styles.dropdownArrow}></Text>;
                }}
              />
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
                {isLoading ? 'Connecting...' : 'Mulai'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetForm}
              activeOpacity={0.8}>
              <Text style={styles.resetButtonText}>Reset</Text>
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
        {/* CONDITIONAL RENDERING: ScrollView only active when action is selected */}
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
    </SafeAreaView>
  );
};

// Styles untuk RNPickerSelect
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
  // Server status styles
  serverStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 10,
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
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 12,
    fontWeight: 'bold',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  // Buttons
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
  },
  // Bottom spacing to ensure content is fully scrollable
  bottomSpacing: {
    height: 50,
  },
});

export default LoginScreen;
