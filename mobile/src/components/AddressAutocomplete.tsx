import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {GOOGLE_PLACES_API_KEY} from '../config';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress?: (address: string) => void;
  placeholder?: string;
  editable?: boolean;
}

interface Prediction {
  description: string;
  place_id: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function AddressAutocomplete({
  value,
  onChangeText,
  onSelectAddress,
  placeholder = 'Escribe tu dirección...',
  editable = true,
}: AddressAutocompleteProps): React.JSX.Element {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const debouncedInput = useDebounce(value, 400);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!debouncedInput.trim() || debouncedInput.length < 3) {
      setPredictions([]);
      setShowList(false);
      return;
    }
    if (!GOOGLE_PLACES_API_KEY) {
      return;
    }
    const fetchPredictions = async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const url =
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
          `input=${encodeURIComponent(debouncedInput)}` +
          `&key=${GOOGLE_PLACES_API_KEY}` +
          '&types=address' +
          '&language=es';
        const res = await fetch(url, {signal: abortRef.current.signal});
        const data = await res.json();
        if (data.predictions && Array.isArray(data.predictions)) {
          setPredictions(
            data.predictions.map((p: {description: string; place_id: string}) => ({
              description: p.description,
              place_id: p.place_id,
            })),
          );
          setShowList(true);
        } else {
          setPredictions([]);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setPredictions([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debouncedInput]);

  const handleSelect = (description: string) => {
    onChangeText(description);
    onSelectAddress?.(description);
    setShowList(false);
    setPredictions([]);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={editable}
          onFocus={() => value.length >= 3 && predictions.length > 0 && setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
        />
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="#0066CC" />
          </View>
        )}
      </View>
      {showList && predictions.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={predictions}
            keyExtractor={item => item.place_id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(item.description)}
                activeOpacity={0.7}>
                <Text style={styles.optionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  loader: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  listContainer: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
});
