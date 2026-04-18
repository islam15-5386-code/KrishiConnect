import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle, StyleProp } from 'react-native';

type BanglaTextProps = TextProps & {
  medium?: boolean;
  style?: StyleProp<TextStyle>;
};

export default function BanglaText({ medium = false, style, ...rest }: BanglaTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        medium ? styles.medium : styles.regular,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'NotoSansBengali_400Regular',
  },
  regular: {
    fontFamily: 'NotoSansBengali_400Regular',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'NotoSansBengali_500Medium',
    fontWeight: '500',
  },
});
