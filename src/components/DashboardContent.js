import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const DashboardContent = ({globalData, updateGlobalData, setActiveTab}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Overview</Text>
      <Text style={styles.subtitle}>
        Unit: {globalData.formData?.unitNumber || 'N/A'} | Work Type:{' '}
        {globalData.formData?.workType || 'N/A'}
      </Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Status: {globalData.selectedAction}</Text>
        <Text style={styles.infoText}>
          HM Awal: {globalData.hmAwal || 'Belum diset'}
        </Text>
        <Text style={styles.infoText}>Loads: {globalData.workData.loads}</Text>
        <Text style={styles.infoText}>Hours: {globalData.workData.hours}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
});

export default DashboardContent;
