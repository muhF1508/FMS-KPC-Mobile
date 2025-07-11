import {startTransition} from 'react';
import apiService from './ApiService';

class SessionHistoryService {
  /**
   * Get session history list from backend
   * @param {number} days - Number of days to fetch (default: 5)
   * @returns {Array} Array of completed sessions
   */
  static async getSessionHistory(days = 5) {
    try {
      console.log(`📚 Loading session history for last ${days} days...`);

      // Check if server is reachable first
      const isServerReachable = await apiService.isServerReachable();
      if (!isServerReachable) {
        throw new Error(
          'Server is not reachable. Please check your connection.',
        );
      }

      const response = await apiService.apiRequest(
        `/sessions/history?days=${days}`,
      );

      if (response.success) {
        console.log(
          `✅ Loaded ${response.data.length} session history records`,
        );
        return {
          success: true,
          data: response.data,
          message: response.message,
        };
      } else {
        throw new Error(response.message || 'Failed to load session history');
      }
    } catch (error) {
      console.error('❌ Session history service error:', error);

      // Return meaningful error message
      let errorMessage = 'Failed to load session history';
      if (error.message.includes('Network')) {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Server might be busy.';
      } else if (error.message.includes('not reachable')) {
        errorMessage = error.message;
      }

      return {
        success: false,
        data: [],
        message: errorMessage,
        offline: true,
      };
    }
  }
  /**
   * Get session details with full Gantt data
   * @param {string} documentNumber - Session document number
   * @returns {Objet} Session with Gantt chart data
   */
  static async getSessionDetails(documentNumber) {
    try {
      console.log(`📊 Loading session details for: ${documentNumber}`);

      const response = await apiService.getGanttData(documentNumber);

      if (response.success) {
        console.log(`✅ Loaded session details successfully`);
        return response;
      } else {
        throw new Error(response.message || 'Failed to load session details');
      }
    } catch (error) {
      console.error('❌ Session details service error:', error);

      return {
        success: false,
        data: null,
        message: error.message || 'Failed to load session details',
      };
    }
  }

  /**
   * Format session time for display
   * @param {string} datetime - ISO datetime string
   * @returns {string} Formatted time
   */
  static formatSessionTime(datetime) {
    try {
      const date = new Date(datetime);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar',
      });
    } catch (error) {
      return datetime || 'N/A';
    }
  }

  /**
   * Get session duration in human readable format
   * @param {string} startTime - Session start time
   * @param {string} endTime - Session end time
   * @returns {string} Duration string
   */
  static getSessionDuration(startTime, endTime) {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      return `${diffHours}h`;
    } catch (error) {
      return 'N/A';
    }
  }
}

export default SessionHistoryService;
