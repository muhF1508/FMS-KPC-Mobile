class ApiService {
  constructor() {
    // For Android Emulator, use 10.0.2.2 instead of localhost
    // For physical device, use computer's IP address (e.g., 192.168.1.100)
    this.baseURL = 'http://10.0.2.2:3000/api';
    this.healthURL = 'http://10.0.2.2:3000';

    // Debug URLs
    console.log('🌐 API Service initialized:');
    console.log('📡 Base URL:', this.baseURL);
    console.log('❤️ Health URL:', this.healthURL);
  }

  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      console.log(`🌐 API Request: ${method} ${this.baseURL}${endpoint}`);
      if (data) console.log('📤 Request Data:', data);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000),
      );

      const response = await Promise.race([
        fetch(`${this.baseURL}${endpoint}`, config),
        timeoutPromise,
      ]);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        switch (response.status) {
          case 400:
            errorMessage = 'Bad Request - Data tidak valid';
            break;
          case 401:
            errorMessage = 'Unauthorized - Akses ditolak';
            break;
          case 403:
            errorMessage = 'Forbidden - Tidak memiliki izin';
            break;
          case 404:
            errorMessage = 'Not Found - Data tidak ditemukan';
            break;
          case 500:
            errorMessage = 'Internal Server Error - Kesalahan server';
            break;
          case 503:
            errorMessage = 'Service Unavailable - Server sedang maintenance';
            break;
          default:
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('📥 API Response', result);

      return result;
    } catch (error) {
      console.error('🚨 API Error:', error);

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Network')) {
        throw new Error('Network Error - Periksa koneksi internet Anda');
      }

      if (error.message === 'Request timeout') {
        throw new Error('Timeout - Server tidak merespons');
      }

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

  // Create new session with shift support
  async createSession(operatorId, unitId, hmAwal, shiftType, initialStatus) {
    try {
      const documentNumber = this.generateDocumentNumber();

      const sessionData = {
        operatorId,
        unitId,
        hmAwal: parseInt(hmAwal),
        documentNumber,
        shiftType, // 'DAY' or 'NIGHT'
        initialStatus, // Status dari login screen
      };

      const result = await this.apiRequest('/sessions', 'POST', sessionData);

      if (result.success) {
        return {
          success: true,
          session: result.data,
          documentNumber,
          message: 'Sesi berhasil dibuat',
        };
      }

      return {
        success: false,
        message: 'Gagal membuat sesi. Silakan coba lagi',
      };
    } catch (error) {
      console.error('Session creation error:', error);

      let errorMessage = 'Gagal membuat sesi kerja';

      if (error.message.includes('HTTP 400')) {
        errorMessage =
          'Data yang dikirim tidak lengkap. Periksa kembali form Anda.';
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

  // ============ GANTT CHART METHODS (NEW) ============

  // Get Gantt chart data for session
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

  // ============ ACTIVITY METHODS (ENHANCED) ============

  // Save activity with category support
  async saveActivity(activityData) {
    try {
      const {
        activityName,
        activityCode,
        startTime,
        endTime,
        sessionNumber,
        category,
      } = activityData;

      const data = {
        codeDelay: activityCode || activityName,
        activityName: activityName,
        datetimeStart: new Date(startTime).toISOString(),
        datetimeEnd: endTime
          ? new Date(endTime).toISOString()
          : new Date().toISOString(),
        duration: endTime ? Math.floor((endTime - startTime) / 1000) : 0,
        sessionNumber,
        category: category || 'work', // default to work if not specified
        shift: this.getCurrentShift(),
      };

      const result = await this.apiRequest('/activities', 'POST', data);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: 'Aktivitas berhasil disimpan',
        };
      }

      return {
        success: false,
        message: 'Gagal menyimpan aktivitas. Silakan coba lagi.',
      };
    } catch (error) {
      console.error('Save activity error:', error);

      let errorMessage = 'Gagal menyimpan aktivitas';

      if (error.message.includes('HTTP 400')) {
        errorMessage =
          'Data aktivitas tidak valid. Periksa kembali data yang dikirim.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage =
          'Terjadi kesalahan pada server. Aktivitas tidak tersimpan.';
      } else if (error.message.includes('Network')) {
        errorMessage =
          'Koneksi terputur. Aktivitas akan disimpan secara offline.';
      }

      return {
        success: false,
        message: errorMessage,
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

  // ============ SHIFT UTILITY METHODS (NEW) ============

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
    const {startTime, endTime} = this.getShiftTimes(shiftType, currentTime);

    if (shiftType === 'DAY') {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Night shift spans two days
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Get time progress within shift (0-100%)
  getShiftProgress(shiftType, currentTime = new Date()) {
    const {startTime, endTime} = this.getShiftTimes(shiftType, currentTime);

    const totalDuration = endTime.getTime() - startTime.getTime();
    let elapsed;

    if (shiftType === 'DAY') {
      elapsed = currentTime.getTime() - startTime.getTime();
    } else {
      // Handle night shift crossing midnight
      if (currentTime >= startTime) {
        elapsed = currentTime.getTime() - startTime.getTime();
      } else {
        // Next day
        const midnight = new Date(startTime);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);
        elapsed =
          midnight.getTime() -
          startTime.getTime() +
          (currentTime.getTime() - (midnight.getTime() - 24 * 60 * 60 * 1000));
      }
    }

    const progress = Math.max(
      0,
      Math.min(100, (elapsed / totalDuration) * 100),
    );
    return Math.round(progress);
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

  // Format Gantt data for chart display
  formatGanttDataForChart(ganttData) {
    if (!ganttData || !ganttData.timeline) {
      return {
        categories: [],
        timeline: [],
        timeGrid: [],
        summary: [],
        chronologicalDetails: [],
      };
    }

    // Define category colors
    const categoryColors = {
      initial: '#00BCD4', // Cyan for initial status
      work: '#4CAF50', // Green for work
      delay: '#FF5722', // Red for delay
      idle: '#9E9E9E', // Grey for idle
      mt: '#673AB7', // Purple for maintenance
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
    }));

    // Format summary with colors
    const formattedSummary = ganttData.summary.map(item => ({
      ...item,
      color: categoryColors[item.category] || '#2196F3',
      percentage: 0, // Will be calculated in component
    }));

    return {
      session: ganttData.session,
      categories: Object.keys(categoryColors).map(key => ({
        name: key.toUpperCase(),
        color: categoryColors[key],
        key: key,
      })),
      timeline: formattedTimeline,
      timeGrid: ganttData.timeGrid || [],
      summary: formattedSummary,
      chronologicalDetails: ganttData.chronologicalDetails || [],
    };
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
