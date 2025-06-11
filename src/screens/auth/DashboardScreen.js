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

const DashboardScreen = ({route, navigation}) => {
  // Data dari LoginScreen.js
  const {selectedAction, formData, currentTimer} = route?.params || {};

  const timerFromLogin = currentTimer || '00:00:00';

  // State untuk Dashboard
  const [hmAwal, setHmAwal] = useState('');
  const [isHmAwalSet, setIsHmAwalSet] = useState(false);
  const [hmAkhir, setHmAkhir] = useState('');

  // State untuk menampilkan modal popup Hm Awal
  const [showHmAwalModal, setShowHmAwalModal] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    welcomeId: formData?.id || '18971',
    shiftType: 'Shift Day',
    productivity: '0 bcm/h',
    status: selectedAction || 'SHIFT CHANGE',
    loads: 0,
    hours: '0.00',
    currentDate: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    currentTime: new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const handleHmAwalSubmit = () => {
    if (!hmAwal || hmAwal.trim() === '') {
      Alert.alert('Error', 'Silakan Masukkan HM Awal');
      return;
    }
    setIsHmAwalSet(true);
    setShowHmAwalModal(false);
    Alert.alert('Success', `HM Awal ${hmAwal} telah disimpan`);
  };

  // Navigation handlers
  const handleNavigation = destination => {
    // untuk saat ini hanya menampilkan alert
    Alert.alert('Navigation', `Navigating to ${destination} page`);
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
        return '#4CAF50'; // Green
      case 'RAIN':
        return '#2196F3'; // BLUE
      case 'BREAKDOWN':
        return '#FF9800'; // ORANGE
      case 'SHIFT CHANGE':
        return '#00BCD4'; // GREEN
      default:
        return '#00BCD4'; // Blue
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Layout Header Section */}
      <View style={styles.headerSection}>
        {/* Baris atas - Welcome/ID, productivity, status */}
        <View style={styles.topRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.welcomeLabel}>Welcome :</Text>
            <Text style={styles.welcomeValue}>{dashboardData.welcomeId}</Text>
            <Text style={styles.shiftValue}>{dashboardData.shiftType}</Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.productivityLabel}>Productivity :</Text>
            <Text style={styles.productivityValue}>
              {dashboardData.productivity}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.statusLabel}>Status :</Text>
            <Text
              style={[
                styles.statusValue,
                {color: getStatusColor(dashboardData.status)},
              ]}>
              {dashboardData.status}
            </Text>
          </View>
        </View>

        {/* Baris bawah - Unit/Hm Awal, Load/Hours/Date, Timer */}
        <View style={styles.bottomRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.infoText}>
              Unit: {formData?.unitNumber || 'N/A'}
            </Text>
            <Text style={styles.infoText}>{hmAwal || '0'} Hm Awal</Text>
          </View>

          <View style={styles.centerColumn}>
            <Text style={styles.infoText}>
              {dashboardData.loads} Load(s) | {dashboardData.hours} hour(s)
            </Text>
            <Text style={styles.infoText}>
              {dashboardData.currentDate} {dashboardData.currentTime}
            </Text>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.timerText}>{timerFromLogin}</Text>
          </View>
        </View>
      </View>

      {/* Modal popup blocking untuk input Hm Awal (WAJIB DIISI) */}
      <Modal
        visible={showHmAwalModal && !isHmAwalSet}
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
              value={hmAwal}
              onChangeText={setHmAwal}
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

      {/* Main Content Section */}
      <View style={styles.mainContent}>
        <Text style={styles.mainContentText}>
          Unit: {formData?.unitNumber || 'N/A'} | Work Type:{' '}
          {formData?.workType || 'N/A'}
        </Text>
        <Text style={styles.mainContentSubText}>
          Dashboard content akan ditampilkan disini
        </Text>
      </View>

      {/* Bottom Navigation Section */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('WORK')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⚙️</Text>
          </View>
          <Text style={styles.navLabel}>WORK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('DELAY')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⏱️</Text>
          </View>
          <Text style={styles.navLabel}>DELAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('IDLE')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>⏸️</Text>
          </View>
          <Text style={styles.navLabel}>IDLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('MT')}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📋</Text>
          </View>
          <Text style={styles.navLabel}>MT</Text>
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
  statusSection: {
    alignItems: 'flex-end',
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
  mainContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  mainContentSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});

export default DashboardScreen;
