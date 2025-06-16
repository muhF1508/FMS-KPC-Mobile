import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';

const MTContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  navigation,
}) => {
  const [showHmAkhirModal, setShowHmAkhirModal] = useState(false);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState('');
  const [hmAkhir, setHmAkhir] = useState('');

  const maintenanceTypes = [
    {
      type: 'BREAKDOWN',
      name: 'BREAKDOWN',
      subtitle: 'Unschedule Maintenance', // Fixed typo: Unchedule → Unschedule
      color: '#F44336',
      icon: '🔧',
    },
    {
      type: 'SCHEDULE',
      name: 'SCHEDULE MAINTENANCE',
      subtitle: 'Planned Maintenance',
      color: '#2196F3',
      icon: '📅',
    },
  ];

  const handleMaintenanceButton = maintenanceType => {
    // Fixed parameter name
    setSelectedMaintenanceType(maintenanceType);
    setShowHmAkhirModal(true);
  };

  const handleHmAkhirSubmit = () => {
    if (!hmAkhir || hmAkhir.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Akhir');
      return;
    }

    // Update global data dengan maintenance info
    updateGlobalData({
      mtData: {
        type: selectedMaintenanceType.type,
        name: selectedMaintenanceType.name,
        hmAkhir: hmAkhir,
        endTime:
          new Date().toLocaleTimeString('en-US', {
            // Fixed locale format
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
        isCompleted: true,
      },
    });

    setShowHmAkhirModal(false);

    Alert.alert(
      'Maintenance Selesai',
      `${selectedMaintenanceType.name} telah selesai\nHM Akhir: ${hmAkhir}`, // Fixed typo: AKhir → Akhir
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setHmAkhir('');
            setSelectedMaintenanceType('');

            // Navigate back to Login
            navigation.navigate('Login');
          },
        },
      ],
    );
  };

  const handleModalClose = () => {
    setShowHmAkhirModal(false);
    setSelectedMaintenanceType('');
    setHmAkhir('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Maintenance (MT)</Text>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Pilih Tipe Maintenance</Text>
        <Text style={styles.infoText}>
          Pilih jenis maintenance yang akan dilakukan, kemudian masukkan HM
          Akhir untuk menyelesaikan shift.
        </Text>
      </View>

      {/* Maintenance Type Buttons */}
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Tipe Maintenance:</Text>

        {maintenanceTypes.map((maintenance, index) => (
          <View key={maintenance.type} style={styles.buttonCard}>
            <TouchableOpacity
              style={[
                styles.maintenanceButton,
                {backgroundColor: maintenance.color},
              ]}
              onPress={() => handleMaintenanceButton(maintenance)}
              activeOpacity={0.8}>
              {/* Left Side: Icon + Name */}
              <View style={styles.leftContent}>
                <Text style={styles.maintenanceIcon}>{maintenance.icon}</Text>
                <View style={styles.textContent}>
                  <Text style={styles.maintenanceName}>{maintenance.name}</Text>
                  <Text style={styles.maintenanceSubtitle}>
                    {' '}
                    {/* Fixed typo: maintenace → maintenance */}
                    {maintenance.subtitle}
                  </Text>
                </View>
              </View>

              {/* Right Side: Arrow */}
              <View style={styles.rightContent}>
                <Text style={styles.arrowIcon}>▶</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Current Session Info */}
      <View style={styles.sessionContainer}>
        <Text style={styles.sessionTitle}>Informasi Sesi Saat Ini</Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Operator: {globalData.welcomeId}
          </Text>
          <Text style={styles.sessionText}>
            Unit: {globalData.formData?.unitNumber || 'N/A'}
          </Text>
          <Text style={styles.sessionText}>
            HM Awal: {globalData.hmAwal || 'N/A'}
          </Text>
          <Text style={styles.sessionText}>
            Durasi Shift: {globalData.currentTimer}
          </Text>
        </View>
      </View>

      {/* Modal HM Akhir */}
      <Modal
        visible={showHmAkhirModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedMaintenanceType.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Masukkan Hour Meter akhir untuk menyelesaikan maintenance
            </Text>

            <View style={styles.hmInfoContainer}>
              <Text style={styles.hmInfoText}>
                HM Awal: {globalData.hmAwal || 'N/A'}
              </Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: 1250"
              placeholderTextColor="#999"
              value={hmAkhir}
              onChangeText={setHmAkhir}
              keyboardType="numeric"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleModalClose}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleHmAkhirSubmit}>
                <Text style={styles.modalSubmitText}>Selesai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  buttonCard: {
    marginBottom: 15,
  },
  maintenanceButton: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  textContent: {
    flex: 1,
  },
  maintenanceName: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  maintenanceSubtitle: {
    // Fixed style name
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  sessionContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sessionInfo: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
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
    padding: 25,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  hmInfoContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  hmInfoText: {
    fontSize: 14,
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
    backgroundColor: '#4CAF50',
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
});

export default MTContent;
