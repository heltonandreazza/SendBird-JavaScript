import SendBird from 'sendbird'
import {
  INIT_GROUP_CHANNEL,
  GROUP_CHANNEL_PROGRESS_START,
  GROUP_CHANNEL_PROGRESS_END,
  GROUP_CHANNEL_LIST_SUCCESS,
  GROUP_CHANNEL_LIST_FAIL,
  GET_GROUP_CHANNEL_SUCCESS,
  GET_GROUP_CHANNEL_FAIL,
  CHANNEL_EDIT_SUCCESS,
  CHANNEL_EDIT_FAIL,
  ADD_GROUP_CHANNEL_ITEM,
  CLEAR_SELECTED_GROUP_CHANNEL,
  GROUP_CHANNEL_CHANGED,
  OPEN_CHANNEL_PROGRESS_START,
  OPEN_CHANNEL_PROGRESS_END,
} from './types'
import {
  sbGetGroupChannelList, sbGetGroupChannel, sbLeaveGroupChannel, sbHideGroupChannel,
} from '../sendbirdActions'

export const initGroupChannel = () => {
  const sb = SendBird.getInstance()
  sb.removeAllChannelHandlers()
  return { type: INIT_GROUP_CHANNEL }
}

export const openChannelProgress = (start) => {
  console.info('openChannelProgress')
  return {
    type: start ? OPEN_CHANNEL_PROGRESS_START : OPEN_CHANNEL_PROGRESS_END,
  }
}

export const groupChannelProgress = (start) => ({
  type: start ? GROUP_CHANNEL_PROGRESS_START : GROUP_CHANNEL_PROGRESS_END,
})

export const getGroupChannelList = (groupChannelListQuery) => (dispatch) => {
  if (groupChannelListQuery && groupChannelListQuery.hasNext) {
    return sbGetGroupChannelList(groupChannelListQuery)
      .then((channels) => dispatch({
        type: GROUP_CHANNEL_LIST_SUCCESS,
        list: channels,
      }))
      .catch((error) => dispatch({ type: GROUP_CHANNEL_LIST_FAIL }))
  }
  dispatch({ type: GROUP_CHANNEL_LIST_FAIL })
  return Promise.resolve()
}

export const onGroupChannelPress = (channelUrl) => (dispatch) => sbGetGroupChannel(channelUrl)
  .then((channel) => dispatch({
    type: GET_GROUP_CHANNEL_SUCCESS,
    channel,
  }))
  .catch((error) => dispatch({ type: GET_GROUP_CHANNEL_FAIL }))

export const onLeaveChannelPress = (channelUrl) => (dispatch) => sbLeaveGroupChannel(channelUrl)
  .then((response) => dispatch({
    type: CHANNEL_EDIT_SUCCESS,
    payload: channelUrl,
  }))
  .catch((error) => dispatch({ type: CHANNEL_EDIT_FAIL }))

export const onHideChannelPress = (channelUrl) => (dispatch) => sbHideGroupChannel(channelUrl)
  .then((response) => dispatch({
    type: CHANNEL_EDIT_SUCCESS,
    payload: channelUrl,
  }))
  .catch((error) => dispatch({ type: CHANNEL_EDIT_FAIL }))

export const addGroupChannelItem = (channel) => ({
  type: ADD_GROUP_CHANNEL_ITEM,
  channel,
})

export const clearSelectedGroupChannel = () => ({ type: CLEAR_SELECTED_GROUP_CHANNEL })

export const createGroupChannelListHandler = () => (dispatch) => {
  const sb = SendBird.getInstance()
  const channelHandler = new sb.ChannelHandler()
  channelHandler.onChannelChanged = (channel) => {
    dispatch({
      type: GROUP_CHANNEL_CHANGED,
      channel,
    })
  }
  sb.addChannelHandler('GROUP_CHANNEL_LIST_HANDLER', channelHandler)
}
