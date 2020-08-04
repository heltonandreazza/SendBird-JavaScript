import React from 'react'
import { View, Text } from 'react-native'

const AdminMessage = (props) => (
  <View
    style={[
      styles.messageViewStyle,
      {
        padding: 8,
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 14,
        marginRight: 14,
        backgroundColor: '#e6e9f0',
      },
    ]}
  >
    <Text>{props.message}</Text>
  </View>
)

const styles = {
  messageViewStyle: {
    transform: [{ scaleY: -1 }],
  },
}

export { AdminMessage }
