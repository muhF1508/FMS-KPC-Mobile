import {memo} from 'react';

class ApiService {
  constructor() {
    // For Android Emulator, use 10.0.2.2 instead of localhost
    // For physical device, use computer's IP address (e.g., 192.168.1.100)
    this.baseURL = 'http://10.0.2.2:3000/api';
    this.healthURL = 'http://10.0.2.2:3000';
  }

  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000, // 10 second timeout
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      console.log(`🌐 API Request: ${method} ${this.baseURL}${endpoint}`);
      if (data) console.log('📤 Request Data:', data);

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

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
            errorMessage = 'Forbidden = Tidak memiliki izin';
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

      if (error.name === 'AbortError' || error.message.includes(timeout)) {
        throw new Error('Timeout - Server tidak merespons');
      }

      throw error;
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.healthURL}/health`, {
        timeout: 5000, // 5 second timeout for health check
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        message: 'Server tidak dapat dijangkau. Periksa koneksi internet Anda.',
      };
    }
  }

  // Test database connection
  async testDatabase() {
    try {
      const response = await fetch(`${this.healthURL}/test-db`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Database test failed:', error);
      return {success: false, message: error.message};
    }
  }

  // ============ EMPLOYEE METHODS ============

  // Validate employee login
  async validateEmployee(empId) {
    try {
      const result = await this.apiRequest(`/employees/${empId}`);

      if (result.success) {
        return result;
      } else {
        // Custom error message based on status
        return {
          success: false,
          message: 'ID Karyawan tidak ditemukan dalam database',
        };
      }
    } catch (error) {
      console.error('Employee validation error:', error);

      // Customize error message
      let errorMessage = 'ID Karyawan tidak terdaftar dalam database';

      if (error.message.includes('HTTP 404')) {
        errorMessage = 'ID Karyawan tidak ditemukan dalam database';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Terjadi kesalahan pada server, Silakan coba lagi.';
      } else if (error.message.includes('Network')) {
        errorMessage =
          'Koneksi ke server bermasalah. Periksa koneksi internet Anda.';
      } else if (error.message.includes('timeout')) {
        errorMessage =
          'Koneksi timeout, Server sedang sibuk, silakan coba lagi.';
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Get all employees (for testing)
  async getAllEmployees() {
    try {
      return await this.apiRequest('/employees');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get employees: ' + error.message,
      };
    }
  }

  // ============ SESSION METHODS ============

  // Create new session
  async createSession(operatorId, unitId, hmAwal, actionType) {
    try {
      const documentNumber = this.generateDocumentNumber();

      const sessionData = {
        operatorId,
        unitId,
        hmAwal: parseInt(hmAwal),
        documentNumber,
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

  // ============ ACTIVITY METHODS ============

  // Save activity
  async saveActivity(activityData) {
    try {
      const {activityName, startTime, endTime, sessionNumber} = activityData;

      const data = {
        codeDelay: activityName,
        datetimeStart: new Date(startTime).toISOString(),
        duration: Math.floor((endTime - startTime) / 1000), // seconds(detik) output
        sessionNumber,
        shiftId: this.getCurrentShift(),
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

  // ============ REPORTING METHODS ============

  // Get session report
  async getSessionReport(sessionNumber) {
    try {
      return await this.apiRequest(`/reports/session/${sessionNumber}`);
    } catch (error) {
      return {
        success: false,
        message: 'Get session report failed: ' + error.message,
      };
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
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
