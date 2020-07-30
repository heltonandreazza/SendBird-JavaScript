import React, { useState, useLayoutEffect } from 'react'
import {
  View, FlatList, TouchableHighlight, TextInput,
} from 'react-native'
import {
  Button, ListItem, Avatar, Spinner,
} from '../components'
import {
  sbCreateOpenChannel, sbCreateOpenChannelListQuery, sbGetOpenChannelList, sbGetOpenChannel,
} from '../sendbirdActions'
import iconSb68 from '../img/icon_sb_68.png'
import appStateChangeHandler from '../appStateChangeHandler'

const OpenChannel = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [list, setList] = useState([])
  const [channelName, setChannelName] = useState('')

  // sendbird
  const getOpenChannelList = (openChannelListQuery) => {
    console.info('getOpenChannelList')
    if (openChannelListQuery.hasNext) {
      setIsLoading(true)
      return sbGetOpenChannelList(openChannelListQuery)
        .then((channels) => {
          setIsLoading(false)
          setList(channels)
        })
        .catch((error) => setIsLoading(false))
    }
    setIsLoading(false)
    return Promise.resolve(true)
  }

  const onOpenChannelPress = (channelUrl) => {
    console.info('onOpenChannelPress')
    return sbGetOpenChannel(channelUrl)
      .then((channel) => {
        navigation.navigate('Chat', {
          channelUrl: channel.url,
          newTitle: channel.name,
          memberCount: channel.participantCount,
          isOpenChannel: channel.isOpenChannel(),
        })
      })
  }

  const createOpenChannel = (channelName) => {
    sbCreateOpenChannel(channelName)
      .then((createdChannel) => {
        const newList = [...[createdChannel], ...list]
        setList(newList)
        setIsLoading(false)
        setChannelName('')
      })
      .catch((err) => setIsLoading(false))
  }

  const _getOpenChannelList = () => {
    setIsLoading(true)
    const sbOpenChannelListQuery = sbCreateOpenChannelListQuery()
    getOpenChannelList(sbOpenChannelListQuery)
  }

  const _onListItemPress = (channelUrl) => {
    onOpenChannelPress(channelUrl)
  }

  const _renderList = (rowData) => {
    const channel = rowData.item
    return (
      <ListItem
        component={TouchableHighlight}
        containerStyle={{ backgroundColor: '#fff' }}
        key={channel.url}
        avatar={<Avatar source={channel.coverUrl ? { uri: channel.coverUrl } : iconSb68} />}
        title={channel.name.length > 30 ? `${channel.name.substring(0, 26)}...` : channel.name}
        titleStyle={{ fontWeight: '500', fontSize: 16 }}
        subtitle={`${channel.participantCount} Participant`}
        subtitleStyle={{ fontWeight: '300', fontSize: 11 }}
        onPress={() => _onListItemPress(channel.url)}
      />
    )
  }

  const _onCreateButtonPress = () => {
    setIsLoading(true)
    createOpenChannel(channelName)
  }

  useLayoutEffect(() => {
    const willFocusSubsription = navigation.addListener('willFocus', () => {
      _getOpenChannelList()
    })
    const appStateHandler = appStateChangeHandler.getInstance().addCallback('OPEN_CHANNEL', () => {
      _getOpenChannelList()
    })

    return () => {
      appStateHandler()
      willFocusSubsription.remove()
    }
  }, [])

  return (
    <View>
      <Spinner visible={isLoading} />
      <View style={styles.containerCreateChannel}>
        <TextInput
          textFocusColor="#7d62d9"
          textBlurColor="#000"
          highlightColor="#7d62d9"
          borderColor="#d9d9d9"
          style={styles.inputStyle}
          keyboardType="default"
          autoCapitalize="none"
          duration={100}
          autoCorrect={false}
          placeholder="Channel Name"
          value={channelName}
          maxLength={12}
          onChangeText={setChannelName}
        />
        <Button
          containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
          buttonStyle={{ padding: 20, paddingLeft: 16 }}
          iconRight={{
            name: 'plus',
            type: 'font-awesome',
            color: '#7d62d9',
            size: 24,
          }}
          backgroundColor="transparent"
          onPress={_onCreateButtonPress}
        />
      </View>
      <FlatList
        renderItem={_renderList}
        data={list}
        // extraData={this.state}
        inverted={false}
        keyExtractor={(item, index) => item.url}
        onEndReachedThreshold={0.5}
      />
    </View>
  )
}

