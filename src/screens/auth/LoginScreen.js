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
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const LoginScreen = ({navigation}) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [timer, setTimer] = useState('00:00:00');
  const [formData, setFormData] = useState({
    id: '',
    unitNumber: '',
    workType: '',
  });

  // Timer management
  const intervalRef = useRef(null);
  const secondsRef = useRef(0);

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
    },
    [startTimer],
  );

  const handleSubmit = useCallback(() => {
    if (!formData.id || !formData.unitNumber || !formData.workType) {
      Alert.alert('Error', 'Silakan isi semua field');
      return;
    }

    try {
      console.log('Navigation attempt:', {selectedAction, formData, timer});

      navigation.navigate('Dashboard', {
        selectedAction,
        formData,
        currentTimer: timer,
      });

      console.log('Navigation Success!');
    } catch (error) {
      console.log('Navigation Error:', error);
      Alert.alert('Error', `Navigation Failed: ${error.message}`);
    }
  }, [formData, selectedAction, timer, navigation]);

  //   Alert.alert(
  //     'Success',
  //     `${selectedAction} dimulai!\nID: ${formData.id}\nUnit: ${formData.unitNumber}\nPekerjaan: ${formData.workType}`,
  //   );
  // }, [formData, selectedAction]);

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
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
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>Mulai</Text>
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
        </View>
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
  modalViewMiddle: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalViewBottom: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
    paddingBottom: 20,
  },
  chevronContainer: {
    display: 'none',
  },
  done: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  doneDepressed: {
    color: '#1976D2',
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    borderColor: '#000', // ganti warna border action btn yang dipilih
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
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
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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
  instruction: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  loginForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
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
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 5,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
});

export default LoginScreen;
