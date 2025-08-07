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

const WorkContent = ({
  globalData,
  updateGlobalData,
  setActiveTab,
  apiService,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Data workflow steps
  const workflowSteps = [
    {
      step: 'spot',
      name: 'SPOT',
      subtitle: 'Truck Positioning',
      color: '#FF9800',
      icon: 'target',
    },
    {
      step: 'load',
      name: 'LOAD',
      subtitle: 'Loading Truck',
      color: '#2196F3',
      icon: 'loading',
    },
  ];

  const handleStepButton = async stepName => {
    const step = workflowSteps.find(s => s.step === stepName);
    if (!step) return;

    // Prevent clicking same activity that's already running
    if (isWorkActivityActive(step.name.toUpperCase())) {
      console.log(`🚫 ${step.name} activity already running, ignoring duplicate click`);
      return;
    }

    setIsLoading(true);

    try {
      // Simple activity switching - like other tabs
      await globalData.startGlobalActivity(step.name, step.name, 'work');
      console.log(`✅ Started ${step.name} activity`);
    } catch (error) {
      console.error('Error handling step:', error);
      Alert.alert('Error', 'Gagal memproses aktivitas');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed complex truck loading logic - now using simple activity switching like other tabs

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

  // Removed progress bar - simplified workflow

  const getConnectionStatus = () => {
    if (!globalData.documentNumber) {
      return (
        <View style={styles.offlineIndicator}>
          <Icon
            name="wifi-off"
            size={14}
            color="#FF9800"
            style={styles.offlineIcon}
          />
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
      <Text style={styles.title}>Work Activities</Text>

      {/* Connection Status */}
      {getConnectionStatus()}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Daily Statistics */}
      <View style={styles.statisticsContainer}>
        <View style={styles.statisticsHeader}>
          <Icon name="chart-bar" size={18} color="#2196F3" />
          <Text style={styles.statisticsTitle}>Statistik Hari Ini</Text>
        </View>

        <View style={styles.statisticsGrid}>
          <View style={styles.statisticsCard}>
            <Icon name="dump-truck" size={24} color="#4CAF50" />
            <Text style={styles.statisticsNumber}>
              {globalData.workData.loads}
            </Text>
            <Text style={styles.statisticsLabel}>Total Trucks</Text>
          </View>

          <View style={styles.statisticsCard}>
            <Icon name="cube-outline" size={24} color="#FF9800" />
            <Text style={styles.statisticsNumber}>
              {globalData.workData.loads * 16}
            </Text>
            <Text style={styles.statisticsLabel}>BCM</Text>
          </View>

          <View style={styles.statisticsCard}>
            <Icon name="clock-outline" size={24} color="#2196F3" />
            <Text style={styles.statisticsNumber}>
              {globalData.workData.hours || '0.00'}
            </Text>
            <Text style={styles.statisticsLabel}>Hours</Text>
          </View>
        </View>

        <View style={styles.productivityCard}>
          <Icon name="trending-up" size={16} color="#673AB7" />
          <Text style={styles.productivityText}>
            Productivity: {globalData.workData.productivity || '0 bcm/h'}
          </Text>
        </View>

        {/* Removed progress bar for simplified workflow */}
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
                  isLoading && !isWorkActivityActive(step.name.toUpperCase()) && styles.disabledButton,
                ]}
                onPress={() => handleStepButton(step.step)}
                disabled={isLoading || isWorkActivityActive(step.name.toUpperCase())}
                activeOpacity={0.8}>
                <View style={styles.leftContent}>
                  <View style={styles.iconContainer}>
                    <Icon name={step.icon} size={28} color="#fff" />
                  </View>
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
  // Daily Statistics Styles
  statisticsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statisticsCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statisticsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  statisticsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  productivityCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productivityText: {
    fontSize: 14,
    color: '#673AB7',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Removed progress bar styles - simplified workflow
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
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
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
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
});

export default WorkContent;
