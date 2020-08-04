import React from 'react'
import { View } from 'react-native'

const HR = (props) => <View style={[styles.lineStyle, props.lineStyle]} />

const styles = {
  lineStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
    backgroundColor: '#e6e6e6',
  },
}

export { HR }
