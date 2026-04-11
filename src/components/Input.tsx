import React, {forwardRef, useState} from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme';

interface InputProps extends TextInputProps {
  name: string;
  errors?: string[];
  label?: string;
  containerStyle?: ViewStyle;
}

const Input = forwardRef<TextInput, InputProps>(
  ({name, errors = [], label, containerStyle, style, ...rest}, ref) => {
    const {colors} = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const filteredErrors = errors.filter(e => e && e.length > 0);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: rest.editable === false ? (colors.surfaceSecondary || '#F3F4F6') : colors.inputBackground,
              color: rest.editable === false ? colors.textTertiary : colors.text,
              borderColor: isFocused
                ? colors.inputFocusBorder
                : filteredErrors.length > 0
                ? colors.danger
                : colors.inputBorder,
              borderWidth: isFocused ? 2 : 1,
              textAlignVertical: rest.multiline ? 'top' : 'auto',
              paddingTop: rest.multiline ? 16 : 0,
            },
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={e => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {filteredErrors.map((error, index) => (
          <Text key={index} style={[styles.error, {color: colors.danger}]}>
            {error}
          </Text>
        ))}
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
  },
});
