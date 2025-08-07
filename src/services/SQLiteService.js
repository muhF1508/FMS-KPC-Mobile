// =============================
// Database Offline Service
// =============================

import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class SQLiteService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.dbName = 'fms_offline.db';
    this.dbVersion = '1.0';
    this.dbDisplayName = 'FMS Offline Database';
    this.dbSize = 200000; // 200KB

    // Network management
    this.isOnline = false;
    this.isSyncing = false;
  }

  // ============ DATABASE INITIALIZATION ============

  async initialize() {
    try {
      console.log('📱 Initializing SQLite database...');

      // Open database
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
        // createFromLocation: '~www/fms_offline.db', // pre-populated db - REMOVED
      });

      console.log('✅ Database opened successfully');

      // Create tables
      await this.createTables();

      // Initialize default data
      await this.initializeDefaultData();

      // Initialize network listener
      this.initializeNetworkListener();

      // Set initial online status
      this.isOnline = true;

      this.isInitialized = true;
      console.log('🎉 SQLite initalization completed!');

      return true;
    } catch (error) {
      console.error('❌ SQLite initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    console.log('🔧 Creating database tables...');

    const tables = [
      // 1. Employee Cache
      `CREATE TABLE IF NOT EXISTS emp_detail_cache (
                EMP_ID TEXT PRIMARY KEY,
                NAME TEXT,
                POSITION_TITLE TEXT,
                DIVISION TEXT,
                DEPARTMENT TEXT,
                EMAIL TEXT,
                POSITION_LVL TEXT,
                EMP_STATUS TEXT,
                LDAPUSER TEXT,
                last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // 2. Session Offline
      `CREATE TABLE IF NOT EXISTS fms_session_hm_offline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hm_awal INTEGER,
                hm_akhir INTEGER,
                datetime DATETIME,
                unit_id TEXT,
                operator TEXT,
                code_finish TEXT,
                document_number TEXT UNIQUE,
                shift_type TEXT,
                shift_start_time DATETIME,
                shift_end_time DATETIME,
                sync_status TEXT DEFAULT 'pending',
                created_offline INTEGER DEFAULT 1,
                server_id INTEGER,
                last_sync_attempt DATETIME,
                sync_error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // 3. Activity Tracking Offline
      `CREATE TABLE IF NOT EXISTS fms_timer_trans_offline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code_delay TEXT,
                datetime_start DATETIME,
                datetime_end DATETIME,
                duration REAL,
                session_number TEXT,
                shift TEXT,
                category TEXT,
                is_auto_generated INTEGER DEFAULT 0,
                interval_type TEXT,
                auto_assigned_to TEXT,
                sync_status TEXT DEFAULT 'pending',
                created_offline INTEGER DEFAULT 1,
                server_id INTEGER,
                last_sync_attempt DATETIME,
                sync_error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_number) REFERENCES fms_session_hm_offline(document_number)
            )`,

      // 4. Activity Code Cache
      `CREATE TABLE IF NOT EXISTS fms_code_delay_cache (
                id INTEGER PRIMARY KEY,
                code TEXT,
                description TEXT,
                code_id TEXT,
                last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // 5. Sync Queue
      `CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT,
                record_id INTEGER,
                operation TEXT,
                data_json TEXT,
                priority INTEGER DEFAULT 5,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                last_error TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                next_retry_at DATETIME
            )`,

      // 6. App Configuration
      `CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
    ];

    // Execute each table creation
    for (const tableSQL of tables) {
      await this.db.executeSql(tableSQL);
    }

    // Create indexes
    await this.createIndexes();

    console.log('✅ All tables created successfully');
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_session_operator ON fms_session_hm_offline(operator, shift_type)',
      'CREATE INDEX IF NOT EXISTS idx_session_sync ON fms_session_hm_offline(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_activity_session ON fms_timer_trans_offline(session_number)',
      'CREATE INDEX IF NOT EXISTS idx_activity_sync ON fms_timer_trans_offline(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, next_retry_at)',
    ];

    for (const indexSQL of indexes) {
      await this.db.executeSql(indexSQL);
    }
  }

  async initializeDefaultData() {
    console.log('📦 Initializing default data...');

    // App config
    const defaultConfigs = [
      ['app_version', '1.0.0'],
      ['offline_mode', 'true'],
      ['auto_sync_enabled', 'true'],
      ['sync_interval_minutes', '5'],
      ['max_offline_days', '14'],
      ['debug_mode', 'false'],
    ];

    for (const [key, value] of defaultConfigs) {
      await this.setConfig(key, value);
    }

    // Default activity codes
    const defaultActivities = [
      [1, 'work', 'SPOT', null],
      [2, 'work', 'LOAD', null],
      [3, 'work', 'FULL', null],
      [4, 'delay', 'DAILY FUEL-PM', '1'],
      [5, 'delay', 'RELOCATE', '2'],
      [6, 'idle', 'SAFETY TALK', '100'],
      [7, 'shift_change', 'SHIFT CHANGE', '999'],
      [8, 'mt', 'BREAKDOWN', null],
    ];

    // Insert default activity codes
    for (const [id, code, description, code_id] of defaultActivities) {
      try {
        await this.db.executeSql(
          `INSERT OR IGNORE INTO fms_code_delay_cache (id, code, description, code_id)
          VALUES (?, ?, ?, ?)`,
          [id, code, description, code_id],
        );
      } catch (error) {
        console.log(`⚠️ Activity code ${description} already exists`);
      }
    }

    console.log('✅ Default data initialized');
  }

  // FIX: Network Management (NetInfo v11.4.1)
  initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;

      // More lenient network detection for development
      this.isOnline =
        state.isConnected &&
        state.type !== 'none';

      console.log(`📡 Network State:`, {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        finalStatus: this.isOnline ? 'ONLINE' : 'OFFLINE'
      });

      // Auto sync when back online
      if (!wasOnline && this.isOnline) {
        console.log('🔄 Network restored, starting sync...');
        setTimeout(() => this.syncPendingData(), 2000);
      }
    });
  }

  async isNetworkAvailable() {
    try {
      const netInfo = await NetInfo.fetch();
      const isAvailable = (
        netInfo.isConnected &&
        netInfo.type !== 'none'
      );
      
      console.log('🔍 Network availability check:', {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
        result: isAvailable
      });
      
      return isAvailable;
    } catch (error) {
      console.error('❌ Network check failed:', error);
      return false;
    }
  }

  // ============ SESSION MANAGEMENT ============

  async saveOfflineSession(sessionData) {
    try {
      if (!this.isInitialized) await this.initialize();

      const {operatorId, unitId, hmAwal, shiftType, documentNumber} =
        sessionData;

      const now = new Date().toISOString();
      const {startTime, endTime} = this.getShiftTimes(shiftType);

      await this.db.executeSql(
        `INSERT INTO fms_session_hm_offline 
         (hm_awal, datetime, unit_id, operator, document_number, shift_type, 
          shift_start_time, shift_end_time, sync_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          hmAwal,
          now,
          unitId,
          operatorId,
          documentNumber,
          shiftType,
          startTime.toISOString(),
          endTime.toISOString(),
        ],
      );

      // Add to sync queue
      await this.addToSyncQueue(
        'fms_session_hm_offline',
        documentNumber,
        'INSERT',
        sessionData,
      );

      console.log(`💾 Session saved offline: ${documentNumber}`);

      return {
        success: true,
        documentNumber,
        offline: true,
      };
    } catch (error) {
      console.error('❌ Failed to save offline session:', error);
      return {success: false, error: error.message};
    }
  }

  async saveOfflineActivity(activityData) {
    try {
      if (!this.isInitialized) await this.initialize();

      const {
        sessionNumber,
        activityName,
        activityCode,
        startTime,
        endTime,
        durationSeconds,
        category,
      } = activityData;

      const shiftDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      await this.db.executeSql(
        `INSERT INTO fms_timer_trans_offline 
         (code_delay, datetime_start, datetime_end, duration, session_number, 
          shift, category, sync_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          activityName,
          startTime,
          endTime,
          durationSeconds,
          sessionNumber,
          shiftDate,
          category,
        ],
      );

      // Add to sync queue
      await this.addToSyncQueue(
        'fms_timer_trans_offline',
        sessionNumber,
        'INSERT',
        activityData,
      );

      console.log(`💾 Activity saved offline: ${activityName}`);

      return {success: true, offline: true};
    } catch (error) {
      console.error('❌ Failed to save offline activity:', error);
      return {success: false, error: error.message};
    }
  }

  // ============ SYNC MANAGEMENT ============

  async addToSyncQueue(tableName, recordId, operation, data) {
    try {
      const priority = operation === 'INSERT' ? 1 : 5; // Higher priority for new records
      const nextRetry = new Date(Date.now() + 30000).toISOString(); // Retry in 30 seconds

      await this.db.executeSql(
        `INSERT INTO sync_queue
         (table_name, record_id, operation, data_json, priority, next_retry_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tableName,
          recordId,
          operation,
          JSON.stringify(data),
          priority,
          nextRetry,
        ],
      );

      console.log(`📤 Added to sync queue: ${tableName} - ${operation}`);

      // Try immediate sync if online
      if (this.isOnline) {
        setTimeout(() => this.syncPendingData(), 1000);
      }
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
    }
  }

  // FIX: Corrected sync logic condition
  async syncPendingData() {
    if (this.isSyncing) {
      console.log('🔄 Sync already in progress, skipping...');
      return;
    }

    if (!(await this.isNetworkAvailable())) {
      console.log('🌐 Network is offline, skipping sync');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('🔄 Starting data synchronization...');

      // Get pending sync items
      const result = await this.db.executeSql(
        `SELECT * FROM sync_queue
         WHERE retry_count < max_retries
          AND (next_retry_at IS NULL OR next_retry_at <= datetime('now'))
          ORDER BY priority ASC, next_retry_at ASC
          LIMIT 10`,
      );

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < result[0].rows.length; i++) {
        const item = result[0].rows.item(i);

        try {
          console.log(`🔄 Syncing: ${item.table_name} - ${item.operation}`);

          const success = await this.syncSingleItem(item);

          if (success) {
            // Remove from queue on success
            await this.db.executeSql('DELETE FROM sync_queue WHERE id = ?', [
              item.id,
            ]);
            successCount++;
          } else {
            // Update retry count and next retry time
            await this.db.executeSql(
              `UPDATE sync_queue
               SET retry_count = retry_count + 1,
                   next_retry_at = datetime('now', '+' || (retry_count * 2) || ' minutes'),
                   last_error = ?
               WHERE id = ?`,
              ['Sync failed', item.id],
            );
            failureCount++;
          }
        } catch (error) {
          console.error(`❌ Sync item failed:`, error);

          // Update error in queue
          await this.db.executeSql(
            `UPDATE sync_queue
             SET retry_count = retry_count + 1,
                 next_retry_at = datetime('now', '+' || (retry_count * 2) || ' minutes'),
                 last_error = ?
             WHERE id = ?`,
            [error.message, item.id],
          );
          failureCount++;
        }
      }

      console.log(
        `🔄 Sync completed: ${successCount} success, ${failureCount} failed`,
      );
    } catch (error) {
      console.error('❌ Sync process error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncSingleItem(item) {
    try {
      const data = JSON.parse(item.data_json);

      if (item.table_name === 'fms_session_hm_offline') {
        // Lazy import to avoid circular dependency
        const { default: apiService } = await import('./ApiService');
        const result = await apiService.createSession(data);
        return result.success;
      } else if (item.table_name === 'fms_timer_trans_offline') {
        // Lazy import to avoid circular dependency  
        const { default: apiService } = await import('./ApiService');
        const result = await apiService.saveActivity(data);
        return result.success;
      }

      return false; // Unsupported table
    } catch (error) {
      console.error(`❌ Single item sync failed:`, error);
      return false;
    }
  }

  // ============ CONFIGURATION MANAGEMENT ============

  async setConfig(key, value) {
    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO app_config (key, value, updated_at)
         VALUES (?, ?, datetime('now'))`,
        [key, value],
      );
    } catch (error) {
      console.error(`❌ Failed to set config ${key}:`, error);
    }
  }

  async getConfig(key, defaultValue = null) {
    try {
      const result = await this.db.executeSql(
        `SELECT value FROM app_config WHERE key = ?`,
        [key],
      );
      if (result[0].rows.length > 0) {
        return result[0].rows.item(0).value;
      }

      return defaultValue;
    } catch (error) {
      console.error(`❌ Failed to get config ${key}:`, error);
      return defaultValue;
    }
  }

  // =========== UTILITY METHODS ============

  getShiftTimes(shiftType, currentDate = new Date()) {
    const startTime = new Date(currentDate);
    const endTime = new Date(currentDate);

    if (shiftType === 'DAY') {
      startTime.setHours(6, 0, 0, 0); // 06:00 AM
      endTime.setHours(18, 0, 0, 0); // 06:00 PM
    } else {
      startTime.setHours(18, 0, 0, 0); // 06:00 PM
      endTime.setHours(6, 0, 0, 0); // 06:00 AM next day
      endTime.setDate(endTime.getDate() + 1);
    }

    return {startTime, endTime};
  }

  async getSyncStatus() {
    try {
      if (!this.isInitialized) {
        return {
          isOnline: false,
          isSyncing: false,
          pendingSync: 0,
          lastSyncAttempt: null,
        };
      }

      const result = await this.db.executeSql(
        `SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < max_retries`,
      );

      const pendingCount = result[0].rows.item(0).count;

      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingSync: pendingCount,
        lastSyncAttempt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return {
        isOnline: false,
        isSyncing: false,
        pendingSync: 0,
        lastSyncAttempt: null,
      };
    }
  }

  async forceSync() {
    console.log('🔄 Force sync triggered');
    return await this.syncPendingData();
  }

  // FIX: Add proper cleanup method
  async close() {
    if (this.db) {
      await this.db.close();
      console.log('🔌 SQLite database closed');
    }
  }

  // ============ DATA CLEANUP METHODS ============

  async clearOldData(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await this.db.executeSql(
        `DELETE FROM fms_session_hm_offline 
         WHERE created_at < ? AND sync_status = 'synced'`,
        [cutoffDate.toISOString()],
      );

      await this.db.executeSql(
        `DELETE FROM fms_timer_trans_offline 
         WHERE created_at < ? AND sync_status = 'synced'`,
        [cutoffDate.toISOString()],
      );

      console.log(`🧹 Cleared old data older than ${days} days`);
    } catch (error) {
      console.error('❌ Failed to clear old data:', error);
    }
  }

  async getStorageInfo() {
    try {
      const tables = [
        'fms_session_hm_offline',
        'fms_timer_trans_offline',
        'sync_queue',
        'emp_detail_cache',
        'fms_code_delay_cache',
      ];

      const info = {};

      for (const table of tables) {
        const result = await this.db.executeSql(
          `SELECT COUNT(*) as count FROM ${table}`,
        );
        info[table] = result[0].rows.item(0).count;
      }

      return info;
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {};
    }
  }
}

const sqliteService = new SQLiteService();

export default sqliteService;
