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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ActivityHistoryService from '../services/ActivityHistoryService';

const MTContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  navigation,
  apiService,
}) => {
  const [showHmAkhirModal, setShowHmAkhirModal] = useState(false);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState('');
  const [hmAkhir, setHmAkhir] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const maintenanceTypes = [
    {
      type: 'BREAKDOWN',
      name: 'BREAKDOWN',
      subtitle: 'Unscheduled Maintenance',
      color: '#F44336',
      icon: 'wrench',
    },
    {
      type: 'SCHEDULE',
      name: 'SCHEDULE MAINTENANCE',
      subtitle: 'Planned Maintenance',
      color: '#2196F3',
      icon: 'calendar-clock',
    },
  ];

  const handleMaintenanceButton = maintenanceType => {
    setSelectedMaintenanceType(maintenanceType);
    setShowHmAkhirModal(true);
  };

  const handleHmAkhirSubmit = async () => {
    if (!hmAkhir || hmAkhir.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Akhir');
      return;
    }

    const hmValue = parseInt(hmAkhir);
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

    setIsLoading(true);

    try {
      // Stop any active global activity before ending shift
      if (globalData.globalActivity?.isActive) {
        await globalData.stopGlobalActivity(true);
      }

      // Save maintenance activity to backend if online
      if (globalData.documentNumber && apiService) {
        console.log(`Saving ${selectedMaintenanceType.name} to backend...`);

        const activityData = {
          activityName: selectedMaintenanceType.name,
          startTime: new Date(Date.now() - 60000), // Assume started 1 minute ago
          endTime: new Date(),
          sessionNumber: globalData.documentNumber,
        };

        const response = await apiService.saveActivity(activityData);

        if (response.success) {
          console.log(`${selectedMaintenanceType.name} saved successfully`);
        } else {
          console.warn(
            `Failed to save ${selectedMaintenanceType.name}:`,
            response.message,
          );
        }

        // End session with backend
        if (globalData.sessionId) {
          console.log('Ending session with backend...');

          const endResponse = await apiService.endSession(
            globalData.sessionId,
            hmValue,
            selectedMaintenanceType.type,
          );

          if (endResponse.success) {
            console.log('Session ended successfully');
          } else {
            console.warn('Failed to end session:', endResponse.message);
          }
        }
      }

      // New Function: to clear activity history
      console.log('Clearing activity history...');
      const clearSuccess = await ActivityHistoryService.clearHistory(
        globalData.welcomeId,
      );

      if (clearSuccess) {
        console.log('Activity history cleared successfully');
      } else {
        console.warn('Failed to clear activity history');
      }

      // Update global data dengan maintenance info
      updateGlobalData({
        mtData: {
          type: selectedMaintenanceType.type,
          name: selectedMaintenanceType.name,
          hmAkhir: hmValue,
          endTime:
            new Date().toLocaleTimeString('en-US', {
              timeZone: 'Asia/Makassar',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) + ' WITA',
          isCompleted: true,
        },
        hmAkhir: hmValue,
      });

      setShowHmAkhirModal(false);

      // Calculate session summary
      const sessionDuration = globalData.currentTimer || '00:00:00';
      const hmDifference = hmValue - hmAwalValue;

      Alert.alert(
        'Maintenance Selesai',
        `${selectedMaintenanceType.name} telah selesai\n\n` +
          `Ringkasan Session:\n` +
          `• Operator: ${globalData.employee?.NAME || globalData.welcomeId}\n` +
          `• Unit: ${globalData.formData?.unitNumber}\n` +
          `• HM Awal: ${globalData.hmAwal}\n` +
          `• HM Akhir: ${hmValue}\n` +
          `• Total HM: ${hmDifference} HM\n` +
          `• Durasi Session: ${sessionDuration}\n` +
          `• Total Loads: ${globalData.workData.loads}`,
        [
          {
            text: 'Lihat Report',
            onPress: () => {
              generateSessionReport();
            },
          },
          {
            text: 'Selesai',
            onPress: () => {
              resetFormAndNavigate();
            },
            style: 'default',
          },
        ],
      );
    } catch (error) {
      console.error('Error ending session:', error);

      Alert.alert(
        'Error',
        `Gagal mengakhiri session: ${error.message}\n\nLanjut offline?`,
        [
          {
            text: 'Coba Lagi',
            style: 'cancel',
          },
          {
            text: 'Lanjut Offline',
            onPress: () => {
              setShowHmAkhirModal(false);
              resetFormAndNavigate();
            },
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateSessionReport = async () => {
    if (!globalData.documentNumber || !apiService) {
      Alert.alert('Info', 'Report hanya tersedia dalam mode online');
      resetFormAndNavigate();
      return;
    }

    try {
      setIsLoading(true);
      console.log('Generating session report...');

      const response = await apiService.getSessionReport(
        globalData.documentNumber,
      );

      if (response.success) {
        const report = response.data;

        Alert.alert(
          'Session Report',
          `Detail Lengkap Session:\n\n` +
            `Operator: ${report.session?.operator_name || 'N/A'}\n` +
            `Unit: ${report.session?.unit_id || 'N/A'}\n` +
            `Total Activities: ${report.summary?.total_activities || 0}\n` +
            `Work Time: ${report.summary?.work_hours || 0} hours\n` +
            `Delay Time: ${Math.round(
              (report.summary?.delay_seconds || 0) / 3600,
            )} hours\n` +
            `Idle Time: ${Math.round(
              (report.summary?.idle_seconds || 0) / 3600,
            )} hours\n` +
            `Total Loads: ${report.summary?.total_loads || 0}\n` +
            `Productivity: ${report.summary?.productivity || 0} BCM/hour`,
          [{text: 'OK', onPress: () => resetFormAndNavigate()}],
        );
      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', `Gagal generate report: ${error.message}`);
      resetFormAndNavigate();
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormAndNavigate = () => {
    setHmAkhir('');
    setSelectedMaintenanceType('');
    navigation.navigate('Login');
  };

  const handleModalClose = () => {
    setShowHmAkhirModal(false);
    setSelectedMaintenanceType('');
    setHmAkhir('');
  };

  const getConnectionStatus = () => {
    if (!globalData.documentNumber) {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            <Icon name="wifi-off" size={16} color="#856404" /> Offline Mode - Session akan disimpan lokal
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.onlineIndicator}>
        <Text style={styles.onlineText}>
          <Icon name="wifi" size={16} color="#155724" /> Online - Session akan disinkronkan dengan server
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Maintenance (MT)</Text>

      {/* Informasi Sesi Saat Ini */}
      <View style={styles.sessionContainer}>
        <View style={styles.sessionTitleContainer}>
          <Icon name="information" size={18} color="#2196F3" />
          <Text style={styles.sessionTitle}>Informasi Sesi Saat Ini</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            • Operator: {globalData.employee?.NAME || globalData.welcomeId}
          </Text>
          <Text style={styles.sessionText}>
            • ID: {globalData.employee?.EMP_ID || globalData.welcomeId}
          </Text>
          <Text style={styles.sessionText}>
            • Unit: {globalData.formData?.unitNumber || 'N/A'}
          </Text>
          <Text style={styles.sessionText}>
            • HM Awal: {globalData.hmAwal || 'N/A'}
          </Text>
          <Text style={styles.sessionText}>
            • Durasi Shift: {globalData.currentTimer}
          </Text>
          <Text style={styles.sessionText}>
            • Total Loads: {globalData.workData.loads}
          </Text>
          <Text style={styles.sessionText}>
            • Productivity: {globalData.workData.productivity}
          </Text>
          {globalData.documentNumber && (
            <Text style={styles.sessionText}>
              • Doc Number: {globalData.documentNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Global Activity Status */}
      {globalData.globalActivity?.isActive && (
        <View style={styles.globalActivityContainer}>
          <Text style={styles.globalActivityTitle}>
            Aktivitas Sedang Berjalan:
          </Text>
          <Text style={styles.globalActivityText}>
            <Icon name="lightning-bolt" size={16} color="#EF6C00" /> {globalData.globalActivity.activityName} (
            {globalData.globalActivity.activityCode})
          </Text>
          <Text style={styles.globalActivityTime}>
            Durasi: {globalData.globalActivity.duration} | Tab:{' '}
            {globalData.globalActivity.sourceTab.toUpperCase()}
          </Text>
          <Text style={styles.globalActivityWarning}>
            <Icon name="alert" size={16} color="#E65100" /> Aktivitas ini akan dihentikan otomatis saat memilih maintenance
          </Text>
        </View>
      )}

      {/* Maintenance Type Buttons */}
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Tipe Maintenance:</Text>
        
        {/* Info Section - Moved under title */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Pilih Tipe Maintenance</Text>
          <Text style={styles.infoText}>
            Pilih jenis maintenance yang akan dilakukan, kemudian masukkan HM
            Akhir untuk menyelesaikan shift.
          </Text>
        </View>

        {maintenanceTypes.map((maintenance, index) => (
          <View key={maintenance.type} style={styles.buttonCard}>
            <TouchableOpacity
              style={[
                styles.maintenanceButton,
                {backgroundColor: maintenance.color},
                isLoading && styles.disabledButton,
              ]}
              onPress={() => handleMaintenanceButton(maintenance)}
              disabled={isLoading}
              activeOpacity={0.8}>
              {/* Left Side: Icon + Name */}
              <View style={styles.leftContent}>
                <View style={styles.iconContainer}>
                  <Icon 
                    name={maintenance.icon} 
                    size={32} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.maintenanceName}>{maintenance.name}</Text>
                  <Text style={styles.maintenanceSubtitle}>
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
              Masukkan Hour Meter akhir untuk menyelesaikan maintenance dan
              mengakhiri session
            </Text>

            <View style={styles.hmInfoContainer}>
              <Text style={styles.hmInfoText}>
                HM Awal: {globalData.hmAwal || 'N/A'}
              </Text>
              <Text style={styles.hmInfoText}>
                Durasi Session: {globalData.currentTimer}
              </Text>
              {globalData.globalActivity?.isActive && (
                <Text style={styles.hmInfoWarning}>
                  <Icon name="alert" size={16} color="#FF6F00" /> Aktivitas {globalData.globalActivity.activityName} akan
                  dihentikan
                </Text>
              )}
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
                style={[
                  styles.modalCancelButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleModalClose}
                disabled={isLoading}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleHmAkhirSubmit}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Selesai</Text>
                )}
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
  offlineIndicator: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  offlineText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    backgroundColor: '#D4EDDA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 12,
    color: '#155724',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  globalActivityContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  globalActivityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  globalActivityText: {
    fontSize: 16,
    color: '#EF6C00',
    fontWeight: 'bold',
  },
  globalActivityTime: {
    fontSize: 14,
    color: '#FF8F00',
    marginTop: 5,
  },
  globalActivityWarning: {
    fontSize: 12,
    color: '#E65100',
    fontStyle: 'italic',
    marginTop: 8,
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
  disabledButton: {
    opacity: 0.6,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
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
  hmInfoWarning: {
    fontSize: 12,
    color: '#FF6F00',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
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
