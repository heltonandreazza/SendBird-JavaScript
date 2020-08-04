import React, { useState, useLayoutEffect } from 'react'
import { View } from 'react-native'
import { sbGetCurrentInfo, sbUpdateProfile } from '../sendbirdActions'
import iconSb68 from '../img/icon_sb_68.png'
import {
  Button, Avatar, FormLabel, FormInput, FormValidationMessage, Spinner,
} from '../components'

const Profile = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [profileUrl, setProfileUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState(null)

  const updateUser = () => {
    const { profileUrl, nickname } = sbGetCurrentInfo()
    setProfileUrl(profileUrl)
    setNickname(nickname)
  }

  const updateProfile = (newNickname) => sbUpdateProfile(newNickname)
    .then(() => {
      updateUser()
      navigation.goBack()
    })
    .catch((err) => setError(err))

  function onSaveButtonPress() {
    console.log('nickname', nickname)
    updateProfile(nickname)
  }

  useLayoutEffect(() => {
    navigation.setParams({ handleSave: onSaveButtonPress })
    setIsLoading(true)
    updateUser()
    setIsLoading(false)
  }, [])

  return (
    <View style={styles.containerStyle}>
      <Spinner visible={isLoading} />
      <View
        style={{
          justifyContent: 'center',
          flexDirection: 'row',
          marginTop: 50,
          marginBottom: 50,
        }}
      >
        <Avatar
          large
          rounded
          source={profileUrl ? { uri: profileUrl } : iconSb68}
        />
      </View>

      <FormLabel labelStyle={[styles.defaultMargin, { marginTop: 20, fontSize: 13, fontWeight: '400' }]}>
        Nickname
      </FormLabel>
      <FormInput
        containerStyle={styles.defaultMargin}
        selectionColor="#000"
        inputStyle={{ color: '#000' }}
        value={nickname}
        maxLength={12}
        onChangeText={(value) => {
          setNickname(value)
        }}
      />
      <FormValidationMessage labelStyle={{ marginLeft: 14 }}>{error}</FormValidationMessage>
      <Button
        containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
        buttonStyle={{ paddingRight: 14 }}
        color="#7d62d9"
        title="save"
        backgroundColor="transparent"
        onPress={onSaveButtonPress}
      />
    </View>
  )
}

Profile.navigationOptions = ({ navigation }) => ({
  title: 'Profile',
  headerLeft: (
    <Button
      containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
      buttonStyle={{ paddingLeft: 14 }}
      icon={{
        name: 'chevron-left',
        type: 'font-awesome',
        color: '#7d62d9',
        size: 18,
      }}
      backgroundColor="transparent"
      onPress={() => navigation.goBack()}
    />
  ),
})

const styles = {
  containerStyle: {
    backgroundColor: '#fff',
    flex: 1,
  },
  defaultMargin: {
    marginLeft: 14,
    marginRight: 14,
  },
}

export default Profile
