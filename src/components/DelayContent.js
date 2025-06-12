import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

const DelayContent = ({globalData, updateGlobalData, setActiveTab}) => {
  // State untuk btn aktivitas yang sedang aktif
  const [activeActivity, setActiveActivity] = useState(null);

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

  // Cleanup timer saat component unmount
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

  // Fungsi start timer aktivitas
  const startActivityTimer = activityCode => {
    // Clear if exists interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set aktivitas yang aktif
    setActiveActivity(activityCode);

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
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
        isActive: true,
      },
    });
  };

  // Handle btn aktivitas ketika di klik
  const handleActivityButton = activityCode => {
    if (activeActivity === activityCode) {
      // jika klik button yang sama, stop timer
      stopCurrentActivity();
    } else {
      // Switch ke aktivitas baru - langsung start tanpa popup
      startActivityTimer(activityCode);
    }
  };

  // Handle input manual code
  const handleManualCodeSubmit = () => {
    const code = manualCode.trim();

    // Validasi kode
    const validActivity = delayActivities.find(act => act.code === code);
    if (!validActivity) {
      Alert.alert(
        'Error',
        'Kode delay tidak valid. Gunakan: 001, 004, 005, 006, 007',
      );
      return;
    }

    // Start aktivitas berdasarkan kode - langsung start tanpa popup
    startActivityTimer(code);
    setManualCode(''); // Clear input
  };

  // Stop aktivitas yang sedang berjalan
  const stopCurrentActivity = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setActiveActivity(null);
    updateGlobalData({
      delayData: {
        ...globalData.delayData,
        isActive: false,
        endTime:
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
      },
    });

    Alert.alert('Info', 'Aktivitas delay telah dihentikan');
  };

  // Reset semua timer
  const resetAllTimers = () => {
    Alert.alert(
      'Konfirmasi Reset',
      'Apakah Anda yakin ingin mereset semua timer?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya',
          onPress: () => {
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
            Alert.alert('Success', 'Semua timer telah direset');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Delay Activities</Text>

      {/* Status Display - moved from bottom to top */}
      {activeActivity && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status Aktivitas:</Text>
          <Text style={styles.statusText}>
            🔴 {delayActivities.find(act => act.code === activeActivity)?.name}{' '}
            ({activeActivity})
          </Text>
          <Text style={styles.statusTime}>
            Dimulai: {globalData.delayData?.startTime || 'N/A'}
          </Text>
        </View>
      )}

      {/* Activity Buttons - HORIZONTAL LAYOUT */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Delay:</Text>

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
                ]}
                onPress={() => handleActivityButton(activity.code)}
                activeOpacity={0.8}>
                <View style={styles.activityContentHorizontal}>
                  {/* Left Side: Activity Name + Timer */}
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

                  {/* Right Side: Activity Code + Running Status */}
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
                ]}
                onPress={() => handleActivityButton(activity.code)}
                activeOpacity={0.8}>
                <View style={styles.activityContentHorizontal}>
                  {/* Left Side: Activity Name + Timer */}
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

                  {/* Right Side: Activity Code + Running Status */}
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

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {activeActivity && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopCurrentActivity}>
            <Text style={styles.controlButtonText}>Stop Current Activity</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetAllTimers}>
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
  manualInputContainer: {
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
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginRight: 10,
    textAlign: 'center',
  },
  submitCodeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitCodeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  // HORIZONTAL LAYOUT STYLES
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
    color: '#FFEB3B', // Yellow for active timer
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
});

export default DelayContent;
