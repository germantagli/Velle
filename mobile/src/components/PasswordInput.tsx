import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Svg, {Path, Circle, Line} from 'react-native-svg';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  style?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
}

function EyeIcon({visible}: {visible: boolean}) {
  const size = 22;
  const color = '#666';
  if (visible) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 5C7.454 5 3.573 7.909 2 12c1.573 4.091 5.454 7 10 7s8.427-2.909 10-7c-1.573-4.091-5.454-7-10-7z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5C7.454 5 3.573 7.909 2 12c1.573 4.091 5.454 7 10 7s8.427-2.909 10-7c-1.573-4.091-5.454-7-10-7z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
      <Line
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PasswordInput({
  style,
  inputStyle,
  ...props
}: PasswordInputProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        {...props}
        style={[styles.input, inputStyle, {paddingRight: 48}]}
        secureTextEntry={!visible}
      />
      <TouchableOpacity
        style={styles.eyeBtn}
        onPress={() => setVisible(v => !v)}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
        <EyeIcon visible={!visible} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
