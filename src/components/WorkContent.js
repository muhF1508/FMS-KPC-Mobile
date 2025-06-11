import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

const WorkContent = ({globalData, updateGlobalData, setActiveTab}) => {
  const [currentLoads, setCurrentLoads] = useState('0');

  const handleAddLoad = () => {
    const newLoads = globalData.workData.loads + 1;
    updateGlobalData({
      workData: {
        ...globalData.workData,
        loads: newLoads,
        productivity: `${(newLoads * 10).toFixed(1)} bcm/h`, // contoh kalkulasi
      },
    });
  };

  const handleUpdateLoads = () => {
    const loads = parseInt(currentLoads) || 0;
    updateGlobalData({
      workData: {
        ...globalData.workData,
        loads: loads,
        productivity: `${(loads * 10).toFixed(1)} bcm/h`,
      },
    });
    Alert.alert('Success', `Loads diupdate menjadi ${loads}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work Management</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{globalData.workData.loads}</Text>
          <Text style={styles.statLabel}>Total Loads</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {globalData.workData.productivity}
          </Text>
          <Text style={styles.statLabel}>Productivity</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{globalData.workData.hours}</Text>
          <Text style={styles.statLabel}>Hours Worked</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.addLoadButton} onPress={handleAddLoad}>
          <Text style={styles.buttonText}>+ Add Load</Text>
        </TouchableOpacity>

        <View style={styles.updateContainer}>
          <Text style={styles.label}>Update Manual:</Text>
          <TextInput
            style={styles.input}
            placeholder="Jumlah loads"
            value={currentLoads}
            onChangeText={setCurrentLoads}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateLoads}>
            <Text style={styles.buttonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  controlsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addLoadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  updateContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkContent;