OpenChannel.navigationOptions = ({ navigation }) => ({
  title: 'Open Channel',
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

// class OpenChannel2 extends Component {
//   static navigationOptions = ({ navigation }) => {
//     const { params } = navigation.state
//     return {
//       title: 'Open Channel',
//       headerLeft: (
//         <Button
//           containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
//           buttonStyle={{ paddingLeft: 14 }}
//           icon={{
//             name: 'chevron-left',
//             type: 'font-awesome',
//             color: '#7d62d9',
//             size: 18,
//           }}
//           backgroundColor="transparent"
//           onPress={() => navigation.goBack()}
//         />
//       ),
//       headerRight: (
//         <Button
//           containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
//           buttonStyle={{ paddingRight: 14 }}
//           iconRight={{
//             name: 'plus',
//             type: 'font-awesome',
//             color: '#7d62d9',
//             size: 18,
//           }}
//           backgroundColor="transparent"
//           onPress={() => {
//             navigation.navigate('OpenChannelCreate')
//           }}
//         />
//       ),
//     }
//   };

//   constructor(props) {
//     super(props)
//     this.state = {
//       enterChannel: false,
//       openChannelListQuery: null,
//       // global status
//       isLoading: false,
//       list: [],
//       channel: null,
//       createdChannel: null,
//     }
//   }

//   componentDidMount() {
//     this.willFocusSubsription = this.props.navigation.addListener('willFocus', () => {
//       this._initOpenChannelList()
//     })
//     this.appStateHandler = appStateChangeHandler.getInstance().addCallback('OPEN_CHANNEL', () => {
//       this._initOpenChannelList()
//     })
//   }

//   componentWillUnmount() {
//     this.appStateHandler()
//     this.willFocusSubsription.remove()
//   }

//   componentDidUpdate(prevProps, prevState, snapshot) {
//     const { list, channel, createdChannel } = this.state
//     console.log('componentDidUpdate', list, channel, createdChannel)
//     if (createdChannel && createdChannel !== prevState.createdChannel) {
//       const newList = [...[createdChannel], ...list]
//       this.setState({ list: newList }, () => {
//         this.clearCreatedOpenChannel()
//       })
//     }
//     if (channel && channel !== prevState.channel) {
//       this.clearSelectedOpenChannel()
//       this.props.navigation.navigate('Chat', {
//         channelUrl: channel.url,
//         newTitle: channel.name,
//         memberCount: channel.participantCount,
//         isOpenChannel: channel.isOpenChannel(),
//         // _initListState: this._initEnterState,
//       })
//     }
//   }

//   // sendbird
//   getOpenChannelList = (openChannelListQuery) => {
//     console.info('getOpenChannelList')
//     if (openChannelListQuery.hasNext) {
//       return sbGetOpenChannelList(openChannelListQuery)
//         .then((channels) => {
//           this.setState({
//             isLoading: false,
//             list: channels,
//           })
//         })
//         .catch((error) => this.setState({ isLoading: false }))
//     }
//     this.setState({ isLoading: false })
//     return Promise.resolve(true)
//   }

//   onOpenChannelPress = (channelUrl) => {
//     console.info('onOpenChannelPress')
//     return sbGetOpenChannel(channelUrl)
//       .then((channel) => {
//         this.setState({ channel })
//       })
//       .catch((error) => this.setState({ channel: null }))
//   }

//   addOpenChannelItem = (channel) => {
//     console.info('addOpenChannelItem')
//     this.setState({
//       createdChannel: channel,
//     })
//   }

//   clearCreatedOpenChannel = () => {
//     console.info('clearCreatedOpenChannel')
//     this.setState({ createdChannel: null })
//   }

//   clearSelectedOpenChannel = () => {
//     console.info('clearSelectedOpenChannel')
//     this.setState({ channel: null })
//   }

//   _initEnterState = () => {
//     this.setState({ enterChannel: false })
//   };

//   _getOpenChannelList = () => {
//     this.setState({ isLoading: true })
//     if (init) {
//       const openChannelListQuery = sbCreateOpenChannelListQuery()
//       this.setState({ openChannelListQuery }, () => {
//         this.getOpenChannelList(this.state.openChannelListQuery)
//       })
//     } else {
//       this.getOpenChannelList(this.state.openChannelListQuery)
//     }
//   };

//   _onListItemPress = (channelUrl) => {
//     if (!this.state.enterChannel) {
//       this.setState({ enterChannel: true }, () => {
//         this.onOpenChannelPress(channelUrl)
//       })
//     }
//   };

//   _renderList = (rowData) => {
//     const channel = rowData.item
//     return (
//       <ListItem
//         component={TouchableHighlight}
//         containerStyle={{ backgroundColor: '#fff' }}
//         key={channel.url}
//         avatar={<Avatar source={channel.coverUrl ? { uri: channel.coverUrl } : require('../img/icon_sb_68.png')} />}
//         title={channel.name.length > 30 ? `${channel.name.substring(0, 26)}...` : channel.name}
//         titleStyle={{ fontWeight: '500', fontSize: 16 }}
//         subtitle={`${channel.participantCount} Participant`}
//         subtitleStyle={{ fontWeight: '300', fontSize: 11 }}
//         onPress={() => this._onListItemPress(channel.url)}
//       />
//     )
//   };

//   render() {
//     return (
//       <View>
//         <Spinner visible={this.state.isLoading} />
//         <FlatList
//           renderItem={this._renderList}
//           data={this.state.list}
//           extraData={this.state}
//           inverted={false}
//           keyExtractor={(item, index) => item.url}
//           onEndReachedThreshold={0.5}
//         />
//       </View>
//     )
//   }
// }

const styles = {
  containerCreateChannel: {
    display: 'flex',
    flexDirection: 'row',
  },
  inputStyle: {
    flex: 1,
    fontSize: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
}

export default OpenChannel
