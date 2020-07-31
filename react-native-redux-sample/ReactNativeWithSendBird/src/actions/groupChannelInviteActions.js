import {
  INIT_INVITE,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  CREATE_GROUP_CHANNEL_SUCCESS,
  CREATE_GROUP_CHANNEL_FAIL,
  INVITE_GROUP_CHANNEL_SUCCESS,
  INVITE_GROUP_CHANNEL_FAIL,
} from './types'
import {
  sbGetUserList, sbGetGroupChannel, sbCreateGroupChannel, sbInviteGroupChannel,
} from '../sendbirdActions'

export const initInvite = () => ({ type: INIT_INVITE })

const getUserListFilter = (userListQuery, channelUrl, prevUsers, resolve, reject) => {
  if (!userListQuery.hasNext) {
    return resolve(prevUsers)
  }
  return sbGetUserList(userListQuery)
    .then((users) => {
      if (channelUrl) {
        return sbGetGroupChannel(channelUrl)
          .then((channel) => {
            const channelMemberIds = channel.members.map((member) => member.userId)
            const list = users.filter((user) => channelMemberIds.indexOf(user.userId) < 0)
            const filteredUsers = [...prevUsers, ...list]
            if (filteredUsers.length < userListQuery.limit / 2) {
              return getUserListFilter(userListQuery, channelUrl, filteredUsers, resolve, reject)
            }
            resolve(filteredUsers)
          })
          .catch(() => {
            resolve([...users, ...prevUsers])
          })
      }
      resolve([...users, ...prevUsers])
    })
    .catch(() => {
      resolve(prevUsers)
    })
}

export const getUserList = (userListQuery, channelUrl = null) => (dispatch) => {
  if (userListQuery.hasNext) {
    return new Promise((resolve, reject) => {
      const users = []
      return getUserListFilter(userListQuery, channelUrl, users, resolve, reject)
    })
      .then((users) => {
        dispatch({ type: USER_LIST_SUCCESS, list: users })
      })
      .catch(() => {
        dispatch({ type: USER_LIST_FAIL })
      })
  }
  dispatch({ type: USER_LIST_FAIL })
  return Promise.resolve(true)
}

export const createGroupChannel = (inviteUserIdList, isDistinct) => (dispatch) => sbCreateGroupChannel(inviteUserIdList, isDistinct)
  .then((channel) => {
    dispatch({
      type: CREATE_GROUP_CHANNEL_SUCCESS,
      channel,
    })
  })
  .catch((error) => {
    dispatch({ type: CREATE_GROUP_CHANNEL_FAIL })
  })

export const inviteGroupChannel = (inviteUserIdList, channelUrl) => (dispatch) => sbInviteGroupChannel(inviteUserIdList, channelUrl)
  .then((channel) => {
    dispatch({
      type: INVITE_GROUP_CHANNEL_SUCCESS,
      channel,
    })
  })
  .catch((error) => {
    dispatch({ type: INVITE_GROUP_CHANNEL_FAIL })
  })
