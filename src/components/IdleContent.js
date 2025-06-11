import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const IdleContent = ({globalData, updateGlobalData, setActiveTab}) => {
  const [idleReason, setIdleReason] = useState('');
  const [idleDescription, setIdleDescription] = useState('');

  const idleReasons = [
    {label: 'Istirahat', value: 'ISTIRAHAT'},
    {label: 'Makan', value: 'MAKAN'},
    {label: 'Toilet', value: 'TOILET'},
    {label: 'Menunggu Perintah', value: 'MENUNGGU_PERINTAH'},
    {label: 'Lainnya', value: 'LAINNYA'},
  ];

  const handleStartIdle = () => {
    if (!idleReason) {
      Alert.alert('Error', 'Pilih alasan idle terlebih dahulu');
      return;
    }

    updateGlobalData({
      idleData: {
        reason: idleReason,
        description: idleDescription,
        startTime: new Date().toLocaleTimeString(),
        isActive: true,
      },
    });

    Alert.alert('Success', 'Status idle telah dimulai');
  };

  const handleStopIdle = () => {
    updateGlobalData({
      idleData: {
        ...globalData.idleData,
        endTime: new Date().toLocaleTimeString(),
        isActive: false,
      },
    });

    Alert.alert('Success', 'Status idle telah berakhir');
    setActiveTab('dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Idle Management</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Alasan Idle:</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={setIdleReason}
            items={idleReasons}
            placeholder={{
              label: 'Pilih alasan idle...',
              value: null,
              color: '#999',
            }}
            value={idleReason}
            style={pickerSelectStyles}
          />
        </View>

        <Text style={styles.label}>Deskripsi (Opsional):</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Masukkan deskripsi detail..."
          placeholderTextColor="#999"
          value={idleDescription}
          onChangeText={setIdleDescription}
          multiline={true}
          numberOfLines={3}
        />

        {!globalData.idleData?.isActive ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartIdle}>
            <Text style={styles.buttonText}>Mulai Idle</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.activeIdleContainer}>
              <Text style={styles.activeIdleText}>
                ⏸️ Status Idle: {globalData.idleData.reason}
              </Text>
              <Text style={styles.activeIdleTime}>
                Dimulai: {globalData.idleData.startTime}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopIdle}>
              <Text style={styles.buttonText}>Akhiri Idle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fafafa',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  startButton: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeIdleContainer: {
    backgroundColor: '#F3E5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#9E9E9E',
  },
  activeIdleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B1FA2',
  },
  activeIdleTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default IdleContent;
