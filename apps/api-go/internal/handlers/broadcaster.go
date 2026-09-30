package handlers

type Broadcaster interface {
	BroadcastNewMessage(channelID string, msg interface{})
	BroadcastMessageReaction(channelID, messageID string, reactions interface{})
	BroadcastMessageEdited(channelID string, msg interface{})
	BroadcastMessageDeleted(channelID, messageID string)
	BroadcastThreadReply(channelID, parentID string, reply, parentUpdate interface{})
	BroadcastNewDM(senderID, receiverID string, dm interface{})
	BroadcastDmReaction(senderID, receiverID, messageID string, reactions interface{})
	BroadcastDmEdited(senderID, receiverID string, dm interface{})
	BroadcastDmDeleted(senderID, receiverID, messageID string)
	BroadcastDmRead(senderID, partnerID, readAt string)
	BroadcastNotification(recipientID string, notif interface{})
	BroadcastTaskCreated(projectID string, task interface{})
	BroadcastTaskUpdated(projectID string, task interface{})
	BroadcastTaskDeleted(projectID, taskID string)
}
