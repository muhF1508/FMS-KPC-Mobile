import AsyncStorage from '@react-native-async-storage/async-storage';

class ActivityHistoryService {
  // Generate unique key for operator's daily history
  // Format : activity_history_YYYY_MM_DD_OPERATOR_ID
  static async getHistoryKey(operatorId) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `activity_history_${today}_${operatorId}`;
  }

  /**
   * Load activity history for specific operator and date
   * @param {string} operatorId - Operator ID
   * @returns {Array} Array of activity history items
   */
  static async loadHistory(operatorId) {
    try {
      const key = await this.getHistoryKey(operatorId);
      const savedHistory = await AsyncStorage.getItem(key);

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log(
          `📚 Loaded ${parsedHistory.length} history items for operator ${operatorId}`,
        );
        return parsedHistory;
      }

      console.log(`📚 No history found for operator ${operatorId}`);
      return [];
    } catch (error) {
      console.error('Failed to load activity history:', error);
      return [];
    }
  }

  /**
   * Save activity history for specific operator
   * @param {string} operatorId - Operator ID
   * @param {Array} history - Array of history items
   * @returns {boolean} Success status
   */
  static async saveHistory(operatorId, history) {
    try {
      const key = await this.getHistoryKey(operatorId);
      await AsyncStorage.setItem(key, JSON.stringify(history));
      console.log(
        `💾 Saved ${history.length} history items for operator ${operatorId}`,
      );
      return true;
    } catch (error) {
      console.error('Failed to save activity history:', error);
      return false;
    }
  }

  /**
   * Add new activity to history
   * @param {string} operatorId - Operator ID
   * @param {Object} activityData = Activity data to add
   * @returns {Array|null} Updated history array or null if failed
   */
  static async addActivity(operatorId, activityData) {
    try {
      if (!this.validateActivityData(activityData)) {
        console.warn('Invalid activity data, skipping history save');
        return null;
      }

      const history = await this.loadHistory(operatorId);

      const historyItem = {
        id: Date.now() + Math.random(), // Unique ID
        ...activityData,
        timestamp: new Date().toISOString(),
      };

      // Add to beginning and limit to 50 items
      const newHistory = [historyItem, ...history].slice(0, 50);

      const success = await this.saveHistory(operatorId, newHistory);
      if (success) {
        console.log(
          `✅ Added activity to history: ${activityData.activityName}`,
        );
        return newHistory;
      }

      return null;
    } catch (error) {
      console.error('Failed to add activity to history:', error);
      return null;
    }
  }

  /**
   * Clear all history for specific operator and date
   * @param {string} operatorId - Operator ID
   * @returns {boolean} Success status
   */
  static async clearHistory(operatorId) {
    try {
      const key = await this.getHistoryKey(operatorId);
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cleared history for operator ${operatorId}`);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Get activity statistics for specific operator
   * @param {string} operatorId - Operator ID
   * @returns {Object} Statistics object
   */
  static async getActivityStats(operatorId) {
    try {
      const history = await this.loadHistory(operatorId);
      const today = new Date().toISOString().slice(0, 10);

      const todayActivities = history.filter(
        activity => activity.timestamp.slice(0, 10) === today,
      );

      const totalDuration = todayActivities.reduce(
        (sum, activity) => sum + (activity.totalSeconds || 0),
        0,
      );

      const categories = todayActivities.reduce((acc, activity) => {
        const tab = activity.sourceTab;
        if (!acc[tab]) {
          acc[tab] = {count: 0, duration: 0, activities: []};
        }
        acc[tab].count++;
        acc[tab].duration += activity.totalSeconds || 0;
        acc[tab].activities.push(activity);
        return acc;
      }, {});

      // Get most frequent activity
      const activityCounts = todayActivities.reduce((acc, activity) => {
        const key = activity.activityCode;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const mostFrequentActivity =
        Object.entries(activityCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        null;

      return {
        totalActivities: todayActivities.length,
        totalDuration: totalDuration,
        totalDurationFormatted: this.formatDuration(totalDuration),
        categories: categories,
        mostFrequentActivity: mostFrequentActivity,
        averageDuration:
          todayActivities.length > 0
            ? Math.round(totalDuration / todayActivities.length)
            : 0,
      };
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalDurationFormatted: '0m',
        categories: {},
        mostFrequentActivity: null,
        averageDuration: 0,
      };
    }
  }

  /**
   * Get recent activities for quick repeat
   * @param {string} operatorId - Operator ID
   * @param {number} limit - Number of recent activites to return
   * @returns {Array} Array of recent activities
   */
  static async getRecentActivities(operatorId, limit = 5) {
    try {
      const history = await this.loadHistory(operatorId);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }

  /**
   * Search activities by name or code
   * @param {string} operatorId - Operator ID
   * @param {string} query - Search query
   * @returns {Array} Array of matching activities
   */
  static async searchActivities(operatorId, query) {
    try {
      const history = await this.loadHistory(operatorId);
      const lowerQuery = query.toLowerCase();

      return history.filter(
        activity =>
          activity.activityName.toLowerCase().includes(lowerQuery) ||
          activity.activityCode.toLowerCase().includes(lowerQuery),
      );
    } catch (error) {
      console.error('Failed to search activities:', error);
      return [];
    }
  }

  /**
   * Export history data for specific date range
   * @param {string} operatorId - Operator ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End Date (YYYY-MM-DD)
   * @returns {Array} Array of activities in date range
   */
  static async exportHistoryRange(operatorId, startDate, endDate) {
    try {
      const allHistory = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Loop through each date in range
      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateString = date.toISOString().slice(0, 10);
        const key = `activity_history_${dateString}_${operatorId}`;

        try {
          const dayHistory = await AsyncStorage.getItem(key);
          if (dayHistory) {
            const parsedHistory = JSON.parse(dayHistory);
            allHistory.push(...parsedHistory);
          }
        } catch (dayError) {
          console.warn(`Failed to load history for ${dateString}:`, dayError);
        }
      }

      // Sort by timestamp descending
      return allHistory.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    } catch (error) {
      console.error('Failed to export history range:', error);
      return [];
    }
  }

  /**
   * Get history count for specific opeartor (for badge display)
   * @param {string} operatorId - Operator ID
   * @returns {number} Number of activities today
   */
  static async getHistoryCount(operatorId) {
    try {
      const history = await this.loadHistory(operatorId);
      return history.length;
    } catch (error) {
      console.error('Failed to get history count:', error);
      return 0;
    }
  }

  /**
   * Cleanup old history files (older tah specified days)
   * @param {string} operatorId - Operator ID
   * @param {number} daysToKeep - Number of days to keep (default: 30)
   * @returns {boolean} Success status
   */
  static async cleanUpOldHistory(operatorId, daysToKeep = 30) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const historyKeys = allKeys.filter(
        key =>
          key.startsWith('activity_history_') && key.endsWith(`_${operatorId}`),
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffString = cutoffDate.toISOString().slice(0, 10);

      const keysToDelete = historyKeys.filter(key => {
        const dateMatch = key.match(/activity_history_(\d{4}-\d{2}-\d{2})_/);
        if (dateMatch) {
          const keyDate = dateMatch[1];
          return keyDate < cutoffString;
        }
        return false;
      });

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        console.log(
          `🧹 Cleaned up ${keysToDelete.length} old history files for operator ${operatorId}`,
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to cleanup old history:', error);
      return false;
    }
  }

  /**
   * Validate activity data before saving
   * @param {Object} activityData - Activity data to validate
   * @returns {boolean} Is valid
   */
  static validateActivityData(activityData) {
    const required = [
      'activityName',
      'activityCode',
      'sourceTab',
      'startTime',
      'endTime',
    ];

    for (const field of required) {
      if (!activityData[field]) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    if (activityData.totalSeconds && activityData.totalSeconds < 1) {
      console.warn('Activity duration too short');
      return false;
    }

    // Validate dates
    try {
      const startTime = new Date(activityData.startTime);
      const endTime = new Date(activityData.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.warn('Invalid date format');
        return false;
      }

      if (endTime <= startTime) {
        console.warn('End time must be after start time');
        return false;
      }
    } catch (error) {
      console.warn('Date validation error:', error);
      return false;
    }

    return true;
  }

  /**
   * Format duration in seconds  to human readable string
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  static formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Get activity frequency analysis
   * @param {string} operatorId - Operator ID
   * @param {number} days - Number of days to analyze (default: 7)
   * @returns {Object} Frequency analysis
   */
  static async getActivityFrequency(operatorId, days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const historyRange = await this.exportHistoryRange(
        operatorId,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
      );

      const frequency = historyRange.reduce((acc, activity) => {
        const key = `${activity.activityCode}-${activity.activityName}`;
        if (!acc[key]) {
          acc[key] = {
            activityCode: activity.activityCode,
            activityName: activity.activityName,
            sourceTab: activity.sourceTab,
            count: 0,
            totalDuration: 0,
          };
        }
        acc[key].count++;
        acc[key].totalDuration += activity.totalSeconds || 0;
        return acc;
      }, {});

      // Sort by frequency
      const sortedFrequency = Object.values(frequency).sort(
        (a, b) => b.count - a.count,
      );

      return {
        totalActivities: historyRange.length,
        uniqueActivities: sortedFrequency.length,
        mostFrequent: sortedFrequency.slice(0, 5),
        analysis: sortedFrequency,
      };
    } catch (error) {
      console.error('Failed to get activity frequency:', error);
      return {
        totalActivities: 0,
        uniqueActivities: 0,
        mostFrequent: [],
        analysis: [],
      };
    }
  }
}

export default ActivityHistoryService;
