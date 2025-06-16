import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

const WorkContent = ({globalData, updateGlobalData, setActiveTab}) => {
  const [activeStep, setActiveStep] = useState(null);
  const [currentTruckNumber, setCurrentTruckNumber] = useState(1);
  const [loadCount, setLoadCount] = useState(0); // Counter garukan (max 4)

  // Timer state untuk setiap step
  const [stepTimers, setStepTimers] = useState({
    spot: '00:00:00',
    load: '00:00:00',
  });

  // Refs untuk interval dan seconds counter
  const intervalRef = useRef(null);
  const secondsRef = useRef({
    spot: 0,
    load: 0,
  });

  // Data workflow steps - HANYA 2 BUTTON sekarang
  const workflowSteps = [
    {
      step: 'spot',
      name: 'SPOT',
      subtitle: 'Truck Positioning',
      color: '#FF9800',
      icon: '🎯',
    },
    {
      step: 'load',
      name: 'LOAD',
      subtitle: `Loading ${loadCount}/4`,
      color: loadCount >= 4 ? '#4CAF50' : '#2196F3',
      icon: loadCount >= 4 ? '✅' : '⚙️',
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

  const startStepTimer = stepName => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setActiveStep(stepName);

    intervalRef.current = setInterval(() => {
      secondsRef.current[stepName] += 1;
      const formattedTime = formatTime(secondsRef.current[stepName]);

      setStepTimers(prev => ({
        ...prev,
        [stepName]: formattedTime,
      }));
    }, 1000);
  };

  const handleStepButton = stepName => {
    if (stepName === 'spot') {
      // Reset everything untuk truck baru
      if (loadCount > 0) {
        Alert.alert(
          'Truck Baru',
          `Truck #${currentTruckNumber} belum selesai (${loadCount}/4 Load).\n\nMulai truck baru?`,
          [
            {text: 'Batal', style: 'cancel'},
            {text: 'Ya, Truck Baru', onPress: () => startNewTruck()},
          ],
        );
        return;
      }
      startNewTruck();
    } else if (stepName === 'load') {
      // Harus SPOT dulu
      if (activeStep !== 'spot' && loadCount === 0) {
        Alert.alert(
          'Error',
          'Silakan klik SPOT terlebih dahulu untuk truck baru',
        );
        return;
      }

      handleLoadClick();
    }
  };

  const startNewTruck = () => {
    // Reset counters
    setLoadCount(0);
    Object.keys(secondsRef.current).forEach(step => {
      secondsRef.current[step] = 0;
    });
    setStepTimers({
      spot: '00:00:00',
      load: '00:00:00',
    });

    // Start SPOT timer
    startStepTimer('spot');
  };

  const handleLoadClick = () => {
    if (loadCount === 0) {
      // Pertama kali LOAD, start timer
      startStepTimer('load');
    }

    const newLoadCount = loadCount + 1;
    setLoadCount(newLoadCount);

    const currentBcm = newLoadCount * 4;

    if (newLoadCount >= 4) {
      // Truck FULL! Auto complete
      setTimeout(() => {
        completeTruckLoading(currentBcm);
      }, 500); // Delay sedikit untuk user experience
    }
    // Tidak ada alert/popup untuk garukan 1-3, langsung continue
  };

  const completeTruckLoading = totalBcm => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update global loads (per truck, bukan per garukan)
    const newTruckLoads = globalData.workData.loads + 1;
    const totalBcmAllTrucks = newTruckLoads * 16; // 1 truck = 16 BCM (4 garukan x 4 BCM)
    const newProductivity = `${totalBcmAllTrucks} bcm/h`;

    updateGlobalData({
      workData: {
        ...globalData.workData,
        loads: newTruckLoads, // Counter per truck
        productivity: newProductivity,
        lastCycle: {
          truckNumber: currentTruckNumber,
          spotTime: stepTimers.spot,
          loadTime: stepTimers.load,
          totalGarukan: 4,
          totalBcm: totalBcm,
          completedAt:
            new Date().toLocaleTimeString('en-US', {
              timeZone: 'Asia/Makassar',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }) + ' WITA',
        },
      },
      // Flag untuk auto-start delay 006 setelah masuk delay tab
      autoStartDelay006: true,
    });

    Alert.alert(
      'Truck Full! 🚛',
      `Truck #${currentTruckNumber} selesai dimuat\n\n✅ 4/4 muatan selesai\n📦 Total muatan: ${totalBcm} BCM\n🏆 Total trucks: ${newTruckLoads}\n📊 Productivity: ${newProductivity}\n\nDigger akan menunggu truck selanjutnya...`,
      [
        {
          text: 'Wait for Next Truck',
          onPress: () => {
            // Reset untuk truck selanjutnya
            setCurrentTruckNumber(prev => prev + 1);
            setLoadCount(0);
            setActiveStep(null);

            // Switch ke DELAY tab (delay 006 akan auto-start di DelayContent)
            setActiveTab('delay');
          },
        },
      ],
    );
  };

  const resetAllData = () => {
    Alert.alert(
      'Reset Data',
      'Apakah Anda yakin ingin mereset semua data loading?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya, Reset',
          onPress: () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            // Reset semua data
            Object.keys(secondsRef.current).forEach(step => {
              secondsRef.current[step] = 0;
            });

            setStepTimers({
              spot: '00:00:00',
              load: '00:00:00',
            });

            setActiveStep(null);
            setCurrentTruckNumber(1);
            setLoadCount(0);

            updateGlobalData({
              workData: {
                loads: 0,
                productivity: '0 bcm/h',
                hours: '0.00',
              },
            });

            Alert.alert('Success', 'Semua data telah direset');
          },
        },
      ],
    );
  };

  // Progress bar untuk visual garukan
  const renderProgressBar = () => {
    const progress = (loadCount / 4) * 100;
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progress Muatan :</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progress}%`}]} />
        </View>
        <Text style={styles.progressText}>
          {loadCount}/4 muatan ({loadCount * 4} BCM)
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Work Management</Text>

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status Saat Ini</Text>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>
            Truck #{currentTruckNumber}{' '}
            {activeStep ? `- ${activeStep.toUpperCase()}` : '- Ready'}
          </Text>
          {activeStep && (
            <Text style={styles.statusTime}>
              Step Duration: {stepTimers[activeStep]}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        {loadCount > 0 && renderProgressBar()}
      </View>

      {/* Workflow Steps Buttons - HANYA 2 BUTTON */}
      <View style={styles.stepsContainer}>
        <Text style={styles.sectionTitle}>Workflow Steps:</Text>

        <View style={styles.stepsRow}>
          {workflowSteps.map(step => (
            <View key={step.step} style={styles.stepCard}>
              <TouchableOpacity
                style={[
                  styles.stepButton,
                  {backgroundColor: step.color},
                  activeStep === step.step && styles.activeStepButton,
                ]}
                onPress={() => handleStepButton(step.step)}
                activeOpacity={0.8}>
                {/* Left Side: Icon + Name */}
                <View style={styles.leftContent}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <View style={styles.textContent}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>

                {/* Right Side: Timer + Status */}
                <View style={styles.rightContent}>
                  <Text
                    style={[
                      styles.stepTimer,
                      activeStep === step.step && styles.activeStepTimer,
                    ]}>
                    {stepTimers[step.step]}
                  </Text>

                  {activeStep === step.step && (
                    <View style={styles.runningIndicator}>
                      <Text style={styles.runningText}>● ACTIVE</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Statistik Hari Ini</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{globalData.workData.loads}</Text>
            <Text style={styles.statLabel}>Trucks Loaded</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {globalData.workData.productivity}
            </Text>
            <Text style={styles.statLabel}>Productivity</Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
          <Text style={styles.resetButtonText}>🔄 Reset All Data</Text>
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
  progressContainer: {
    marginTop: 15,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stepsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stepCard: {
    flex: 1,
    marginHorizontal: 3,
  },
  stepButton: {
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
  activeStepButton: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  leftContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  textContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 16,
  },
  stepSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stepTimer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  activeStepTimer: {
    color: '#FFEB3B',
    fontSize: 18,
  },
  runningIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 15,
  },
  runningText: {
    color: '#FFEB3B',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controlsContainer: {
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkContent;
