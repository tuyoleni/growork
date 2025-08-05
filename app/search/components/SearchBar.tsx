'use client';

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  onClear, 
  placeholder = 'Search...'
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchField}>
        <Feather name="search" size={20} color="#A0A0A0" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#A0A0A0"
        />
        {!!value && (
          <TouchableOpacity onPress={onClear}>
            <Feather name="x-circle" size={20} color="#A0A0A0" style={{ marginRight: 8 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#EFF2FA',
    marginBottom: 10,
    paddingVertical: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111',
    backgroundColor: 'transparent',
  },
});
