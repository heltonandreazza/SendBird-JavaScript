import React, { Component, useState } from 'react';
import { View, Text, TextInput, Image } from 'react-native';
import { sbConnect } from '../sendbirdActions';
import { sbFCMregisterPushToken } from '../sendbirdActions';
import { NavigationActions, StackActions } from 'react-navigation';
import { Button, Spinner } from '../components';

const Login = ({ navigation }) =>{
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [nickname, setNickname] = useState('')
  // global state
  const [error, setError] = useState('')

  function navigateToMenu () {
    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Menu' })]
    });
    navigation.dispatch(resetAction);
  }

  // sendbird
  function loginFail (error) {
    setError(error)
    setIsLoading(false)
  }

  async function loginSuccess (user) {
    await sbFCMregisterPushToken()
    setUserId('')
    setNickname('')
    navigateToMenu()
  }

  function sendbirdLogin ({ userId, nickname }) {
    return sbConnect(userId, nickname)
      .then(loginSuccess)
      .catch(loginFail);
  };

  async function _onButtonPress () {
    setIsLoading(true)
    sendbirdLogin({ userId, nickname });
  };

  return (
    <View style={styles.containerStyle}>
      <Spinner visible={isLoading} />
      <View style={styles.logoViewStyle}>
        <Image style={{ width: 150, height: 150 }} source={require('../img/icon_sb_512.png')} />
        <Text style={styles.logoTextTitle}>SendBird</Text>
        <Text style={styles.logoTextSubTitle}>React Native</Text>
      </View>

      <View style={styles.inputViewStyle}>
        <TextInput
          label="User ID"
          placeholder="User ID"
          style={styles.inputStyle}
          value={userId}
          duration={100}
          autoCorrect={false}
          maxLength={16}
          underlineColorAndroid="transparent"
          onChangeText={setUserId}
        />
      </View>

      <View style={styles.inputViewStyle}>
        <TextInput
          label="Nickname"
          placeholder="Nickname"
          style={styles.inputStyle}
          value={nickname}
          duration={100}
          autoCorrect={false}
          maxLength={16}
          underlineColorAndroid="transparent"
          onChangeText={setNickname}
        />
      </View>

      <View style={styles.buttonStyle}>
        <Button
          title="CONNECT"
          buttonStyle={{ backgroundColor: '#6e5baa' }}
          onPress={_onButtonPress}
          disabled={isLoading}
        />
      </View>

      <Text style={styles.errorTextStyle}>{error}</Text>

      <View style={[styles.footerViewStyle]}>
        <Text style={styles.footerTextStyle}>Sample UI v3.0.0 / SDK v.3.0.99</Text>
      </View>
    </View>
  )
}

Login.navigationOptions = {
  header: null
}

export default Login

const styles = {
  containerStyle: {
    backgroundColor: '#fff',
    flex: 1
  },
  logoViewStyle: {
    marginTop: 35,
    marginBottom: 5,
    alignItems: 'center'
  },
  logoTextTitle: {
    color: '#7d62d9',
    fontSize: 30,
    fontWeight: '600'
  },
  logoTextSubTitle: {
    color: '#7d62d9',
    fontSize: 13,
    fontWeight: '500'
  },
  inputViewStyle: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingLeft: 8,
    paddingRight: 8,
    marginLeft: 28,
    marginRight: 28,
    marginTop: 8
  },
  inputStyle: {
    fontSize: 13,
    backgroundColor: '#fff'
  },
  buttonStyle: {
    paddingLeft: 12,
    paddingRight: 12,
    marginTop: 50
  },
  errorTextStyle: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#e03131'
  },
  footerViewStyle: {
    paddingLeft: 28,
    paddingRight: 28,
    marginTop: 15,
    flexDirection: 'column'
  },
  footerTextStyle: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#8e8e8e'
  }
};
