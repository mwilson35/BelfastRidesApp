import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { colors, typography } from '../theme';
import { spacing, borderRadius } from '../theme/layout';

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
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              onPress={() => handleSelect(item.description)}
              style={styles.suggestion}
            >
              <Text style={[typography.styles.body, { color: colors.text.primary }]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
    ...typography.styles.body,
    color: colors.text.primary,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    maxHeight: 200,
    marginTop: spacing[1],
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestion: {
    padding: spacing[3],
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
});

export default LocationAutocompleteInput;
