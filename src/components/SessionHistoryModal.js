import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SessionHistoryService from '../services/SessionHistoryService';
import GanttChartModal from './GanttChartModal';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const SessionHistoryModal = ({visible, onClose}) => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showGanttModal, setShowGanttModal] = useState(false);

  // Load session history when modal opens
  useEffect(() => {
    if (visible) {
      loadSessionHistory();
    }
  }, [visible]);

  const loadSessionHistory = async () => {
    setLoading(true);
    try {
      const response = await SessionHistoryService.getSessionHistory(5);

      if (response.success) {
        setSessionHistory(response.data);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error loading session hitory:', error);
      Alert.alert('Error', 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = session => {
    setSelectedSession(session);
    setShowGanttModal(true);
  };

  const renderSessionItem = ({item}) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => handleSessionClick(item)}
      activeOpacity={0.7}>
      {/* Session Header */}
      <View style={styles.sessionHeader}>
        <View style={styles.operatorInfo}>
          <Text style={styles.operatorName}>{item.operatorName}</Text>
          <Text style={styles.operatorId}>ID: {item.operatorId}</Text>
        </View>

        <View style={styles.sessionMeta}>
          <Text style={styles.unitText}>{item.unitId}</Text>
          <View
            style={[
              styles.shiftBadge,
              {
                backgroundColor:
                  item.shiftType === 'DAY' ? '#4CAF50' : '#2196F3',
              },
            ]}>
            <Text style={styles.shiftText}>
              <Icon 
                name={item.shiftType === 'DAY' ? 'weather-sunny' : 'weather-night'} 
                size={10} 
                color="white" 
              /> {item.shiftType}
            </Text>
          </View>
        </View>
      </View>

      {/* Session Details */}
      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Login:</Text>
          <Text style={styles.detailValue}>
            {SessionHistoryService.formatSessionTime(item.loginTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{item.sessionDuration}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>HM:</Text>
          <Text style={styles.detailValue}>
            {item.hmAwal} → {item.hmAkhir} ({item.hmAkhir - item.hmAwal} HM)
          </Text>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.performanceSection}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{item.workHours}</Text>
          <Text style={styles.metricLabel}>Work Hours</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{item.totalLoads}</Text>
          <Text style={styles.metricLabel}>Loads</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{item.productivity}</Text>
          <Text style={styles.metricLabel}>Procuctivity</Text>
        </View>
      </View>

      {/* Activity Summary */}
      <View style={styles.activitySummary}>
        <Text style={styles.activityTitle}>Activities:</Text>
        <View style={styles.activityCounts}>
          <Text style={styles.activityCount}>
            Work: {item.activitySummary.work}
          </Text>
          <Text style={styles.activityCount}>
            Delay: {item.activitySummary.delay}
          </Text>
          <Text style={styles.activityCount}>
            Idle: {item.activitySummary.idle}
          </Text>
          {item.activitySummary.mt > 0 && (
            <Text style={styles.activityCount}>
              MT: {item.activitySummary.mt}
            </Text>
          )}
        </View>
      </View>

      {/* Click Indicator */}
      <View style={styles.clickIndicator}>
        <Text style={styles.clickText}>Tap to view timeline →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="clipboard-text-outline" size={48} color="#999" />
      <Text style={styles.emptyTitle}>No Session History</Text>
      <Text style={styles.emptyText}>
        Complete sessions will apear here for the last 5 days
      </Text>
    </View>
  );

  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading session history...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <Text style={styles.title}><Icon name="history" size={20} color="#333" /> Session History</Text>
                <Text style={styles.subtitle}>
                  Last 5 days • {sessionHistory.length} sessions
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Session List */}
            <View style={styles.listContainer}>
              {sessionHistory.length === 0 ? (
                renderEmptyState()
              ) : (
                <FlatList
                  data={sessionHistory}
                  renderItem={renderSessionItem}
                  keyExtractor={item => item.documentNumber}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadSessionHistory}>
                <Text style={styles.refreshText}><Icon name="refresh" size={16} color="white" /> Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gantt Chart Modal for Selected Session */}
      {selectedSession && (
        <GanttChartModal
          visible={showGanttModal}
          onClose={() => {
            setShowGanttModal(false);
            setSelectedSession(null);
          }}
          sessionNumber={selectedSession.documentNumber}
          operatorName={selectedSession.operatorName}
          shiftType={selectedSession.shiftType}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.9,
    maxHeight: screenHeight * 0.9,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  // List Container
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  // Session Card
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  // Session Header
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  operatorId: {
    fontSize: 12,
    color: '#666',
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  shiftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  shiftText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  // Session Details
  sessionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '$666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  // Performance Section
  performanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  metricCard: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  // Activity Summary
  activitySummary: {
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityCount: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Click Indicator
  clickIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clickText: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SessionHistoryModal;
