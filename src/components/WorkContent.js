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

const WorkContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  apiService,
}) => {
  const [currentTruckNumber, setCurrentTruckNumber] = useState(1);
  const [loadCount, setLoadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Data workflow steps
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

  const handleStepButton = async stepName => {
    const step = workflowSteps.find(s => s.step === stepName);
    if (!step) return;

    setIsLoading(true);

    try {
      if (stepName === 'spot') {
        if (loadCount > 0) {
          Alert.alert(
            'Truck Baru',
            `Truck #${currentTruckNumber} belum selesai (${loadCount}/4 Load).\n\nMulai truck baru?`,
            [
              {text: 'Batal', style: 'cancel'},
              {text: 'Ya, Truck Baru', onPress: () => startNewTruck()},
            ],
          );
          setIsLoading(false);
          return;
        }
        await startNewTruck();
      } else if (stepName === 'load') {
        if (!isWorkActivityActive('SPOT') && loadCount === 0) {
          Alert.alert(
            'Error',
            'Silakan klik SPOT terlebih dahulu untuk truck baru',
          );
          setIsLoading(false);
          return;
        }
        await handleLoadClick();
      }
    } catch (error) {
      console.error('Error handling step:', error);
      Alert.alert('Error', 'Gagal memproses aktivitas');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewTruck = async () => {
    // Reset counters
    setLoadCount(0);

    // Start SPOT activity
    await globalData.startGlobalActivity('SPOT', 'SPOT', 'work');

    console.log(`🚀 Started new truck #${currentTruckNumber} - SPOT activity`);
  };

  const handleLoadClick = async () => {
    if (loadCount === 0) {
      // Switch from SPOT to LOAD activity
      await globalData.startGlobalActivity('LOAD', 'LOAD', 'work');
    }

    const newLoadCount = loadCount + 1;
    setLoadCount(newLoadCount);

    const currentBcm = newLoadCount * 4;

    if (newLoadCount >= 4) {
      // Truck FULL! Auto complete
      setTimeout(() => {
        completeTruckLoading(currentBcm);
      }, 500);
    }
  };

  const completeTruckLoading = async totalBcm => {
    // Stop current LOAD activity
    await globalData.stopGlobalActivity(true);

    // Update global loads
    const newTruckLoads = globalData.workData.loads + 1;
    const totalBcmAllTrucks = newTruckLoads * 16; // 1 truck = 16 BCM
    const newProductivity = `${totalBcmAllTrucks} bcm/h`;

    const lastCycleData = {
      truckNumber: currentTruckNumber,
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
    };

    const updatedWorkData = {
      ...globalData.workData,
      loads: newTruckLoads,
      productivity: newProductivity,
      hours: (newTruckLoads * 0.5).toFixed(2), // Simplified calculation
      lastCycle: lastCycleData,
    };

    updateGlobalData({
      workData: updatedWorkData,
    });

    Alert.alert(
      'Truck Full! 🚛',
      `Truck #${currentTruckNumber} selesai dimuat\n\n✅ 4/4 muatan selesai\n📦 Total muatan: ${totalBcm} BCM\n🏆 Total trucks: ${newTruckLoads}\n📊 Productivity: ${newProductivity}\n\nDigger akan menunggu truck selanjutnya...`,
      [
        {
          text: 'Wait for Next Truck',
          onPress: async () => {
            setCurrentTruckNumber(prev => prev + 1);
            setLoadCount(0);

            // Auto start delay 006 (Wait on Trucks)
            await globalData.startGlobalActivity(
              'OPER SHOVEL WAIT ON TRUCKS',
              '006',
              'delay',
            );
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
          onPress: async () => {
            // Stop current activity if any
            if (isWorkActivityActive()) {
              await globalData.stopGlobalActivity(true);
            }

            // Reset semua data
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

  const isWorkActivityActive = (activityName = null) => {
    if (
      !globalData.globalActivity?.isActive ||
      globalData.globalActivity?.sourceTab !== 'work'
    ) {
      return false;
    }

    if (activityName) {
      return globalData.globalActivity?.activityName === activityName;
    }

    return true;
  };

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
      <Text style={styles.title}>Work Management</Text>

      {/* Connection Status */}
      {getConnectionStatus()}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status Saat Ini</Text>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>
            Truck #{currentTruckNumber}
            {isWorkActivityActive()
              ? ` - ${globalData.globalActivity.activityName}`
              : ' - Ready'}
          </Text>
          {isWorkActivityActive() && (
            <Text style={styles.statusTime}>
              Duration: {globalData.globalActivity.duration}
            </Text>
          )}
          {isWorkActivityActive() && (
            <Text style={styles.activityText}>
              🟢 Active: {globalData.globalActivity.activityName}
            </Text>
          )}
        </View>

        {loadCount > 0 && renderProgressBar()}
      </View>

      {/* Workflow Steps Buttons */}
      <View style={styles.stepsContainer}>
        <Text style={styles.sectionTitle}>Workflow Steps:</Text>

        <View style={styles.stepsRow}>
          {workflowSteps.map(step => (
            <View key={step.step} style={styles.stepCard}>
              <TouchableOpacity
                style={[
                  styles.stepButton,
                  {backgroundColor: step.color},
                  isWorkActivityActive(step.name.toUpperCase()) &&
                    styles.activeStepButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={() => handleStepButton(step.step)}
                disabled={isLoading}
                activeOpacity={0.8}>
                <View style={styles.leftContent}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <View style={styles.textContent}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.rightContent}>
                  {isWorkActivityActive(step.name.toUpperCase()) && (
                    <>
                      <Text style={styles.stepTimer}>
                        {globalData.globalActivity.duration}
                      </Text>
                      <View style={styles.runningIndicator}>
                        <Text style={styles.runningText}>● ACTIVE</Text>
                      </View>
                    </>
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
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{globalData.workData.hours}</Text>
            <Text style={styles.statLabel}>Working Hours</Text>
          </View>
        </View>

        {/* Last Cycle Info */}
        {globalData.workData.lastCycle && (
          <View style={styles.lastCycleContainer}>
            <Text style={styles.lastCycleTitle}>Last Completed Truck:</Text>
            <Text style={styles.lastCycleText}>
              Truck #{globalData.workData.lastCycle.truckNumber} -{' '}
              {globalData.workData.lastCycle.totalBcm} BCM
            </Text>
            <Text style={styles.lastCycleTime}>
              Completed: {globalData.workData.lastCycle.completedAt}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {isWorkActivityActive() && (
          <TouchableOpacity
            style={[styles.stopButton, isLoading && styles.disabledButton]}
            onPress={() => globalData.stopGlobalActivity(true)}
            disabled={isLoading}>
            <Text style={styles.stopButtonText}>
              {isLoading ? 'Saving...' : 'Stop Current Activity'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.resetButton, isLoading && styles.disabledButton]}
          onPress={resetAllData}
          disabled={isLoading}>
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
  statusInfo: {
    marginBottom: 10,
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
  activityText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
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
  disabledButton: {
    opacity: 0.6,
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
    color: '#FFEB3B',
    fontFamily: 'monospace',
    marginBottom: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  lastCycleContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  lastCycleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lastCycleText: {
    fontSize: 13,
    color: '#666',
  },
  lastCycleTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
