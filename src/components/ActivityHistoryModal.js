import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ActivityHistoryService from '../services/ActivityHistoryService';

const ActivityHistoryModal = ({
  visible,
  onClose,
  operatorId,
  operatorName,
  onRepeatActivity,
}) => {
  const [activityHistory, setActivityHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load history when modal opens
  useEffect(() => {
    if (visible && operatorId) {
      loadHistory();
    }
  }, [visible, operatorId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await ActivityHistoryService.loadHistory(operatorId);
      setActivityHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Gagal memuat riwayat aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = async () => {
    Alert.alert('Clear History', 'Hapus semua riwayat aktivitas hari ini?', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const success = await ActivityHistoryService.clearHistory(operatorId);
          if (success) {
            setActivityHistory([]);
            Alert.alert('Success', 'Riwayat berhasil dihapus');
          } else {
            Alert.alert('Error', 'Gagal menghapus riwayat');
          }
        },
      },
    ]);
  };

  const handleRepeatActivity = activity => {
    Alert.alert(
      'Ulangi Aktivitas',
      `Apakah ingin mengulangi:\n${activity.activityName} (${activity.activityCode})`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya, Ulangi',
          onPress: () => {
            onClose();
            onRepeatActivity(activity);
          },
        },
      ],
    );
  };

  const repeatLastActivity = async () => {
    if (activityHistory.length === 0) {
      Alert.alert('Info', 'Belum ada aktivitas yang pernah dilakukan');
      return;
    }

    const lastActivity = activityHistory[0];
    handleRepeatActivity(lastActivity);
  };

  const getActivityStats = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayActivities = activityHistory.filter(
      activity => activity.timestamp.slice(0, 10) === today,
    );

    const totalDuration = todayActivities.reduce(
      (sum, activity) => sum + (activity.totalSeconds || 0),
      0,
    );

    const categories = todayActivities.reduce((acc, activity) => {
      const tab = activity.sourceTab;
      if (!acc[tab]) {
        acc[tab] = {count: 0, duration: 0};
      }
      acc[tab].count++;
      acc[tab].duration += activity.totalSeconds || 0;
      return acc;
    }, {});

    return {
      totalActivities: todayActivities.length,
      totalDuration:
        totalDuration > 0
          ? Math.floor(totalDuration / 3600) +
            'h ' +
            Math.floor((totalDuration % 3600) / 60) +
            'm'
          : '0m',
      categories,
    };
  };

  const getCategoryColor = category => {
    const colors = {
      work: '#4CAF50',
      delay: '#FF5722',
      idle: '#9E9E9E',
      mt: '#673AB7',
    };
    return colors[category] || '#2196F3';
  };

  const renderActivityItem = ({item, index}) => {
    const formatTimeRange = (startTime, endTime) => {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const startFormatted = start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const endFormatted = end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return `${startFormatted} → ${endFormatted} WITA`;
    };

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleRepeatActivity(item)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.activityIndicator,
            {backgroundColor: getCategoryColor(item.sourceTab)},
          ]}
        />

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityName} numberOfLines={1}>
              {item.activityName}
            </Text>
          </View>

          <View style={styles.activityDetails}>
            <Text style={styles.activityCode}>{item.activityCode}</Text>
            <Text style={styles.activityTab}>
              {item.sourceTab.toUpperCase()}
            </Text>
            <Text style={styles.activityTime}>
              {item.startTime && item.endTime
                ? formatTimeRange(item.startTime, item.endTime)
                : new Date(item.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' WITA'}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.activityDuration}>{item.duration}</Text>
          <View style={styles.repeatButton}>
            <Icon name="refresh" size={16} color="#2196F3" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="clipboard-text-outline" size={48} color="#999" />
      <Text style={styles.emptyTitle}>No Activities Yet</Text>
      <Text style={styles.emptyText}>
        Start your first activity to see it here
      </Text>
    </View>
  );

  const stats = getActivityStats();

  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}><Icon name="history" size={20} color="#333" /> Activity History</Text>
              <Text style={styles.subtitle}>
                {operatorName} • {new Date().toLocaleDateString('id-ID')}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Statistics Dashboard */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}><Icon name="chart-bar" size={16} color="#333" /> Today's Summary</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalActivities}</Text>
                <Text style={styles.statLabel}>Activities</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalDuration}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {Object.keys(stats.categories).length}
                </Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
            </View>

            {/* Category Breakdown */}
            {Object.keys(stats.categories).length > 0 && (
              <View style={styles.categoriesContainer}>
                {Object.entries(stats.categories).map(([category, data]) => (
                  <View
                    key={category}
                    style={[
                      styles.categoryChip,
                      {borderLeftColor: getCategoryColor(category)},
                    ]}>
                    <Text style={styles.categoryName}>
                      {category.toUpperCase()}
                    </Text>
                    <Text style={styles.categoryStats}>
                      {data.count} • {Math.floor(data.duration / 60)}m
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent Activities List - Scrollable Section */}
          <View style={styles.scrollableSection}>
            <Text style={styles.listTitle}>Recent Activities</Text>

            {activityHistory.length === 0 ? (
              renderEmptyState()
            ) : (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}>
                {activityHistory.map((item, index) => (
                  <View key={item.id || index}>
                    {renderActivityItem({item, index})}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                activityHistory.length === 0 && styles.disabledButton,
              ]}
              onPress={repeatLastActivity}
              disabled={activityHistory.length === 0}>
              <Icon name="refresh" size={16} color="white" />
              <Text style={styles.actionText}>Repeat Last</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.clearButton,
                activityHistory.length === 0 && styles.disabledButton,
              ]}
              onPress={handleClearHistory}
              disabled={activityHistory.length === 0}>
              <Icon name="delete" size={16} color="white" />
              <Text style={styles.clearText}>Clear Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    maxHeight: '85%',
    paddingTop: 20,
    flex: 1,
  },
  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Header - Fixed
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  // Statistics - Fixed
  statsContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 15,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryStats: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  // Scrollable Section - NEW
  scrollableSection: {
    flex: 1,
    paddingTop: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 0,
  },
  // Activity Items
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityTab: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  activityTime: {
    fontSize: 11,
    color: '#888',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    fontFamily: 'monospace',
  },
  repeatButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  repeatIcon: {
    fontSize: 16,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  // Actions - Fixed
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ActivityHistoryModal;
