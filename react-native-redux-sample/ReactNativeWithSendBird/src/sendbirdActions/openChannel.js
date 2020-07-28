import SendBird from 'sendbird';

export const sbCreateOpenChannelListQuery = () => {
  const sb = SendBird.getInstance();
  console.info('sbCreateOpenChannelListQuery resolved')
  return sb.OpenChannel.createOpenChannelListQuery();
};

export const sbGetOpenChannelList = openChannelListQuery => {
  return new Promise((resolve, reject) => {
    openChannelListQuery.next((channels, error) => {
      if (error) {
        reject(error);
      } else {
        console.info('sbGetOpenChannelList resolved', channels)
        resolve(channels);
      }
    });
  });
};

export const sbGetOpenChannel = channelUrl => {
  return new Promise((resolve, reject) => {
    const sb = SendBird.getInstance();
    sb.OpenChannel.getChannel(channelUrl, (channel, error) => {
      if (error) {
        reject(error);
      } else {
        console.info('sbGetOpenChannel resolved', channel)
        resolve(channel);
      }
    });
  });
};

export const sbCreateOpenChannel = channelName => {
  return new Promise((resolve, reject) => {
    if (!channelName) {
      reject('Channel name is required.');
      return;
    }
    const sb = SendBird.getInstance();
    sb.OpenChannel.createChannel(channelName, null, null, (channel, error) => {
      if (error) {
        reject('Create OpenChannel Failed.');
      } else {
        console.info('sbCreateOpenChannel resolved', channel)
        resolve(channel);
      }
    });
  });
};

export const sbOpenChannelEnter = channel => {
  return new Promise((resolve, reject) => {
    channel.enter((response, error) => {
      if (error) {
        reject(error);
      } else {
        console.info('sbOpenChannelEnter resolved', channel)
        resolve(channel);
      }
    });
  });
};

export const sbOpenChannelExit = channel => {
  return new Promise((resolve, reject) => {
    channel.exit((response, error) => {
      if (error) {
        reject(error);
      } else {
        console.info('sbOpenChannelExit resolved', channel)
        resolve(channel);
      }
    });
  });
};

export const sbCreateParticipantListQuery = channelUrl => {
  return new Promise((resolve, reject) => {
    sbGetOpenChannel(channelUrl)
      .then(channel => {
        console.info('sbCreateParticipantListQuery resolved', channel)
        resolve(channel.createParticipantListQuery())
      })
      .catch(error => reject(error));
  });
};

export const sbGetParticipantList = participantListQuery => {
  return new Promise((resolve, reject) => {
    participantListQuery.next((participants, error) => {
      if (error) {
        reject(error);
      } else {
        console.info('sbGetParticipantList resolved', participants)
        resolve(participants);
      }
    });
  });
};
