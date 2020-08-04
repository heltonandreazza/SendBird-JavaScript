import React, { useState, useLayoutEffect } from 'react'
import { View } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { NavigationActions, StackActions } from 'react-navigation'
import { sbConnect } from '../sendbirdActions'
import { Spinner } from '../components'

const Start = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)

  useLayoutEffect(() => {
    function redirectTo(page, params) {
      navigation.dispatch(
        StackActions.reset({
          index: 0,
          actions: [NavigationActions.navigate({ routeName: page, params })],
        }),
      )
    }

    AsyncStorage.getItem('user', (err, result) => {
      if (result) {
        setIsLoading(true)
        const user = JSON.parse(result)
        sbConnect(user.userId, user.nickname)
          .then(() => {
            setIsLoading(false)
            redirectTo('Menu')
          })
          .catch(() => {
            setIsLoading(false)
            redirectTo('Login')
          })
      } else {
        redirectTo('Login')
      }
    })
  }, [navigation])

  return (
    <View style={styles.containerStyle}>
      <Spinner visible={isLoading} />
    </View>
  )
}

export default Start

const styles = {
  containerStyle: {
    backgroundColor: '#fff',
    flex: 1,
  },
}
