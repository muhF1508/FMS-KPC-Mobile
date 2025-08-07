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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

    // Prevent selecting the same activity that's already running
    if (isActivityActive(activityCode)) {
      return; // Do nothing if same activity is already active
    }

    setIsLoading(true);

    try {
      // Always start new activity (will auto-switch from previous)
      await globalData.startGlobalActivity(
        activity.name,
        activityCode,
        'delay',
      );
    } catch (error) {
      console.error('Error handling activity:', error);
      Alert.alert('Error', 'Gagal memproses aktivitas');
    } finally {
      setIsLoading(false);
    }
  };


  const getConnectionStatus = () => {
    if (!globalData.documentNumber) {
      return (
        <View style={styles.offlineIndicator}>
          <Icon name="wifi-off" size={14} color="#FF9800" style={styles.offlineIcon} />
          <Text style={styles.offlineText}>
            Offline Mode - Data tersimpan lokal
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

      {/* Information */}
      <View style={styles.sessionContainer}>
        <View style={styles.sessionTitleContainer}>
          <Icon name="information" size={18} color="#2196F3" />
          <Text style={styles.sessionTitle}>Informasi Delay Activities</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            • Pilih aktivitas delay sesuai dengan kondisi kerja saat ini
          </Text>
          <Text style={styles.sessionText}>
            • Sistem akan otomatis beralih dari aktivitas sebelumnya
          </Text>
          <Text style={styles.sessionText}>
            • Data tersimpan real-time untuk monitoring produktivitas
          </Text>
        </View>
      </View>

      {/* Activity Buttons - HORIZONTAL LAYOUT */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Delay:</Text>
        <Text style={styles.instructionText}>
          Pilih aktivitas delay yang sesuai dengan kondisi saat ini
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIcon: {
    marginRight: 6,
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
  controlButtonText: {
    color: 'white',
    fontSize: 16,
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
});

export default DelayContent;
