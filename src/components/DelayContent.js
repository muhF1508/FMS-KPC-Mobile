import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const DelayContent = forwardRef(
  ({globalData, updateGlobalData, setActiveTab, apiService}, ref) => {
    const [activeActivity, setActiveActivity] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activityStartTime, setActivityStartTime] = useState(null);

    // Timer state untuk setiap aktivitas
    const [timers, setTimers] = useState({
      '001': '00:00:00', // DAILY FUEL-PM
      '004': '00:00:00', // RELOCATE
      '005': '00:00:00', // ENG DELAYS
      '006': '00:00:00', // OPER SHOVEL WAIT ON TRUCKS
      '007': '00:00:00', // WAIT ON OTHER EQUIP
    });

    // Refs untuk interval dan seconds counter
    const intervalRef = useRef(null);
    const secondsRef = useRef({
      '001': 0,
      '004': 0,
      '005': 0,
      '006': 0,
      '007': 0,
    });

    // Data aktivitas delay
    const delayActivities = [
      {code: '001', name: 'DAILY FUEL-PM', color: '#FF9800'},
      {code: '004', name: 'RELOCATE', color: '#2196F3'},
      {code: '005', name: 'ENG. DELAYS', color: '#F44336'},
      {code: '006', name: 'OPER SHOVEL WAIT ON TRUCKS', color: '#4CAF50'},
      {code: '007', name: 'WAIT ON OTHER EQUIP', color: '#9C27B0'},
    ];

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      saveCurrentActivity: async () => {
        if (activeActivity && activityStartTime) {
          await stopCurrentActivity(false); // Save silently
        }
      },
      getTimersState: () => ({
        timers: timers,
        seconds: secondsRef.current,
        activeActivity: activeActivity,
        activityStartTime: activityStartTime,
      }),
    }));

    // Restore state when component mounts or when coming back to this tab
    useEffect(() => {
      const persistentTimers = globalData.persistentTimers?.delay;
      if (persistentTimers && persistentTimers.timers) {
        console.log('🔄 Restoring delay timers state:', persistentTimers);

        setTimers(persistentTimers.timers);
        secondsRef.current = persistentTimers.seconds || secondsRef.current;

        // Restore active activity if exists
        if (persistentTimers.activeActivity) {
          setActiveActivity(persistentTimers.activeActivity);
          setActivityStartTime(
            persistentTimers.activityStartTime
              ? new Date(persistentTimers.activityStartTime)
              : null,
          );

          // Resume timer for active activity
          if (persistentTimers.activeActivity) {
            resumeActivityTimer(persistentTimers.activeActivity);
          }
        }
      }
    }, []);

    // Cleanup timer saat component unmount
    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    // Auto-start delay 006 if flag is set
    useEffect(() => {
      if (globalData.autoStartDelay006) {
        console.log('🚀 Auto-starting delay 006 Wait on Truck');
        startActivityTimer('006');

        updateGlobalData({
          autoStartDelay006: false,
        });
      }
    }, [globalData.autoStartDelay006]);

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
          delayActivities.find(act => act.code === activityCode)?.name ||
          `DELAY_${activityCode}`;

        console.log(`💾 Saving delay activity ${activityName} to backend...`);

        const activityData = {
          activityName: activityName,
          startTime: startTime,
          endTime: endTime,
          sessionNumber: globalData.documentNumber,
        };

        const response = await apiService.saveActivity(activityData);

        if (response.success) {
          console.log(`✅ Delay activity ${activityName} saved successfully`);
          return true;
        } else {
          console.error(`❌ Failed to save delay activity:`, response.message);
          return false;
        }
      } catch (error) {
        console.error(`💥 Error saving delay activity:`, error.message);
        return false;
      }
    };

    const resumeActivityTimer = activityCode => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        secondsRef.current[activityCode] += 1;
        const formattedTime = formatTime(secondsRef.current[activityCode]);

        setTimers(prev => ({
          ...prev,
          [activityCode]: formattedTime,
        }));
      }, 1000);

      console.log(`🔄 Resumed delay activity timer: ${activityCode}`);
    };

    const startActivityTimer = async activityCode => {
      // Stop previous activity silently if any
      if (activeActivity && activityStartTime) {
        await stopCurrentActivity(false); // false = no alert, silent stop
      }

      // Clear if exists interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set aktivitas yang aktif
      setActiveActivity(activityCode);
      setActivityStartTime(new Date());

      // Start new interval untuk aktivitas yang dipilih
      intervalRef.current = setInterval(() => {
        secondsRef.current[activityCode] += 1;
        const formattedTime = formatTime(secondsRef.current[activityCode]);

        setTimers(prev => ({
          ...prev,
          [activityCode]: formattedTime,
        }));
      }, 1000);

      updateGlobalData({
        delayData: {
          activeCode: activityCode,
          activeName: delayActivities.find(act => act.code === activityCode)
            ?.name,
          startTime:
            new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) + ' WITA',
          isActive: true,
        },
      });

      console.log(`🚀 Started delay activity: ${activityCode}`);
    };

    const handleActivityButton = async activityCode => {
      if (activeActivity === activityCode) {
        // Jika klik button yang sama, stop timer dengan alert
        await stopCurrentActivity(true); // true = show alert
      } else {
        // Switch ke aktivitas baru - langsung start tanpa alert
        await startActivityTimer(activityCode);
      }
    };

    // Function to stop the current activity and save it
    const stopCurrentActivity = async (showAlert = true) => {
      if (!activeActivity || !activityStartTime) {
        console.warn('⚠️ No active activity to stop');
        return;
      }

      const currentActivityCode = activeActivity;
      const startTime = activityStartTime;
      const endTime = new Date();

      // Stop timer
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

      // Update global data
      const duration = timers[currentActivityCode];
      updateGlobalData({
        delayData: {
          ...globalData.delayData,
          isActive: false,
          endTime:
            endTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) + ' WITA',
          duration: duration,
        },
      });

      // Reset activity tracking
      setActiveActivity(null);
      setActivityStartTime(null);

      const activityName =
        delayActivities.find(act => act.code === currentActivityCode)?.name ||
        currentActivityCode;

      if (showAlert) {
        // Show alert only when manually stopping
        if (saved) {
          Alert.alert(
            'Aktivitas Selesai',
            `${activityName} telah dihentikan dan disimpan\nDurasi: ${duration}`,
          );
        } else {
          Alert.alert(
            'Aktivitas Selesai (Offline)',
            `${activityName} telah dihentikan\nDurasi: ${duration}\n\n⚠️ Data tersimpan lokal, akan disinkronkan saat online`,
          );
        }
      } else {
        // Silent background save - just log
        console.log(
          `✅ ${activityName} completed silently (${duration}) - ${
            saved ? 'Saved' : 'Offline'
          }`,
        );
      }

      // Reset loading state
      if (!showAlert) {
        setIsLoading(false);
      }
    };

    // Manual stop function for the stop button
    const stopCurrentActivityManual = async () => {
      await stopCurrentActivity(true);
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

              // Reset semua counter
              Object.keys(secondsRef.current).forEach(code => {
                secondsRef.current[code] = 0;
              });

              // Reset timer display
              setTimers({
                '001': '00:00:00',
                '004': '00:00:00',
                '005': '00:00:00',
                '006': '00:00:00',
                '007': '00:00:00',
              });

              setActiveActivity(null);
              setActivityStartTime(null);

              updateGlobalData({
                delayData: {
                  activeCode: null,
                  activeName: '',
                  startTime: '',
                  endTime: '',
                  isActive: false,
                  reason: '',
                  duration: '00:00:00',
                },
              });

              Alert.alert('Success', 'Semua timer telah direset');
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
            <Text style={styles.loadingText}>Switching activity...</Text>
          </View>
        )}

        {/* Status Display */}
        {activeActivity && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Status Aktivitas:</Text>
            <Text style={styles.statusText}>
              🔴{' '}
              {delayActivities.find(act => act.code === activeActivity)?.name} (
              {activeActivity})
            </Text>
            <Text style={styles.statusTime}>
              Dimulai: {globalData.delayData?.startTime || 'N/A'}
            </Text>
            <Text style={styles.statusTime}>
              Durasi: {timers[activeActivity]}
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
                    activeActivity === activity.code &&
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
                      <Text
                        style={[
                          styles.timerTextHorizontal,
                          activeActivity === activity.code &&
                            styles.activeTimerText,
                        ]}>
                        {timers[activity.code]}
                      </Text>
                    </View>

                    <View style={styles.rightContent}>
                      <Text style={styles.activityCodeHorizontal}>
                        {activity.code}
                      </Text>
                      {activeActivity === activity.code && (
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
                    activeActivity === activity.code &&
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
                      <Text
                        style={[
                          styles.timerTextHorizontal,
                          activeActivity === activity.code &&
                            styles.activeTimerText,
                        ]}>
                        {timers[activity.code]}
                      </Text>
                    </View>

                    <View style={styles.rightContent}>
                      <Text style={styles.activityCodeHorizontal}>
                        {activity.code}
                      </Text>
                      {activeActivity === activity.code && (
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

        {/* Activity Summary */}
        {Object.values(timers).some(time => time !== '00:00:00') && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Riwayat Delay Hari Ini:</Text>
            {delayActivities.map(activity => {
              const time = timers[activity.code];
              if (time !== '00:00:00') {
                return (
                  <View key={activity.code} style={styles.summaryRow}>
                    <Text style={styles.summaryCode}>{activity.code}</Text>
                    <Text style={styles.summaryName}>{activity.name}</Text>
                    <Text style={styles.summaryTime}>{time}</Text>
                  </View>
                );
              }
              return null;
            })}
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
  },
);

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
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 8,
    lineHeight: 16,
  },
  activityCodeHorizontal: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerTextHorizontal: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
  },
  activeTimerText: {
    color: '#FFEB3B',
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
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 40,
  },
  summaryName: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    marginHorizontal: 10,
  },
  summaryTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    fontFamily: 'monospace',
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

export default DelayContent;
