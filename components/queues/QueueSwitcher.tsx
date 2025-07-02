import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { useAllQueues } from '../../contexts/AllQueuesContext';

const QueueSwitcher: React.FC = () => {
  const {
    queues,
    activeQueueId,
    setActiveQueueId,
    addQueue,
    deleteQueue,
    renameQueue,
    isLoading,
  } = useAllQueues();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'rename'>('add');
  const [queueName, setQueueName] = useState('');
  const [queueToRenameId, setQueueToRenameId] = useState<string | null>(null);

  const handleAddQueue = () => {
    if (queueName.trim() === '') {
      Alert.alert('Error', 'Queue name cannot be empty.');
      return;
    }
    addQueue(queueName.trim());
    setModalVisible(false);
    setQueueName('');
  };

  const handleRenameQueue = () => {
    if (queueName.trim() === '' || !queueToRenameId) {
      Alert.alert('Error', 'Queue name cannot be empty or queue ID is missing.');
      return;
    }
    renameQueue(queueToRenameId, queueName.trim());
    setModalVisible(false);
    setQueueName('');
    setQueueToRenameId(null);
  };

  const handleDeleteQueue = () => {
    if (!activeQueueId) {
      Alert.alert('Error', 'No active queue selected to delete.');
      return;
    }
    Alert.alert(
      'Delete Queue',
      `Are you sure you want to delete the queue "${queues.find(q => q.id === activeQueueId)?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteQueue(activeQueueId) },
      ]
    );
  };

  const openModal = (mode: 'add' | 'rename', queueId?: string) => {
    setModalMode(mode);
    if (mode === 'rename') {
      const queue = queues.find(q => q.id === queueId);
      if (queue) {
        setQueueName(queue.name);
        setQueueToRenameId(queue.id);
      } else {
        Alert.alert('Error', 'Queue not found for renaming.');
        return;
      }
    } else {
      setQueueName(''); // Reset for add mode
    }
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading queues...</Text>
      </View>
    );
  }

  const pickerItems = queues.map(queue => ({
    label: queue.name,
    value: queue.id,
  }));

  // State to manage if the picker is open - RNPickerSelect doesn't expose this directly easily.
  // We'll simulate this by having a separate "Add" button that's more prominent,
  // or by adding "Add New Queue..." as an item in the picker itself if the library supports it well.
  // For now, let's adjust the button layout slightly. The requirement "Options for adding a queue should appear when the dropdown menu is open"
  // is hard to achieve with RNPickerSelect directly. A custom dropdown would be needed.
  // Alternative: Have a general "Manage Queues" button that opens a modal with all options including "Add".
  // Let's try adding "Add New..." to the picker list and handling it.

  const itemsWithAdd = [
    ...pickerItems,
    { label: '+ Add New Queue...', value: 'ADD_NEW_QUEUE_ACTION', color: '#007AFF' } // Special value
  ];


  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={(value) => {
            if (value === 'ADD_NEW_QUEUE_ACTION') {
              openModal('add');
            } else if (value) {
              setActiveQueueId(value);
            }
          }}
          items={itemsWithAdd} // Use items with the "Add" option
          value={activeQueueId}
          placeholder={{ label: 'Select or manage queues...', value: null }}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
          Icon={() => <Ionicons name="chevron-down" size={20} color="gray" style={styles.pickerIcon} />}
        />
      </View>
      {/* Keep dedicated buttons for rename/delete for the active queue for clarity, if an active queue is selected */}
      {activeQueueId && (
        <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={() => openModal('rename', activeQueueId)} style={styles.iconButton}>
              <Ionicons name="create-outline" size={26} color="#FF9500" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteQueue} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={26} color="#FF3B30" />
            </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{modalMode === 'add' ? 'Add New Queue' : 'Rename Queue'}</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter queue name"
              value={queueName}
              onChangeText={setQueueName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={modalMode === 'add' ? handleAddQueue : handleRenameQueue}
              >
                <Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add' : 'Rename'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e7',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
  },
  pickerContainer: {
    flex: 1, // Takes up available space for the picker
    marginRight: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 8,
  },
  pickerIcon: {
    marginTop: Platform.OS === 'ios' ? 0 : 10, // Adjust icon position
    marginRight: Platform.OS === 'ios' ? 0 : 5,
  },
  // Modal styles
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalTextInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    flex: 1, // Make buttons take equal width
    marginHorizontal: 5, // Add some space between buttons
    alignItems: 'center', // Center text in button
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white', // Default for confirm
    fontWeight: 'bold',
  },
});

// Styles for RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: 'white',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: 'white',
  },
  iconContainer: { // Style for the container of the icon
    top: Platform.OS === 'ios' ? 12 : 18, // Adjust vertical position
    right: 10,
  },
  placeholder: {
    color: 'gray',
  },
});

export default QueueSwitcher;
