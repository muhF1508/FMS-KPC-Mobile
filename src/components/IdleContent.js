import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const IdleContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  apiService,
}) => {
  const [activeActivity, setActiveActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activityStartTime, setActivityStartTime] = useState(null);

  // Timer state untuk aktivitas
  const [timers, setTimers] = useState({
    '015': '00:00:00', // TRAINING
    100: '00:00:00', // WORKING WITHOUT TRUCK
    101: '00:00:00', // NOT REQUIRED / ASK TO STANDBY
    102: '00:00:00', // NO OPERATOR
    103: '00:00:00', // PRAYERS
    104: '00:00:00', // SAFETY TALK
    105: '00:00:00', // RAIN
    106: '00:00:00', // WET ROADS
    107: '00:00:00', // FOG
    108: '00:00:00', // WALK & WASH SHOVEL
    109: '00:00:00', // MEAL
    110: '00:00:00', // SHIFT CHANGE
    111: '00:00:00', // WAITING FOR FLOAT
    113: '00:00:00', // TOILET
    114: '00:00:00', // OUT OF FUEL
    115: '00:00:00', // WAIT FOR BLASTING
    116: '00:00:00', // DISPATCH PROBLEM
    141: '00:00:00', // HOLIDAY SHUT DOWN
    142: '00:00:00', // NO ROSTERED PLAN
  });

  const intervalRef = useRef(null);
  const secondsRef = useRef({
    '015': 0,
    100: 0,
    101: 0,
    102: 0,
    103: 0,
    104: 0,
    105: 0,
    106: 0,
    107: 0,
    108: 0,
    109: 0,
    110: 0,
    111: 0,
    113: 0,
    114: 0,
    115: 0,
    116: 0,
    141: 0,
    142: 0,
  });

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
    {code: '104', name: 'SAFETY TALK', color: '#9C27B0', category: 'Training'},
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

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = totalSeconds => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const saveActivityToBackend = async (activityCode, startTime, endTime) => {
    if (!globalData.documentNumber) {
      console.warn('⚠️ No document number available, skipping backend save');
      return false;
    }

    try {
      const activityName =
        idleActivities.find(act => act.code === activityCode)?.name ||
        `IDLE_${activityCode}`;

      console.log(`💾 Saving idle activity ${activityName} to backend...`);

      const activityData = {
        activityName: activityName,
        startTime: startTime,
        endTime: endTime,
        sessionNumber: globalData.documentNumber,
      };

      const response = await apiService.saveActivity(activityData);

      if (response.success) {
        console.log(`✅ Idle activity ${activityName} saved successfully`);
        return true;
      } else {
        console.error(`❌ Failed to save idle activity:`, response.message);
        return false;
      }
    } catch (error) {
      console.error(`💥 Error saving idle activity:`, error.message);
      return false;
    }
  };

  const startActivityTimer = async activityCode => {
    // Stop previous activity silently if any
    if (activeActivity && activityStartTime) {
      await stopCurrentActivity(false); // false = no alert, silent stop
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setActiveActivity(activityCode);
    setActivityStartTime(new Date());

    intervalRef.current = setInterval(() => {
      secondsRef.current[activityCode] += 1;
      const formattedTime = formatTime(secondsRef.current[activityCode]);

      setTimers(prev => ({
        ...prev,
        [activityCode]: formattedTime,
      }));
    }, 1000);

    updateGlobalData({
      idleData: {
        activeCode: activityCode,
        activeName: idleActivities.find(act => act.code === activityCode)?.name,
        startTime:
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
        isActive: true,
        reason: idleActivities.find(act => act.code === activityCode)?.name,
        description: `Idle Code: ${activityCode}`,
        duration: '00:00:00',
      },
    });

    console.log(`🚀 Started idle activity: ${activityCode}`);
  };

  const stopCurrentActivity = async (showAlert = true) => {
    if (!activeActivity || !activityStartTime) {
      console.warn('⚠️ No active activity to stop');
      return;
    }

    const currentActivityCode = activeActivity;
    const startTime = activityStartTime;
    const endTime = new Date();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set loading state for silent operations
    if (!showAlert) {
      setIsLoading(true);
    }

    // Save to backend
    const saved = await saveActivityToBackend(
      currentActivityCode,
      startTime,
      endTime,
    );

    const finalDuration = timers[currentActivityCode];

    updateGlobalData({
      idleData: {
        ...globalData.idleData,
        isActive: false,
        endTime:
          endTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
        duration: finalDuration,
      },
    });

    // Reset activity tracking
    setActiveActivity(null);
    setActivityStartTime(null);

    const activityName =
      idleActivities.find(act => act.code === currentActivityCode)?.name ||
      currentActivityCode;

    if (showAlert) {
      // Show alert only when manually stopping
      if (saved) {
        Alert.alert(
          'Aktivitas Selesai',
          `${activityName} telah dihentikan dan disimpan\nDurasi: ${finalDuration}`,
        );
      } else {
        Alert.alert(
          'Aktivitas Selesai (Offline)',
          `${activityName} telah dihentikan\nDurasi: ${finalDuration}\n\n⚠️ Data tersimpan lokal, akan disinkronkan saat online`,
        );
      }
    } else {
      // Silent background save - just log
      console.log(
        `✅ ${activityName} completed silently (${finalDuration}) - ${
          saved ? 'Saved' : 'Offline'
        }`,
      );
    }

    // Reset loading state
    if (!showAlert) {
      setIsLoading(false);
    }
  };

  const handleActivityButton = async activityCode => {
    if (activeActivity === activityCode) {
      // Jika klik button yang sama, maka stop timer
      await stopCurrentActivity(true); // true = show alert
    } else {
      // Switch ke aktivitas baru - langsung start tanpa alert
      await startActivityTimer(activityCode);
    }
  };

  // Manual function for the stop button
  const stopCurrentActivityManual = async () => {
    await stopCurrentActivity(true); // true = show alert
  };

  const resetAllTimers = () => {
    Alert.alert(
      'Konfirmasi Reset',
      'Apakah Anda yakin ingin mereset semua timer?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya',
          onPress: async () => {
            // Stop current activity first (silently)
            if (activeActivity) {
              await stopCurrentActivity(false);
            }

            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            Object.keys(secondsRef.current).forEach(code => {
              secondsRef.current[code] = 0;
            });

            const resetTimers = {};
            Object.keys(timers).forEach(code => {
              resetTimers[code] = '00:00:00';
            });
            setTimers(resetTimers);

            setActiveActivity(null);
            setActivityStartTime(null);

            updateGlobalData({
              idleData: {
                reason: '',
                description: '',
                startTime: '',
                endTime: '',
                isActive: false,
                duration: '00:00:00',
                activeCode: null,
                activeName: '',
              },
            });

            Alert.alert('Success', 'Semua timer telah direset');
          },
        },
      ],
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
          <Text style={styles.offlineText}>
            📡 Offline Mode - Data tersimpan lokal
          </Text>
        </View>
      );
    }
    return null;
  };

  const getCategoryStats = () => {
    const categories = {};
    idleActivities.forEach(activity => {
      const time = timers[activity.code];
      if (time !== '00:00:00') {
        if (!categories[activity.category]) {
          categories[activity.category] = {count: 0, totalSeconds: 0};
        }
        categories[activity.category].count++;

        // Convert time to seconds
        const [hours, minutes, seconds] = time.split(':').map(Number);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        categories[activity.category].totalSeconds += totalSeconds;
      }
    });

    return Object.entries(categories).map(([category, stats]) => ({
      category,
      count: stats.count,
      duration: formatTime(stats.totalSeconds),
    }));
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
          <Text style={styles.loadingText}>Switching activity...</Text>
        </View>
      )}

      {/* Status Display */}
      {activeActivity && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status Aktivitas:</Text>
          <Text style={styles.statusText}>
            ⏸️ {idleActivities.find(act => act.code === activeActivity)?.name} (
            {activeActivity})
          </Text>
          <Text style={styles.statusTime}>
            Dimulai: {globalData.idleData?.startTime || 'N/A'}
          </Text>
          <Text style={styles.statusTime}>
            Durasi: {timers[activeActivity]}
          </Text>
        </View>
      )}

      {/* Activity Buttons - LAYOUT 3 KOLOM */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Idle:</Text>
        <Text style={styles.instructionText}>
          Tap sekali untuk mulai, tap lagi untuk berhenti.
        </Text>

        {groupedActivities.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.activitiesRow}>
            {row.map(activity => (
              <View key={activity.code} style={styles.activityCard}>
                <TouchableOpacity
                  style={[
                    styles.activityButton,
                    {backgroundColor: activity.color},
                    activeActivity === activity.code &&
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
                    <Text
                      style={[
                        styles.timerText,
                        activeActivity === activity.code &&
                          styles.activeTimerText,
                      ]}>
                      {timers[activity.code]}
                    </Text>
                  </View>

                  <View style={styles.rightContent}>
                    <Text style={styles.activityCode}>{activity.code}</Text>
                    {activeActivity === activity.code && (
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

      {/* Category Summary */}
      {getCategoryStats().length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Riwayat per Kategori:</Text>
          {getCategoryStats().map(stat => (
            <View key={stat.category} style={styles.summaryRow}>
              <Text style={styles.summaryCategory}>{stat.category}</Text>
              <Text style={styles.summaryCount}>{stat.count} activities</Text>
              <Text style={styles.summaryTime}>{stat.duration}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {activeActivity && (
          <TouchableOpacity
            style={[styles.stopButton, isLoading && styles.disabledButton]}
            onPress={stopCurrentActivityManual}
            disabled={isLoading}>
            <Text style={styles.controlButtonText}>
              {isLoading ? 'Saving...' : 'Stop Current Activity'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.resetButton, isLoading && styles.disabledButton]}
          onPress={resetAllTimers}
          disabled={isLoading}>
          <Text style={styles.resetButtonText}>Reset All Timers</Text>
        </TouchableOpacity>
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
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
    lineHeight: 16,
  },
  timerText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
  },
  activeTimerText: {
    color: '#FFEB3B',
  },
  activityCode: {
    fontSize: 32,
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
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  summaryCount: {
    fontSize: 12,
    color: '#666',
    width: 80,
    textAlign: 'center',
  },
  summaryTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    fontFamily: 'monospace',
    width: 70,
    textAlign: 'right',
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
});

export default IdleContent;
