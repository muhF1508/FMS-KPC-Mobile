import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const MTContent = ({globalData, updateGlobalData, setActiveTab}) => {
  const [mtType, setMtType] = useState('');
  const [mtDescription, setMtDescription] = useState('');
  const [mtStatus, setMtStatus] = useState('');

  const mtTypes = [
    {label: 'Preventive Maintenance', value: 'PREVENTIVE'},
    {label: 'Corrective Maintenance', value: 'CORRECTIVE'},
    {label: 'Emergency Repair', value: 'EMERGENCY'},
    {label: 'Inspection', value: 'INSPECTION'},
    {label: 'Lubrication', value: 'LUBRICATION'},
  ];

  const mtStatuses = [
    {label: 'Dimulai', value: 'STARTED'},
    {label: 'Dalam Progress', value: 'IN_PROGRESS'},
    {label: 'Selesai', value: 'COMPLETED'},
    {label: 'Pending', value: 'PENDING'},
  ];

  const handleStartMT = () => {
    if (!mtType || !mtDescription) {
      Alert.alert('Error', 'Pilih tipe MT dan isi deskripsi');
      return;
    }

    updateGlobalData({
      mtData: {
        type: mtType,
        description: mtDescription,
        status: 'STARTED',
        startTime: new Date().toLocaleTimeString(),
        isActive: true,
      },
    });

    Alert.alert('Success', 'Maintenance telah dimulai');
  };

  const handleUpdateMTStatus = () => {
    if (!mtStatus) {
      Alert.alert('Error', 'Pilih status MT');
      return;
    }

    updateGlobalData({
      mtData: {
        ...globalData.mtData,
        status: mtStatus,
        endTime:
          mtStatus === 'COMPLETED' ? new Date().toLocaleTimeString() : null,
        isActive: mtStatus !== 'COMPLETED',
      },
    });

    Alert.alert('Success', `Status MT diupdate menjadi ${mtStatus}`);

    if (mtStatus === 'COMPLETED') {
      setActiveTab('dashboard');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Maintenance (MT) Management</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Tipe Maintenance:</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={setMtType}
            items={mtTypes}
            placeholder={{
              label: 'Pilih tipe maintenance...',
              value: null,
              color: '#999',
            }}
            value={mtType}
            style={pickerSelectStyles}
            disabled={globalData.mtData?.isActive}
          />
        </View>

        <Text style={styles.label}>Isi HM Akhir:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Masukkan Hm Akhir..."
          placeholderTextColor="#999"
          value={mtDescription}
          onChangeText={setMtDescription}
          multiline={true}
          numberOfLines={4}
          editable={!globalData.mtData?.isActive}
        />

        {!globalData.mtData?.isActive ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartMT}>
            <Text style={styles.buttonText}>Mulai Maintenance</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.activeMTContainer}>
              <Text style={styles.activeMTText}>
                🔧 MT Aktif: {globalData.mtData.type}
              </Text>
              <Text style={styles.activeMTDescription}>
                {globalData.mtData.description}
              </Text>
              <Text style={styles.activeMTTime}>
                Dimulai: {globalData.mtData.startTime}
              </Text>
              <Text style={styles.activeMTStatus}>
                Status: {globalData.mtData.status}
              </Text>
            </View>

            <Text style={styles.label}>Update Status:</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={setMtStatus}
                items={mtStatuses}
                placeholder={{
                  label: 'Pilih status...',
                  value: null,
                  color: '#999',
                }}
                value={mtStatus}
                style={pickerSelectStyles}
              />
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateMTStatus}>
              <Text style={styles.buttonText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MT History/Log Section */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Riwayat MT Hari Ini</Text>
        <View style={styles.historyItem}>
          <Text style={styles.historyText}>
            Belum ada riwayat maintenance untuk hari ini
          </Text>
        </View>
      </View>
    </ScrollView>
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
    marginBottom: 20,
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
    backgroundColor: '#673AB7',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeMTContainer: {
    backgroundColor: '#EDE7F6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#673AB7',
  },
  activeMTText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4527A0',
  },
  activeMTDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    fontStyle: 'italic',
  },
  activeMTTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  activeMTStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyItem: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MTContent;
