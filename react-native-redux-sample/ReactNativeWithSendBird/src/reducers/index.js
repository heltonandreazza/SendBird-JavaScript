import { combineReducers } from 'redux'
import openChannel from './openChannelReducer'
import openChannelCreate from './openChannelCreateReducer'
import chat from './chatReducer'
import member from './memberReducer'
import blockUser from './blockUserReducer'
import groupChannel from './groupChannelReducer'
import groupChannelInvite from './groupChannelInviteReducer'

export default combineReducers({
  openChannel,
  openChannelCreate,
  chat,
  member,
  blockUser,
  groupChannel,
  groupChannelInvite,
})

export openChannelReducer from './openChannelReducer'
export openChannelCreateReducer from './openChannelCreateReducer'
export chatReducer from './chatReducer'
export memberReducer from './memberReducer'
export blockUserReducer from './blockUserReducer'
export groupChannelReducer from './groupChannelReducer'
export groupChannelInviteReducer from './groupChannelInviteReducer'
