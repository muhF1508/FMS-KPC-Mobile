import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

const IdleContent = ({globalData, updateGlobalData, setActiveTab}) => {
  const [activeActivity, setActiveActivity] = useState(null);

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

  // Data aktivitas idle dengan kategori warna - LAYOUT 3 KOLOM LEBIH BAIK
  const idleActivities = [
    // Weather Related - Blue
    {code: '105', name: 'RAIN', color: '#2196F3'},
    {code: '106', name: 'WET ROADS', color: '#2196F3'},
    {code: '107', name: 'FOG', color: '#2196F3'},

    // Personal Needs - Green
    {code: '103', name: 'PRAYERS', color: '#4CAF50'},
    {code: '109', name: 'MEAL', color: '#4CAF50'},
    {code: '113', name: 'TOILET', color: '#4CAF50'},

    // Work Related - Orange
    {code: '100', name: 'WORKING WITHOUT TRUCK', color: '#FF9800'},
    {code: '101', name: 'NOT REQUIRED / STANDBY', color: '#FF9800'},
    {code: '108', name: 'WALK & WASH SHOVEL', color: '#FF9800'},

    // System/Equipment - Red
    {code: '111', name: 'WAITING FOR FLOAT', color: '#F44336'},
    {code: '114', name: 'OUT OF FUEL', color: '#F44336'},
    {code: '115', name: 'WAIT FOR BLASTING', color: '#F44336'},

    // System Issues - Deep Red
    {code: '102', name: 'NO OPERATOR', color: '#D32F2F'},
    {code: '116', name: 'DISPATCH PROBLEM', color: '#D32F2F'},
    {code: '142', name: 'NO ROSTERED PLAN', color: '#D32F2F'},

    // Training/Safety - Purple
    {code: '015', name: 'TRAINING', color: '#9C27B0'},
    {code: '104', name: 'SAFETY TALK', color: '#9C27B0'},
    {code: '141', name: 'HOLIDAY SHUT DOWN', color: '#9C27B0'},

    // Operations - Teal
    {code: '110', name: 'SHIFT CHANGE', color: '#009688'},
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

  const startActivityTimer = activityCode => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setActiveActivity(activityCode);

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
          new Date().toLocaleTimeString('en-US', {
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
  };

  const stopCurrentActivity = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const finalDuration = timers[activeActivity];

    updateGlobalData({
      idleData: {
        ...globalData.idleData,
        isActive: false,
        endTime:
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }) + ' WITA',
        duration: finalDuration,
      },
    });

    setActiveActivity(null);
    Alert.alert(
      'Info',
      `Aktivitas idle telah dihentikan\nDurasi: ${finalDuration}`,
    );
  };

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

            Object.keys(secondsRef.current).forEach(code => {
              secondsRef.current[code] = 0;
            });

            const resetTimers = {};
            Object.keys(timers).forEach(code => {
              resetTimers[code] = '00:00:00';
            });
            setTimers(resetTimers);

            setActiveActivity(null);

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

  const handleActivityButton = activityCode => {
    if (activeActivity === activityCode) {
      // Jika klik button yang sama, maka stop timer
      stopCurrentActivity();
    } else {
      // Switch ke aktivitas baru - langsung tanpa konfirmasi
      startActivityTimer(activityCode);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Idle Activities</Text>

      {/* Status Display - SAMA DENGAN DELAY CONTENT */}
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
        </View>
      )}

      {/* Activity Buttons - LAYOUT 3 KOLOM */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Pilih Aktivitas Idle:</Text>

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
                  ]}
                  onPress={() => handleActivityButton(activity.code)}
                  activeOpacity={0.8}>
                  {/* Left Side: Activity Name + Timer */}
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

                  {/* Right Side: Activity Code + Running Status */}
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
  activitiesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  // 3 KOLOM LAYOUT dengan button horizontal
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
  // HORIZONTAL LAYOUT CONTENT - SAMA DENGAN DELAY CONTENT
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
    color: '#FFEB3B', // Yellow for active timer
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

export default IdleContent;
