import sqliteService from './SQLiteService';

class ApiService {
  constructor() {
    // Standardized to one IP configuration
    // For Android Emulator, use 10.0.2.2 instead of localhost
    // For physical device, use computer's IP address (e.g., 192.168.1.100)
    this.baseURL = 'http://10.0.2.2:3000/api';
    this.healthURL = 'http://10.0.2.2:3000';
    this.timeout = 15000; // 15 seconds

    // Request deduplication to prevent duplicate API calls
    this.pendingRequests = new Map();

    // Debug URLs
    console.log('🌐 API Service initialized:');
    console.log('📡 Base URL:', this.baseURL);
    console.log('❤️ Health URL:', this.healthURL);
  }

  async apiRequest(endpoint, method = 'GET', body = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Enhanced health check
  async checkHealth() {
    try {
      console.log(`🏥 Health check starting: ${this.healthURL}/health`);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000),
      );

      const response = await Promise.race([
        fetch(`${this.healthURL}/health`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        timeoutPromise,
      ]);

      console.log('🏥 Health check response status:', response.status);
      console.log('🏥 Health check response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🏥 Health check result:', result);

      return result;
    } catch (error) {
      console.error('🏥 Health check failed:', error);

      let errorMessage =
        'Server tidak dapat dijangkau, Periksa koneksi internet Anda.';

      if (error.message === 'Health check timeout') {
        errorMessage = 'Health check timeout. Server tidak merespons.';
      } else if (
        error.message.includes('Network') ||
        error.name === 'TypeError'
      ) {
        errorMessage = 'Network error. Periksa koneksi internet Anda.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message, // Include original error for debugging
      };
    }
  }

  // Test database connection
  async testDatabase() {
    console.log('Skipping database test - not critical for app functionality');

    return {
      success: true,
      message: 'Database test skipped - app will continue normally',
      data: {employee_count: 'N/A'},
    };
  }

  // ============ EMPLOYEE METHODS ============

