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

const IdleContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  apiService,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Data aktivitas idle dengan kategori warna - LAYOUT 3 KOLOM
  const idleActivities = [
    // Weather Related - Blue
    {code: '105', name: 'RAIN', color: '#2196F3', category: 'Weather'},
    {code: '106', name: 'WET ROADS', color: '#2196F3', category: 'Weather'},
    {code: '107', name: 'FOG', color: '#2196F3', category: 'Weather'},

    // Personal Needs - Green
    {code: '103', name: 'PRAYERS', color: '#4CAF50', category: 'Personal'},
    {code: '109', name: 'MEAL', color: '#4CAF50', category: 'Personal'},
    {code: '113', name: 'TOILET', color: '#4CAF50', category: 'Personal'},

    // Work Related - Orange
    {
      code: '100',
      name: 'WORKING WITHOUT TRUCK',
      color: '#FF9800',
      category: 'Work',
    },
    {
      code: '101',
      name: 'NOT REQUIRED / STANDBY',
      color: '#FF9800',
      category: 'Work',
    },
    {
      code: '108',
      name: 'WALK & WASH SHOVEL',
      color: '#FF9800',
      category: 'Work',
    },

    // System/Equipment - Red
    {
      code: '111',
      name: 'WAITING FOR FLOAT',
      color: '#F44336',
      category: 'System',
    },
    {code: '114', name: 'OUT OF FUEL', color: '#F44336', category: 'System'},
    {
      code: '115',
      name: 'WAIT FOR BLASTING',
      color: '#F44336',
      category: 'System',
    },

    // System Issues - Deep Red
    {code: '102', name: 'NO OPERATOR', color: '#D32F2F', category: 'Issues'},
    {
      code: '116',
      name: 'DISPATCH PROBLEM',
      color: '#D32F2F',
      category: 'Issues',
    },
    {
      code: '142',
      name: 'NO ROSTERED PLAN',
      color: '#D32F2F',
      category: 'Issues',
    },

    // Training/Safety - Purple
    {code: '015', name: 'TRAINING', color: '#9C27B0', category: 'Training'},
    {
      code: '104',
      name: 'SAFETY TALK',
      color: '#9C27B0',
      category: 'Training',
    },
    {
      code: '141',
      name: 'HOLIDAY SHUT DOWN',
      color: '#9C27B0',
      category: 'Training',
    },

    // Operations - Teal
    {
      code: '110',
      name: 'SHIFT CHANGE',
      color: '#009688',
      category: 'Operations',
    },
  ];

  const handleActivityButton = async activityCode => {
    const activity = idleActivities.find(act => act.code === activityCode);
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
        'idle',
      );
    } catch (error) {
      console.error('Error handling activity:', error);
      Alert.alert('Error', 'Gagal memproses aktivitas');
    } finally {
      setIsLoading(false);
    }
  };


  const isActivityActive = activityCode => {
    return (
      globalData.globalActivity?.isActive &&
      globalData.globalActivity?.activityCode === activityCode &&
      globalData.globalActivity?.sourceTab === 'idle'
    );
  };

  const isIdleActivityActive = () => {
    return (
      globalData.globalActivity?.isActive &&
      globalData.globalActivity?.sourceTab === 'idle'
    );
  };

  // LAYOUT 3 KOLOM dengan button horizontal
  const groupedActivities = [];
  for (let i = 0; i < idleActivities.length; i += 3) {
    groupedActivities.push(idleActivities.slice(i, i + 3));
  }

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
      <Text style={styles.title}>Idle Activities</Text>

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
          <Text style={styles.sessionTitle}>Informasi Idle Activities</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            • Gunakan saat operasional terhenti sementara
          </Text>
          <Text style={styles.sessionText}>
            • Aktivitas dikelompokkan berdasarkan kategori
          </Text>
          <Text style={styles.sessionText}>
            • Sistem tracking otomatis untuk analisis downtime
          </Text>
        </View>
      </View>

      {/* Activity Buttons - LAYOUT 3 KOLOM */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Idle:</Text>
        <Text style={styles.instructionText}>
          Pilih aktivitas idle yang sesuai dengan kondisi operasional
        </Text>

        {groupedActivities.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.activitiesRow}>
            {row.map(activity => (
              <View key={activity.code} style={styles.activityCard}>
                <TouchableOpacity
                  style={[
                    styles.activityButton,
                    {backgroundColor: activity.color},
                    isActivityActive(activity.code) &&
                      styles.activeActivityButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={() => handleActivityButton(activity.code)}
                  disabled={isLoading}
                  activeOpacity={0.8}>
                  <View style={styles.leftContent}>
                    <Text style={styles.activityName} numberOfLines={2}>
                      {activity.name}
                    </Text>
                    {isActivityActive(activity.code) && (
                      <Text style={styles.timerText}>
                        {globalData.globalActivity.duration}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rightContent}>
                    <Text style={styles.activityCode}>{activity.code}</Text>
                    {isActivityActive(activity.code) && (
                      <View style={styles.runningIndicator}>
                        <Text style={styles.runningText}>● RUNNING</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            {/* Fill empty slots jika baris tidak penuh */}
            {row.length < 3 &&
              Array.from({length: 3 - row.length}).map((_, emptyIndex) => (
                <View
                  key={`empty-${rowIndex}-${emptyIndex}`}
                  style={styles.activityCard}
                />
              ))}
          </View>
        ))}
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
    marginBottom: 12,
  },
  activityCard: {
    flex: 1,
    marginHorizontal: 3,
  },
  activityButton: {
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  leftContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activityName: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
    lineHeight: 16,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFEB3B',
    fontFamily: 'monospace',
  },
  activityCode: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  runningIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 15,
    marginTop: 4,
  },
  runningText: {
    color: '#FFEB3B',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
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

export default IdleContent;
