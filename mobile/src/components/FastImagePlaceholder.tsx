import React from 'react';
import FastImage, { Source } from 'react-native-fast-image';
import { StyleProp, View, ViewStyle, ImageStyle, StyleSheet } from 'react-native';
import { KRISHI_COLORS } from '../theme/krishiTheme';

type FastImagePlaceholderProps = {
  source: Source;
  style?: StyleProp<ImageStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
};

export default function FastImagePlaceholder({ source, style, wrapperStyle }: FastImagePlaceholderProps) {
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <FastImage source={source} style={[styles.image, style]} resizeMode={FastImage.resizeMode.cover} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#E1F5EE',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#A8DDBA',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: KRISHI_COLORS.surface,
  },
});
