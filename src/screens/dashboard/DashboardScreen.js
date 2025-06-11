import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';

// Import content components
import DashboardContent from '../../components/DashboardContent';
import WorkContent from '../../components/WorkContent';
import DelayContent from '../../components/DelayContent';
import IdleContent from '../../components/IdleContent';
import MTContent from '../../components/MTContent';

const DashboardScreen = ({route, navigation}) => {
  // Data dari LoginScreen.js
  const {selectedAction, formData, currentTimer} = route?.params || {};

  // State untuk tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Global state yang bisa diakses semua content components
  const [globalData, setGlobalData] = useState({
    // Data dari login
    selectedAction: selectedAction || 'SHIFT CHANGE',
    formData: formData || {},
    currentTimer: currentTimer || '00:00:00',

    // Data dasboard
    hmAwal: '',
    hmAkhir: '',
    isHmAwalSet: false,

    // Data dari berbagai content
    delayData: {
      activeCode: null,
      activeName: '',
      startTime: '',
      endTime: '',
      isActive: false,
      reason: '',
      duration: '00:00:00',
    },
    workData: {
      loads: 0,
      productivity: '0 bcm/h',
      hours: '0.00',
    },
    idleData: {
      reason: '',
      description: '',
      startTime: '',
      endTime: '',
      isActive: false,
      duration: '00:00:00',
    },
    mtData: {
      type: '',
      description: '',
      status: '',
      startTime: '',
      endTime: '',
      isActive: false,
      duration: '00:00:00',
    },

    // Dashboard info
    welcomeId: formData?.id || '18971',
    shiftType: 'Shift Day',
    status: selectedAction || 'SHIFT CHANGE',
    currentDate: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    currentTime: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  // State untuk menampilkan modal popup Hm Awal
  const [showHmAwalModal, setShowHmAwalModal] = useState(true);

  const updateGlobalData = newData => {
    setGlobalData(prev => ({
      ...prev,
      ...newData,
    }));
  };

  const handleHmAwalSubmit = () => {
    if (!globalData.hmAwal || globalData.hmAwal.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Awal');
      return;
    }
    updateGlobalData({isHmAwalSet: true});
    setShowHmAwalModal(false);
    Alert.alert('Success', `HM Awal ${globalData.hmAwal} telah disimpan`);
  };

  // Navigation handlers
  const handleTabNavigation = tabName => {
    setActiveTab(tabName.toLowerCase());
  };

  const handleAkhirShift = () => {
    Alert.alert('Konfirmasi', 'Apakah anda yakin ingin mengakhiri shift?', [
      {text: 'Batal', style: 'cancel'},
      {text: 'Ya', onPress: () => navigation.goBack()},
    ]);
  };

  // Status color mapping
  const getStatusColor = status => {
    switch (status) {
      case 'SAFETY TALK':
        return '#4CAF50'; // GREEN
      case 'RAIN':
        return '#2196F3'; // BLUE
      case 'BREAKDOWN':
        return '#FF9800'; // ORANGE
      case 'SHIFT CHANGE':
        return '#00BCD4'; // GREEN
      case 'WORK':
        return '#4CAF50';
      case 'DELAY':
        return '#FF5722';
      case 'IDLE':
        return '#9E9E9E';
      case 'MT':
        return '#673AB7';
      default:
        return '#00BCD4'; // BLUE
    }
  };

  // Render content berdasarkan active tab
  const renderContent = () => {
    const contentProps = {
      globalData,
      updateGlobalData,
      setActiveTab,
    };

    switch (activeTab) {
      case 'work':
        return <WorkContent {...contentProps} />;
      case 'delay':
        return <DelayContent {...contentProps} />;
      case 'idle':
        return <IdleContent {...contentProps} />;
      case 'mt':
        return <MTContent {...contentProps} />;
      default:
        return <DashboardContent {...contentProps} />;
    }
  };

  // Get active tab title for status
  const getActiveTabStatus = () => {
    if (activeTab === 'dashboard') return globalData.selectedAction;
    return activeTab.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Layout Header Section */}
      <View style={styles.headerSection}>
        {/* Baris atas - Welcome/ID, productivity, status */}
        <View style={styles.topRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.welcomeLabel}>Welcome :</Text>
            <Text style={styles.welcomeValue}>{globalData.welcomeId}</Text>
            <Text style={styles.shiftValue}>{globalData.shiftType}</Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.productivityLabel}>Productivity :</Text>
            <Text style={styles.productivityValue}>
              {globalData.workData.productivity}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.statusLabel}>Status :</Text>
            <Text
              style={[
                styles.statusValue,
                {color: getStatusColor(getActiveTabStatus())},
              ]}>
              {getActiveTabStatus()}
            </Text>
          </View>
        </View>

        {/* Baris bawah - Unit/Hm Awal, Load/Hours/Date, Timer */}
        <View style={styles.bottomRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.infoText}>
              Unit: {globalData.formData?.unitNumber || 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              {globalData.hmAwal || '0'} Hm Awal
            </Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.infoText}>
              {globalData.workData.loads} Load(s) | {globalData.workData.hours}{' '}
              hour(s)
            </Text>
            <Text style={styles.infoText}>
              {globalData.currentDate} {globalData.currentTime}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.timerText}>{globalData.currentTimer}</Text>
          </View>
        </View>
      </View>

      {/* Modal popup blocking untuk input Hm Awal (WAJIB DIISI) */}
      <Modal
        visible={showHmAwalModal && !globalData.isHmAwalSet}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Masukkan HM Awal</Text>
            <Text style={styles.modalSubtitle}>
              Silakan masukkan Hour Meter awal sebelum memulai shift
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Contoh 1200"
              placeholderTextColor="#999"
              value={globalData.hmAwal}
              onChangeText={text => updateGlobalData({hmAwal: text})}
              keyboardType="numeric"
              autoFocus={true}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleHmAwalSubmit}>
              <Text style={styles.modalButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Main Content Area - based on active tab */}
      <View style={styles.contentArea}>{renderContent()}</View>

      {/* NEW: Global delay code input - always visible above bottom navigation */}
      <View style={styles.globalDelayInputContainer}>
        <Text style={styles.delayInputLabel}>Delay Code:</Text>
        <View style={styles.delayInputRow}>
          <TextInput
            style={styles.delayCodeInput}
            placeholder="001, 004, 005, 006, 007"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={3}
          />
          <TouchableOpacity style={styles.delayStartButton}>
            <Text style={styles.delayStartButtonText}>START</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation Section  - Always visible */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'work' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('WORK')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⚙️</Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'work' && styles.activeNavLabel,
            ]}>
            WORK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'delay' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('DELAY')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⏱️</Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'delay' && styles.activeNavLabel,
            ]}>
            DELAY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'idle' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('IDLE')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⏸️</Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'idle' && styles.activeNavLabel,
            ]}>
            IDLE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'mt' && styles.activeNavButton,
          ]}
          onPress={() => handleTabNavigation('MT')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📋</Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'mt' && styles.activeNavLabel,
            ]}>
            MT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.akhirShiftButton}
          onPress={handleAkhirShift}>
          <Text style={styles.akhirShiftText}>AKHIR{'\n'}SHIFT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerSection: {
    backgroundColor: '#FFD700',
    padding: 15,
    paddingTop: 25,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  welcomeLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  welcomeValue: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  shiftValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  productivityLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  productivityValue: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Content area - dynamic content
  contentArea: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  navIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navIconText: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  activeNavLabel: {
    color: '#2196F3',
  },
  akhirShiftButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  akhirShiftText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  // NEW: Global delay code input styles
  globalDelayInputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayInputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  delayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  delayCodeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginRight: 8,
    textAlign: 'center',
    width: 120,
  },
  delayStartButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  delayStartButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
