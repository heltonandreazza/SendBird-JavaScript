import React from 'react'
import SpinnerComponent from 'react-native-loading-spinner-overlay'

const Spinner = ({ visible }) => <SpinnerComponent visible={visible} textStyle={{ color: '#fff' }} />

export { Spinner }
