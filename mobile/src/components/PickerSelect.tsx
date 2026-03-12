import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';

export interface PickerOption<T = string> {
  value: T;
  label: string;
  flag?: string;
}

interface PickerSelectProps<T = string> {
  options: PickerOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  renderOption?: (opt: PickerOption<T>) => string;
}

export function PickerSelect<T = string>({
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar',
  renderOption = opt => (opt.flag ? `${opt.flag} ${opt.label}` : opt.label),
}: PickerSelectProps<T>): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}>
        <Text style={styles.triggerText}>
          {selected ? renderOption(selected) : placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar</Text>
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}>
                  <Text style={styles.optionText}>{renderOption(item)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fafafa',
  },
  triggerText: {fontSize: 16, color: '#333'},
  chevron: {fontSize: 10, color: '#666'},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    color: '#1a1a2e',
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {backgroundColor: '#e8f4ff'},
  optionText: {fontSize: 16, color: '#333'},
  closeBtn: {
    padding: 16,
    alignItems: 'center',
  },
  closeBtnText: {fontSize: 16, color: '#0066CC', fontWeight: '600'},
});
