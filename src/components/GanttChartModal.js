import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiService from '../services/ApiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const GanttChartModal = ({
  visible,
  onClose,
  sessionNumber,
  operatorName,
  shiftType,
}) => {
  const [ganttData, setGanttData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Gantt data when modal opens
  useEffect(() => {
    if (visible && sessionNumber) {
      loadGanttData();
    }
  }, [visible, sessionNumber]);

  const loadGanttData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading Gantt data for session:', sessionNumber);

      const response = await apiService.getGanttData(sessionNumber);
      console.log('Raw API response:', response);

      if (response.success) {
        console.log('Raw data before formatting:', response.data);
        const formattedData = apiService.formatGanttDataForChart(response.data);
        console.log('Formatted data:', formattedData);
        setGanttData(formattedData);
        console.log('Gantt data loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to load Gantt data');
      }
    } catch (err) {
      console.error('Error loading Gantt data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Category colors
  const categoryColors = {
    initial: '#00BCD4',
    work: '#4CAF50',
    delay: '#FF5722',
    idle: '#9E9E9E',
    mt: '#673AB7',
  };

  // Get shift time range
  const getShiftTimeRange = () => {
    if (shiftType === 'DAY') {
      return {start: 6, end: 18, label: '06:00 - 18:00'};
    } else {
      return {start: 18, end: 6, label: '18:00 - 06:00'};
    }
  };

  // Generate time labels for chart
  const generateTimeLabels = () => {
    const {start, end} = getShiftTimeRange();
    const labels = [];

    if (shiftType === 'DAY') {
      // Day shift: 6 AM to 6 PM
      for (let hour = start; hour <= end; hour += 1) {
        labels.push({
          hour,
          label: `${hour.toString().padStart(2, '0')}:00`,
          position: ((hour - start) / (end - start)) * 100,
        });
      }
    } else {
      // Night shift: 6 PM to 6 AM (cross midnight)
      for (let i = 0; i <= 12; i += 1) {
        const hour = (start + i) % 24;
        labels.push({
          hour,
          label: `${hour.toString().padStart(2, '0')}:00`,
          position: (i / 12) * 100,
        });
      }
    }

    return labels;
  };

  // Calculate activity position and width
  const calculateActivityPosition = (startTime, endTime) => {
    const {start} = getShiftTimeRange();
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : new Date();

    let startHour = startDate.getHours() + startDate.getMinutes() / 60;
    let endHour = endDate.getHours() + endDate.getMinutes() / 60;

    // Handle night shift crossing midnight
    if (shiftType === 'NIGHT') {
      if (startHour < 12) startHour += 24; // Next day hours
      if (endHour < 12) endHour += 24;

      const shiftStart = 18; // 6 PM
      const shiftDuration = 12; // 12 hours

      const position = ((startHour - shiftStart) / shiftDuration) * 100;
      const width = ((endHour - startHour) / shiftDuration) * 100;

      return {
        left: Math.max(0, Math.min(100, position)),
        width: Math.max(1, Math.min(100 - position, width)),
      };
    } else {
      // Day shift
      const shiftDuration = 12; // 12 hours (6 AM to 6 PM)

      const position = ((startHour - start) / shiftDuration) * 100;
      const width = ((endHour - startHour) / shiftDuration) * 100;

      return {
        left: Math.max(0, Math.min(100, position)),
        width: Math.max(1, Math.min(100 - position, width)),
      };
    }
  };

  // Calculate summary percentages
  const calculateSummaryPercentages = summary => {
    const totalSeconds = summary.reduce(
      (sum, item) => sum + item.totalSeconds,
      0,
    );

    return summary.map(item => ({
      ...item,
      percentage:
        totalSeconds > 0
          ? Math.round((item.totalSeconds / totalSeconds) * 100)
          : 0,
    }));
  };

  const timeLabels = generateTimeLabels();
  const {label: shiftLabel} = getShiftTimeRange();

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
              <Text style={styles.loadingText}>Loading timeline...</Text>
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
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}><Icon name="chart-timeline-variant" size={20} color="#333" /> Activity Timeline</Text>
              <Text style={styles.subtitle}>
                {operatorName} • {shiftType} Shift ({shiftLabel})
              </Text>
              <Text style={styles.sessionInfo}>
                Session: {sessionNumber?.slice(-8) || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}><Icon name="alert-circle" size={16} color="#F44336" /> {error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadGanttData}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : ganttData ? (
              <>
                {/* Gantt Chart */}
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Activity Timeline</Text>

                  {/* Time Labels */}
                  <View style={styles.timeLabelsContainer}>
                    {timeLabels.map((label, index) => (
                      <View
                        key={index}
                        style={[
                          styles.timeLabel,
                          {left: `${label.position}%`},
                        ]}>
                        <Text style={styles.timeLabelText}>{label.label}</Text>
                        <View style={styles.timeLabelLine} />
                      </View>
                    ))}
                  </View>

                  {/* Chart Background */}
                  <View style={styles.chartBackground}>
                    {/* Time Grid Lines */}
                    {timeLabels.map((label, index) => (
                      <View
                        key={index}
                        style={[styles.gridLine, {left: `${label.position}%`}]}
                      />
                    ))}

                    {/* Activity Bars */}
                    <View style={styles.activityTrack}>
                      {ganttData.timeline && ganttData.timeline.length > 0 ? (
                        ganttData.timeline.map((activity, index) => {
                          const position = calculateActivityPosition(
                            activity.startTime,
                            activity.endTime,
                          );

                          return (
                            <View
                              key={index}
                              style={[
                                styles.activityBar,
                                {
                                  left: `${position.left}%`,
                                  width: `${position.width}%`,
                                  backgroundColor:
                                    activity.color ||
                                    categoryColors[activity.category],
                                },
                              ]}>
                              <Text
                                style={styles.activityBarText}
                                numberOfLines={1}>
                                {activity.activityName}
                              </Text>
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.noActivitiesContainer}>
                          <Text style={styles.noActivitiesText}>
                            No activities recorded
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Category Legend */}
                <View style={styles.legendContainer}>
                  <Text style={styles.legendTitle}>Categories</Text>
                  <View style={styles.legendGrid}>
                    {ganttData.categories.map((category, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            {backgroundColor: category.color},
                          ]}
                        />
                        <Text style={styles.legendText}>{category.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Summary Statistics */}
                {ganttData.summary && ganttData.summary.length > 0 && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}><Icon name="chart-bar" size={16} color="#333" /> Category Summary</Text>
                    <View style={styles.summaryGrid}>
                      {calculateSummaryPercentages(ganttData.summary).map(
                        (item, index) => (
                          <View key={index} style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                              <View
                                style={[
                                  styles.summaryCategoryIndicator,
                                  {
                                    backgroundColor:
                                      categoryColors[item.category],
                                  },
                                ]}
                              />
                              <Text style={styles.summaryCategoryName}>
                                {item.category.toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.summaryTime}>
                              {item.totalFormatted}
                            </Text>
                            <Text style={styles.summaryPercentage}>
                              {item.percentage}%
                            </Text>
                            <Text style={styles.summaryCount}>
                              {item.count} activities
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                )}

                {/* Detail Kronologis */}
                {ganttData.chronologicalDetails &&
                  ganttData.chronologicalDetails.length > 0 && (
                    <View style={styles.chronologicalContainer}>
                      <Text style={styles.chronologicalTitle}>
                        <Icon name="format-list-numbered" size={16} color="#333" /> Detail Aktivitas
                      </Text>
                      <View style={styles.chronologicalList}>
                        {ganttData.chronologicalDetails.map(
                          (activity, index) => (
                            <View
                              key={activity.id}
                              style={styles.chronologicalItem}>
                              {/* Activity Number */}
                              <View style={styles.activityNumber}>
                                <Text style={styles.activityNumberText}>
                                  {activity.sequence}
                                </Text>
                              </View>

                              {/* Activity Details */}
                              <View style={styles.activityDetails}>
                                <View style={styles.activityHeader}>
                                  <Text
                                    style={styles.activityName}
                                    numberOfLines={1}>
                                    {activity.activityName}
                                  </Text>
                                  {activity.activityCode && (
                                    <Text style={styles.activityCode}>
                                      {activity.activityCode}
                                    </Text>
                                  )}
                                </View>

                                <View style={styles.activityTimeInfo}>
                                  <Text style={styles.activityTimeRange}>
                                    {activity.timeRange}
                                  </Text>
                                  <Text style={styles.activityDuration}>
                                    ({activity.duration})
                                  </Text>
                                </View>
                              </View>

                              {/* Category Badge */}
                              <View style={styles.activityCategory}>
                                <View
                                  style={[
                                    styles.categoryBadge,
                                    {backgroundColor: activity.categoryColor},
                                  ]}>
                                  <Text style={styles.categoryText}>
                                    {activity.categoryName}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  )}
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  <Icon name="chart-timeline-variant" size={48} color="#666" />
                  {"\n"}No timeline data available
                </Text>
                <Text style={styles.noDataSubtext}>
                  Start working to see your activity timeline
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadGanttData}
              disabled={loading}>
              <Text style={styles.refreshText}><Icon name="refresh" size={16} color="white" /> Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={onClose}>
              <Text style={styles.closeFooterText}>Close</Text>
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
    height: screenHeight * 0.9, // Fixed: Set explicit height
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

  // Header - Fixed positioning
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
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
  sessionInfo: {
    fontSize: 12,
    color: '#999',
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

  // Content - Fixed scrolling
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Error State
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Chart Container
  chartContainer: {
    marginVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },

  // Time Labels
  timeLabelsContainer: {
    height: 30,
    position: 'relative',
    marginBottom: 10,
  },
  timeLabel: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{translateX: -20}], // Center the label
  },
  timeLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  timeLabelLine: {
    width: 1,
    height: 8,
    backgroundColor: '#ddd',
    marginTop: 2,
  },

  // Chart Background
  chartBackground: {
    height: 80,
    backgroundColor: 'white',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#f0f0f0',
  },

  // Activity Track
  activityTrack: {
    flex: 1,
    position: 'relative',
    margin: 5,
  },
  activityBar: {
    position: 'absolute',
    height: 70,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
    minWidth: 2,
  },
  activityBarText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noActivitiesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },

  // Legend
  legendContainer: {
    marginVertical: 15,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },

  // Summary
  summaryContainer: {
    marginVertical: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCategoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  summaryCategoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  summaryTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryPercentage: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 11,
    color: '#999',
  },
  // Detail Aktivitas with Scroll
  chronologicalContainer: {
    marginVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  chronologicalHeadeer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chronologicalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chronologicalCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chronologicalScrollView: {
    maxHeight: 300,
    marginBottom: 5,
  },
  chronologicalScrollContent: {
    paddingBottom: 10,
  },
  chronologicalList: {
    gap: 8,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 5,
  },
  scrollIndicatorText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  chronologicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Activity Number
  activityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Activity Details
  activityDetails: {
    flex: 1,
    marginRight: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  activityCode: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  activityTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityTimeRange: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  activityDuration: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },

  // Category Badge
  activityCategory: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  categoryText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Session Details
  sessionContainer: {
    marginVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  sessionItem: {
    minWidth: '45%',
  },
  sessionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sessionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  // No Data State
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Footer - Fixed positioning
  footerActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
    backgroundColor: 'white',
  },
  refreshButton: {
    flex: 1,
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
  closeFooterButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default GanttChartModal;
