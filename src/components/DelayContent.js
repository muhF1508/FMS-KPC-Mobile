import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const DelayContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  apiService,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Data aktivitas delay
  const delayActivities = [
    {code: '001', name: 'DAILY FUEL-PM', color: '#FF9800'},
    {code: '004', name: 'RELOCATE', color: '#2196F3'},
    {code: '005', name: 'ENG. DELAYS', color: '#F44336'},
    {code: '006', name: 'OPER SHOVEL WAIT ON TRUCKS', color: '#4CAF50'},
    {code: '007', name: 'WAIT ON OTHER EQUIP', color: '#9C27B0'},
  ];

  const isActivityActive = activityCode => {
    return (
      globalData.globalActivity?.isActive &&
      globalData.globalActivity?.activityCode === activityCode &&
      globalData.globalActivity?.sourceTab === 'delay'
    );
  };

  const isDelayActivityActive = () => {
    return (
      globalData.globalActivity?.isActive &&
      globalData.globalActivity?.sourceTab === 'delay'
    );
  };

  const handleActivityButton = async activityCode => {
    const activity = delayActivities.find(act => act.code === activityCode);
    if (!activity) return;

    setIsLoading(true);

    try {
      // Check if this activity is already running
      if (isActivityActive(activityCode)) {
        // Stop the current activity (silent)
        await globalData.stopGlobalActivity(true);
      } else {
        // Start new activity (silent switch)
        await globalData.startGlobalActivity(
          activity.name,
          activityCode,
          'delay',
        );
      }
    } catch (error) {
      console.error('Error handling activity:', error);
      Alert.alert('Error', 'Gagal memproses aktivitas');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllActivities = () => {
    Alert.alert(
      'Konfirmasi Reset',
      'Apakah Anda yakin ingin mereset semua data delay?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya',
          onPress: async () => {
            if (isDelayActivityActive()) {
              await globalData.stopGlobalActivity(true);
            }
            Alert.alert('Success', 'Data delay telah direset');
          },
        },
      ],
    );
  };

  const getConnectionStatus = () => {
    if (!globalData.documentNumber) {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            📡 Offline Mode - Data tersimpan lokal
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Delay Activities</Text>

      {/* Connection Status */}
      {getConnectionStatus()}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Global Activity Status */}
      {isDelayActivityActive() && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status Aktivitas Aktif:</Text>
          <Text style={styles.statusText}>
            🔴 {globalData.globalActivity.activityName} (
            {globalData.globalActivity.activityCode})
          </Text>
          <Text style={styles.statusTime}>
            Durasi: {globalData.globalActivity.duration}
          </Text>
        </View>
      )}

      {/* Activity Buttons - HORIZONTAL LAYOUT */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Delay:</Text>
        <Text style={styles.instructionText}>
          Tap sekali untuk mulai, tap lagi untuk berhenti
        </Text>

        {/* Row 1: First 3 activities */}
        <View style={styles.activitiesRow}>
          {delayActivities.slice(0, 3).map(activity => (
            <View key={activity.code} style={styles.activityCardHorizontal}>
              <TouchableOpacity
                style={[
                  styles.activityButtonHorizontal,
                  {backgroundColor: activity.color},
                  isActivityActive(activity.code) &&
                    styles.activeActivityButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleActivityButton(activity.code)}
                disabled={isLoading}
                activeOpacity={0.8}>
                <View style={styles.activityContentHorizontal}>
                  <View style={styles.leftContent}>
                    <Text style={styles.activityNameHorizontal}>
                      {activity.name}
                    </Text>
                    {isActivityActive(activity.code) && (
                      <Text style={styles.timerTextHorizontal}>
                        {globalData.globalActivity.duration}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rightContent}>
                    <Text style={styles.activityCodeHorizontal}>
                      {activity.code}
                    </Text>
                    {isActivityActive(activity.code) && (
                      <View style={styles.runningIndicatorHorizontal}>
                        <Text style={styles.runningTextHorizontal}>
                          ● RUNNING
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Row 2: Last 2 activities */}
        <View style={styles.activitiesRow}>
          {delayActivities.slice(3, 5).map(activity => (
            <View key={activity.code} style={styles.activityCardHorizontal}>
              <TouchableOpacity
                style={[
                  styles.activityButtonHorizontal,
                  {backgroundColor: activity.color},
                  isActivityActive(activity.code) &&
                    styles.activeActivityButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleActivityButton(activity.code)}
                disabled={isLoading}
                activeOpacity={0.8}>
                <View style={styles.activityContentHorizontal}>
                  <View style={styles.leftContent}>
                    <Text style={styles.activityNameHorizontal}>
                      {activity.name}
                    </Text>
                    {isActivityActive(activity.code) && (
                      <Text style={styles.timerTextHorizontal}>
                        {globalData.globalActivity.duration}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rightContent}>
                    <Text style={styles.activityCodeHorizontal}>
                      {activity.code}
                    </Text>
                    {isActivityActive(activity.code) && (
                      <View style={styles.runningIndicatorHorizontal}>
                        <Text style={styles.runningTextHorizontal}>
                          ● RUNNING
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Empty space untuk balance layout */}
          <View style={styles.activityCardHorizontal} />
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {isDelayActivityActive() && (
          <TouchableOpacity
            style={[styles.stopButton, isLoading && styles.disabledButton]}
            onPress={() => globalData.stopGlobalActivity(true)}
            disabled={isLoading}>
            <Text style={styles.controlButtonText}>
              {isLoading ? 'Saving...' : 'Stop Current Activity'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.resetButton, isLoading && styles.disabledButton]}
          onPress={resetAllActivities}
          disabled={isLoading}>
          <Text style={styles.resetButtonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Informasi Delay Activities</Text>
        <Text style={styles.infoText}>
          • Hanya satu aktivitas yang dapat berjalan pada satu waktu
        </Text>
        <Text style={styles.infoText}>
          • Aktivitas akan otomatis tersimpan ke database
        </Text>
        <Text style={styles.infoText}>
          • Timer berjalan global di seluruh aplikasi
        </Text>
        <Text style={styles.infoText}>
          • Quick delay dapat dimulai dari input di bawah
        </Text>
      </View>
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
  statusContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  statusTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  activitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  activityCardHorizontal: {
    flex: 1,
    marginHorizontal: 5,
  },
  activityButtonHorizontal: {
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeActivityButton: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  activityContentHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activityNameHorizontal: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
    lineHeight: 16,
  },
  activityCodeHorizontal: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerTextHorizontal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFEB3B',
    fontFamily: 'monospace',
  },
  runningIndicatorHorizontal: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 15,
    marginTop: 4,
  },
  runningTextHorizontal: {
    color: '#FFEB3B',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlsContainer: {
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default DelayContent;