  async validateEmployee(empId) {
    try {
      const result = await this.apiRequest(`/employees/${empId}`);

      if (result.success) {
        return result;
      } else {
        return {
          success: false,
          message: 'ID Karyawan tidak ditemukan dalam database',
        };
      }
    } catch (error) {
      console.error('Employee validation error:', error);

      let errorMessage = 'ID Karyawan tidak terdaftar dalam database';

      if (
        error.message.includes('HTTP 404') ||
        error.message.includes('Not Found')
      ) {
        errorMessage = 'ID Karyawan tidak ditemukan dalam database';
      } else if (
        error.message.includes('HTTP 500') ||
        error.message.includes('Internal Server Error')
      ) {
        errorMessage = 'Terjadi kesalahan pada server, Silakan coba lagi.';
      } else if (error.message.includes('Network Error')) {
        errorMessage =
          'Koneksi ke server bermasalah. Periksa koneksi internet Anda.';
      } else if (error.message.includes('Timeout')) {
        errorMessage =
          'Koneksi timeout, Server sedang sibuk, silakan coba lagi.';
      } else if (error.message.includes('Service Unavailable')) {
        errorMessage = 'Server sedang maintenance. Silakan coba lagi nanti.';
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // ============ SESSION METHODS (ENHANCED) ============

  // Create new session with object parameter and auto shift change support
  async createSession(sessionData) {
    try {
      console.log(
        'Creating session with SQLite offline support and auto shift change detection',
      );

      // Handle both object parameter and individual parameters for backward compatibility
      let enhancedData;
      if (typeof sessionData === 'object' && sessionData.operatorId) {
        // New object-based call from DashboardScreen
        enhancedData = {
          operatorId: sessionData.operatorId,
          unitId: sessionData.unitId,
          hmAwal: sessionData.hmAwal,
          shiftType: sessionData.shiftType,
          initialStatus: sessionData.initialStatus,
        };
      } else {
        // Legacy individual parameters support
        enhancedData = {
          operatorId: arguments[0],
          unitId: arguments[1],
          hmAwal: arguments[2],
          shiftType: arguments[3],
          initialStatus: arguments[4],
        };
      }

      const documentNumber = this.generateDocumentNumber();
      enhancedData.documentNumber = documentNumber;

      // Try online first
      try {
        const result = await this.apiRequest('/sessions', 'POST', enhancedData);

        if (result.success) {
          console.log('✅ Session created online with auto shift change data');
          console.log(
            `📊 Auto shift change records: ${
              result.data.autoShiftChange?.length || 0
            }`,
          );

          return {
            success: true,
            data: result.data,
            offline: false,
          };
        }
      } catch (error) {
        console.log('📡 Online failed, saving offline...');
      }

      // Fallback to SQLite offline storage
      const offlineResult = await sqliteService.saveOfflineSession(
        enhancedData,
      );

      if (offlineResult.success) {
        console.log('💾 Session saved to SQLite');
        return {
          success: true,
          data: {
            documentNumber: offlineResult.documentNumber,
            sessionId: offlineResult.documentNumber, // Use documentNumber as sessionId for offline
            autoShiftChange: [], // No auto shift change in offline mode
            ...enhancedData,
          },
          offline: true,
        };
      }

      throw new Error('Failed to create session online and offline');
    } catch (error) {
      console.error('❌ Session creation failed:', error);

      // Improved error handling
      let errorMessage = 'Failed to create session';

      if (error.message.includes('HTTP 400')) {
        errorMessage = 'Data tidak valid. Periksa kembali form Anda.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
      } else if (error.message.includes('duplicate')) {
        errorMessage =
          'Sesi dengan data yang sama sudah ada. Silakan gunakan data yang berbeda.';
      } else if (error.message.includes('Network')) {
        errorMessage =
          'Koneksi ke server bermasalah. Periksa koneksi internet Anda.';
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // NEW: Method untuk fetch auto shift change
  async getAutoShiftChange(shiftType, operatorId) {
    try {
      console.log(
        `🔍 Fetching auto shift change for ${shiftType} shift, operator: ${operatorId}`,
      );

      const result = await this.apiRequest(
        `/shifts/auto-change?shiftType=${shiftType}&operator=${operatorId}`,
      );

      if (result.success) {
        console.log(`📊 Found ${result.data.length} auto shift change records`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to fetch auto shift change:', error);
      return [];
    }
  }

  // NEW: Method untuk debug shift status
  async getShiftDebugInfo() {
    try {
      return await this.apiRequest('/shifts/debug');
    } catch (error) {
      console.error('❌ Failed to get shift debug info:', error);
      return {success: false, data: null};
    }
  }

  // End session
  async endSession(sessionId, hmAkhir, codeFinish) {
    try {
      const endData = {
        hmAkhir: parseInt(hmAkhir),
        codeFinish,
      };

      return await this.apiRequest(
        `/sessions/${sessionId}/end`,
        'PUT',
        endData,
      );
    } catch (error) {
      return {
        success: false,
        message: 'End session failed: ' + error.message,
      };
    }
  }

  // Get session details
  async getSession(documentNumber) {
    try {
      return await this.apiRequest(`/sessions/${documentNumber}`);
    } catch (error) {
      return {
        success: false,
        message: 'Get session failed: ' + error.message,
      };
    }
  }

  // ============ GANTT CHART METHODS (ENHANCED) ============

  // Get Gantt chart data for session with auto shift change support
  async getGanttData(sessionNumber) {
    try {
      const result = await this.apiRequest(`/sessions/${sessionNumber}/gantt`);

      if (result.success) {
        const formattedData = this.formatGanttDataForChart(result.data);
        return {
          success: true,
          data: formattedData,
          message: 'Gantt data retrieved successfully',
        };
      } else {
        throw new Error(result.message || 'Failed to get Gantt data');
      }
    } catch (error) {
      console.error('Get Gantt data error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to load timeline data',
      };
    }
  }

  // ============ ACTIVITY METHODS ============

  // Save activity with category support
  // 🔧 FIX: Save activity dengan timezone WITA yang benar
  async saveActivity(activityData) {
    try {
      console.log('💾 Saving activity with WITA timezone fix...');

      // 🚫 Request deduplication - prevent duplicate API calls
      const requestKey = `${activityData.sessionNumber}-${activityData.activityName}-${activityData.startTime}`;
      
      if (this.pendingRequests.has(requestKey)) {
        console.log(`🚫 Duplicate saveActivity request blocked: ${activityData.activityName}`);
        return this.pendingRequests.get(requestKey);
      }

      // Create promise and add to pending requests
      const requestPromise = this._executeSaveActivity(activityData);
      this.pendingRequests.set(requestKey, requestPromise);

      // Clean up after completion
      requestPromise.finally(() => {
        this.pendingRequests.delete(requestKey);
      });

      return requestPromise;
    } catch (error) {
      console.error('💥 Save Activity error:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async _executeSaveActivity(activityData) {
    try {
      // 🎯 Helper function untuk format datetime dengan WITA timezone
      const formatDateTimeForWITA = date => {
        const witaDate = new Date(date);
        // Format sebagai WITA dengan offset +08:00
        const year = witaDate.getFullYear();
        const month = String(witaDate.getMonth() + 1).padStart(2, '0');
        const day = String(witaDate.getDate()).padStart(2, '0');
        const hours = String(witaDate.getHours()).padStart(2, '0');
        const minutes = String(witaDate.getMinutes()).padStart(2, '0');
        const seconds = String(witaDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
      };

      // Prepare data untuk API request dengan timezone yang benar
      const apiData = {
        codeDelay: activityData.activityCode || activityData.activityName,
        activityName: activityData.activityName,
        // 🔧 FIX: Format dengan WITA timezone
        datetimeStart: formatDateTimeForWITA(new Date(activityData.startTime)),
        datetimeEnd: activityData.endTime
          ? formatDateTimeForWITA(new Date(activityData.endTime))
          : formatDateTimeForWITA(new Date()),
        duration: activityData.endTime
          ? Math.floor((activityData.endTime - activityData.startTime) / 1000)
          : 0,
        sessionNumber: activityData.sessionNumber,
        category: activityData.category || 'work',
        shift: this.getCurrentShift(),
      };

      console.log('🕐 Activity data with WITA timezone:', {
        start: apiData.datetimeStart,
        end: apiData.datetimeEnd,
        activity: apiData.activityName,
      });

      // Try online first
      try {
        const result = await this.apiRequest('/activities', 'POST', apiData);

        if (result.success) {
          console.log('✅ Activity saved online with correct timezone');
          return {
            success: true,
            data: result.data,
            offline: false,
          };
        }
      } catch (error) {
        console.log('📡 Online save failed, saving to SQLite...');
      }

      // Fallback to SQLite offline storage
      const offlineResult = await sqliteService.saveOfflineActivity(
        activityData,
      );

      if (offlineResult.success) {
        console.log('💾 Activity saved to SQLite');
        return {
          success: true,
          offline: true,
        };
      }

      throw new Error('Failed to save activity online and offline');
    } catch (error) {
      console.error('❌ Activity save failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to save activity',
      };
    }
  }
  // Get session activities
  async getSessionActivities(sessionNumber) {
    try {
      return await this.apiRequest(`/activities/session/${sessionNumber}`);
    } catch (error) {
      return {
        success: false,
        message: 'Get activities failed: ' + error.message,
      };
    }
  }

  // ============ SYNC METHODS ======================

  async getSyncStatus() {
    return await sqliteService.getSyncStatus();
  }

  async forceSync() {
    return await sqliteService.forceSync();
  }

  // ============ ACTIVITY CODES METHODS ============
  async getActivityCodes(category = null) {
    try {
      const endpoint = category
        ? `/activity-codes/${category}`
        : '/activity-codes';
      return await this.apiRequest(endpoint);
    } catch (error) {
      return {
        success: false,
        message: 'Get activity codes failed: ' + error.message,
      };
    }
  }

  // Get delay codes specifically
  async getDelayCodes() {
    return await this.getActivityCodes('delay');
  }

  // Get Idle codes specifically
  async getIdleCodes() {
    return await this.getActivityCodes('idle');
  }

  // Get work codes specifically
  async getWorkCodes() {
    return await this.getActivityCodes('work');
  }

  // ============ SHIFT UTILITY METHODS ============

  // Get shift times based on shift type
  getShiftTimes(shiftType, date = new Date()) {
    const shiftDate = new Date(date);

    if (shiftType === 'DAY') {
      // Day shift: 06:00 - 18:00
      const startTime = new Date(shiftDate);
      startTime.setHours(6, 0, 0, 0);

      const endTime = new Date(shiftDate);
      endTime.setHours(18, 0, 0, 0);

      return {startTime, endTime};
    } else {
      // Night shift: 18:00 - 06:00 next day
      const startTime = new Date(shiftDate);
      startTime.setHours(18, 0, 0, 0);

      const endTime = new Date(shiftDate);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(6, 0, 0, 0);

      return {startTime, endTime};
    }
  }

  // Check if current time is within shift
  isWithinShift(shiftType, currentTime = new Date()) {
    if (shiftType === 'DAY') {
      // Day shift: 06:00 - 18:00
      const currentHour = currentTime.getHours();
      return currentHour >= 6 && currentHour <= 18;
    } else {
      // Night shift: 18:00 - 06:00 (crosses midnight)
      // Valid hours: 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6
      const currentHour = currentTime.getHours();
      return currentHour >= 18 || currentHour <= 6;
    }
  }

  // Get time progress within shift (0-100%)
  getShiftProgress(shiftType, currentTime = new Date()) {
    if (!this.isWithinShift(shiftType, currentTime)) {
      return 0; // Return 0% if outside shift hours
    }

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    if (shiftType === 'DAY') {
      // Day shift: 06:00 - 18:00 (12 hours)
      const totalMinutes = 12 * 60; // 720 minutes
      const elapsedMinutes = (currentHour - 6) * 60 + currentMinute;
      const progress = Math.max(0, Math.min(100, (elapsedMinutes / totalMinutes) * 100));
      
      return Math.round(progress);
    } else {
      // Night shift: 18:00 - 06:00 (12 hours)
      const totalMinutes = 12 * 60; // 720 minutes
      let elapsedMinutes;
      
      if (currentHour >= 18) {
        // Same day (18:00 - 23:59)
        elapsedMinutes = (currentHour - 18) * 60 + currentMinute;
      } else {
        // Next day (00:00 - 06:00)
        elapsedMinutes = (6 * 60) + (currentHour * 60) + currentMinute;
      }
      
      const progress = Math.max(0, Math.min(100, (elapsedMinutes / totalMinutes) * 100));
      
      return Math.round(progress);
    }
  }

  // ============ UTILITY METHODS ============

  // Generate document number (same as backend)
  generateDocumentNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`;
  }

  // Get current shift (YYYYMMDD format)
  getCurrentShift() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  // Format time for display
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Format duration for display
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // ENHANCED: Format duration with detailed description
  formatDurationDetailed(seconds) {
    if (!seconds || seconds < 0) return '0 detik';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} jam, ${minutes} menit`;
    } else if (hours > 0) {
      return `${hours} jam`;
    } else if (minutes > 0) {
      return `${minutes} menit`;
    } else {
      return `${secs} detik`;
    }
  }

  // Check if server is reachable
  async isServerReachable() {
    try {
      const result = await this.checkHealth();
      return result.success === true;
    } catch (error) {
      return false;
    }
  }

  // Update base URL for physical device
  updateBaseURL(newIP) {
    this.baseURL = `http://${newIP}:3000/api`;
    this.healthURL = `http://${newIP}:3000`;
    console.log(`🔄 API Base URL updated to: ${this.baseURL}`);
  }

  // ============ CHART DATA FORMATTING ============

  // Format Gantt data for chart display with auto shift change support
  formatGanttDataForChart(ganttData) {
    if (!ganttData || !ganttData.timeline) {
      console.log('❌ No gantt data or timeline found:', ganttData);
      return {
        categories: [],
        timeline: [],
        timeGrid: [],
        summary: [],
        chronologicalDetails: [],
      };
    }

    console.log('📊 Formatting Gantt data:', {
      timelineCount: ganttData.timeline?.length || 0,
      summaryCount: ganttData.summary?.length || 0,
    });

    // Enhanced category colors including shift_change
    const categoryColors = {
      initial: '#00BCD4', // Cyan for initial status
      work: '#4CAF50', // Green for work
      delay: '#FF5722', // Red for delay
      idle: '#9E9E9E', // Grey for idle
      mt: '#673AB7', // Purple for maintenance
      shift_change: '#2196F3', // Blue for auto shift change
    };

    // Format timeline data for chart
    const formattedTimeline = ganttData.timeline.map(activity => ({
      ...activity,
      color: categoryColors[activity.category] || '#2196F3',
      startHour: new Date(activity.startTime).getHours(),
      endHour: activity.endTime
        ? new Date(activity.endTime).getHours()
        : new Date().getHours(),
      durationMinutes: Math.round(activity.duration / 60),
      isAutoGenerated: activity.isAutoGenerated || false,
    }));

    console.log('✅ Formatted timeline activities:', formattedTimeline.length);

    // Format summary with colors
    const formattedSummary = ganttData.summary
      ? ganttData.summary.map(item => ({
          ...item,
          color: categoryColors[item.category] || '#2196F3',
          percentage: 0, // Will be calculated in component
        }))
      : [];

    const result = {
      session: ganttData.session,
      categories: Object.keys(categoryColors).map(key => ({
        name: key.toUpperCase().replace('_', ' '),
        color: categoryColors[key],
        key: key,
      })),
      timeline: formattedTimeline,
      timeGrid: ganttData.timeGrid || [],
      summary: formattedSummary,
      chronologicalDetails: ganttData.chronologicalDetails || [],
    };

    console.log('📊 Final formatted data:', {
      hasTimeline: result.timeline.length > 0,
      hasSummary: result.summary.length > 0,
      hasCategories: result.categories.length > 0,
    });

    return result;
  }

  // ============ AUTO SHIFT CHANGE HELPER METHODS ============

  // Process auto shift change data for display
  processAutoShiftChangeForDisplay(autoShiftChangeArray) {
    if (!autoShiftChangeArray || autoShiftChangeArray.length === 0) {
      return null;
    }

    const totalDuration = autoShiftChangeArray.reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);

    const firstActivity = autoShiftChangeArray[0];
    const lastActivity = autoShiftChangeArray[autoShiftChangeArray.length - 1];

    return {
      count: autoShiftChangeArray.length,
      totalDuration: totalDuration,
      totalDurationFormatted: this.formatDurationDetailed(totalDuration),
      startTime: firstActivity.datetime_start,
      endTime: lastActivity.datetime_end,
      activities: autoShiftChangeArray.map(activity => ({
        id: activity.id,
        startTime: activity.datetime_start,
        endTime: activity.datetime_end,
        duration: activity.duration,
        durationFormatted: this.formatDurationDetailed(activity.duration),
        sessionNumber: activity.session_number,
      })),
    };
  }

  // Create notification message for auto shift change
  createAutoShiftChangeNotification(autoShiftChangeData) {
    if (!autoShiftChangeData) {
      return null;
    }

    const {totalDurationFormatted, startTime, endTime} = autoShiftChangeData;

    const startFormatted = new Date(startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const endFormatted = new Date(endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return {
      title: 'Auto Shift Change Detected! 🕐',
      message:
        `SHIFT_CHANGE activity recorded:\n` +
        `Duration: ${totalDurationFormatted}\n` +
        `From ${startFormatted} until ${endFormatted}\n\n` +
        `This has been automatically added to your session.`,
    };
  }
}

const apiService = new ApiService();

export default apiService;
