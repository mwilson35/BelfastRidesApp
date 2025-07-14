import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import axios from 'axios';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const LocationAutocompleteInput: React.FC<Props> = ({
  label,
  value,
  onChange,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(
          'http://192.168.33.5:5000/api/maps/autocomplete',
          {
            params: { input: value },
          }
        );
        setSuggestions(res.data.predictions || []);
      } catch (err) {
if (err instanceof Error) {
  console.error('Autocomplete error:', err.message);
} else {
  console.error('Autocomplete error:', err);
}
      }
    };

    fetchSuggestions();
  }, [value]);

  const handleSelect = (description: string) => {
    onChange(description);
    setShowSuggestions(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput
        style={styles.input}
        placeholder={label}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          setShowSuggestions(true);
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item.description)}
              style={styles.suggestion}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    maxHeight: 200,
  },
  suggestion: {
    padding: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});

export default LocationAutocompleteInput;
