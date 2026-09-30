package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/Nakano-Nino/slackers-api-go/internal/db"
)

type Hub struct {
	mu sync.RWMutex

	// Registered clients: clientID -> *Client
	clients map[string]*Client

	// Room subscriptions: roomName -> map[clientID]*Client
	rooms map[string]map[string]*Client

	// User client mapping: userID -> map[clientID]*Client
	userClients map[string]map[string]*Client

	// Active connection count per user
	onlineUsers map[string]int

	// Voice channel participants: channelID -> userID -> VoiceParticipant
	voiceRooms map[string]map[string]VoiceParticipant

	// Active 1-on-1 DM calls: callID -> ActiveCall
	activeCalls map[string]ActiveCall

	// Channels for lifecycle management
	Register   chan *Client
	Unregister chan *Client

	// Redis Pub/Sub adapter
	pubsub *RedisPubSub

	// Supabase DB connection for presence and queries
	db *db.Database
}

func NewHub(database *db.Database, redisURL string) *Hub {
	h := &Hub{
		clients:     make(map[string]*Client),
		rooms:       make(map[string]map[string]*Client),
		userClients: make(map[string]map[string]*Client),
		onlineUsers: make(map[string]int),
		voiceRooms:  make(map[string]map[string]VoiceParticipant),
		activeCalls: make(map[string]ActiveCall),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		db:          database,
	}

	h.pubsub = NewRedisPubSub(redisURL)
	if h.pubsub != nil {
		h.pubsub.Subscribe(h)
	}

	return h
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.registerClient(client)

		case client := <-h.Unregister:
			h.unregisterClient(client)
		}
	}
}

func (h *Hub) registerClient(c *Client) {
	h.mu.Lock()
	h.clients[c.ID] = c

	// Track user client
	if h.userClients[c.User.ID] == nil {
		h.userClients[c.User.ID] = make(map[string]*Client)
	}
	h.userClients[c.User.ID][c.ID] = c

	// Auto-join personal room
	userRoom := fmt.Sprintf("user:%s", c.User.ID)
	h.joinRoomLocked(c, userRoom)

	// Presence tracking
	count := h.onlineUsers[c.User.ID]
	h.onlineUsers[c.User.ID] = count + 1
	isFirst := count == 0
	h.mu.Unlock()

	// Notify client of successful connection
	c.SendJSON("connect", map[string]interface{}{
		"socketId": c.ID,
		"user":     c.User,
	})

	// If this was user's first active connection, mark online
	if isFirst {
		h.updateDBUserStatus(c.User.ID, "online")
		h.BroadcastAll("presence:update", map[string]interface{}{
			"userId": c.User.ID,
			"status": "online",
		}, "")
	}

	// Auto-join user to public and accessible channels
	h.autoJoinAccessibleChannels(c)
}

func (h *Hub) unregisterClient(c *Client) {
	h.mu.Lock()
	if _, ok := h.clients[c.ID]; !ok {
		h.mu.Unlock()
		return
	}

	delete(h.clients, c.ID)

	// Clean up user clients map
	if uMap, exists := h.userClients[c.User.ID]; exists {
		delete(uMap, c.ID)
		if len(uMap) == 0 {
			delete(h.userClients, c.User.ID)
		}
	}

	// Remove from all rooms
	for roomName := range c.Rooms {
		if rMap, exists := h.rooms[roomName]; exists {
			delete(rMap, c.ID)
			if len(rMap) == 0 {
				delete(h.rooms, roomName)
			}
		}
	}

	// Leave active voice room if in one
	if c.VoiceRoom != "" {
		h.leaveVoiceRoomLocked(c, c.VoiceRoom)
	}

	// Clean up any active DM calls where this client is caller or callee
	var callsToEnd []string
	var callPartners []string
	for callID, call := range h.activeCalls {
		if call.CallerSocketID == c.ID || call.Caller.ID == c.User.ID {
			callsToEnd = append(callsToEnd, callID)
			callPartners = append(callPartners, call.CalleeID)
		} else if call.CalleeID == c.User.ID {
			callsToEnd = append(callsToEnd, callID)
			callPartners = append(callPartners, call.Caller.ID)
		}
	}
	for _, callID := range callsToEnd {
		delete(h.activeCalls, callID)
	}

	// Track presence
	count := h.onlineUsers[c.User.ID]
	var isLast bool
	if count <= 1 {
		delete(h.onlineUsers, c.User.ID)
		isLast = true
	} else {
		h.onlineUsers[c.User.ID] = count - 1
	}

	close(c.Send)
	h.mu.Unlock()

	// Notify DM call partners if call ended
	for _, partnerID := range callPartners {
		h.BroadcastToUser(partnerID, "webrtc:call-ended", map[string]string{
			"byUserId": c.User.ID,
		})
	}

	// If last connection closed, mark offline
	if isLast {
		h.updateDBUserStatus(c.User.ID, "offline")
		h.BroadcastAll("presence:update", map[string]interface{}{
			"userId": c.User.ID,
			"status": "offline",
		}, "")
	}
}

func (h *Hub) autoJoinAccessibleChannels(c *Client) {
	if h.db == nil {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var query string
		var args []interface{}

		if c.User.Role == "admin" || c.User.Role == "manager" {
			query = `SELECT id FROM public.channels`
		} else {
			query = `
				SELECT id FROM public.channels WHERE "isPrivate" = false
				UNION
				SELECT "channelId" FROM public.channel_members WHERE "userId" = $1
			`
			args = append(args, c.User.ID)
		}

		rows, err := h.db.Pool.Query(ctx, query, args...)
		if err != nil {
			return
		}
		defer rows.Close()

		h.mu.Lock()
		defer h.mu.Unlock()

		for rows.Next() {
			var chID string
			if err := rows.Scan(&chID); err == nil {
				h.joinRoomLocked(c, fmt.Sprintf("channel:%s", chID))
			}
		}
	}()
}

func (h *Hub) joinRoomLocked(c *Client, roomName string) {
	if c.Rooms == nil {
		c.Rooms = make(map[string]bool)
	}
	c.Rooms[roomName] = true

	if h.rooms[roomName] == nil {
		h.rooms[roomName] = make(map[string]*Client)
	}
	h.rooms[roomName][c.ID] = c
}

func (h *Hub) leaveRoomLocked(c *Client, roomName string) {
	if c.Rooms != nil {
		delete(c.Rooms, roomName)
	}
	if rMap, exists := h.rooms[roomName]; exists {
		delete(rMap, c.ID)
		if len(rMap) == 0 {
			delete(h.rooms, roomName)
		}
	}
}

func (h *Hub) updateDBUserStatus(userID, status string) {
	if h.db == nil {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_, _ = h.db.Pool.Exec(ctx, `UPDATE public.users SET status = $1, "updatedAt" = NOW() WHERE id = $2`, status, userID)
	}()
}

// HandleClientMessage dispatches client-originated websocket events
func (h *Hub) HandleClientMessage(c *Client, msg *InboundMessage) {
	event := msg.GetEvent()
	data := msg.GetData()

	switch event {
	case "channel:join":
		var chID string
		if err := json.Unmarshal(data, &chID); err != nil {
			var req struct {
				ChannelID string `json:"channelId"`
			}
			if err := json.Unmarshal(data, &req); err == nil {
				chID = req.ChannelID
			}
		}
		if chID != "" {
			h.mu.Lock()
			h.joinRoomLocked(c, fmt.Sprintf("channel:%s", chID))
			h.mu.Unlock()
		}

	case "channel:leave":
		var chID string
		if err := json.Unmarshal(data, &chID); err != nil {
			var req struct {
				ChannelID string `json:"channelId"`
			}
			if err := json.Unmarshal(data, &req); err == nil {
				chID = req.ChannelID
			}
		}
		if chID != "" {
			h.mu.Lock()
			h.leaveRoomLocked(c, fmt.Sprintf("channel:%s", chID))
			h.mu.Unlock()
		}

	case "project:join":
		var projID string
		if err := json.Unmarshal(data, &projID); err != nil {
			var req struct {
				ProjectID string `json:"projectId"`
			}
			if err := json.Unmarshal(data, &req); err == nil {
				projID = req.ProjectID
			}
		}
		if projID != "" {
			h.mu.Lock()
			h.joinRoomLocked(c, fmt.Sprintf("project:%s", projID))
			h.mu.Unlock()
		}

	case "project:leave":
		var projID string
		if err := json.Unmarshal(data, &projID); err != nil {
			var req struct {
				ProjectID string `json:"projectId"`
			}
			if err := json.Unmarshal(data, &req); err == nil {
				projID = req.ProjectID
			}
		}
		if projID != "" {
			h.mu.Lock()
			h.leaveRoomLocked(c, fmt.Sprintf("project:%s", projID))
			h.mu.Unlock()
		}

	case "typing:start", "typing:stop":
		var req struct {
			ChannelID   string `json:"channelId"`
			DMPartnerID string `json:"dmPartnerId"`
		}
		_ = json.Unmarshal(data, &req)

		isTyping := event == "typing:start"
		updatePayload := map[string]interface{}{
			"user": map[string]string{
				"id":   c.User.ID,
				"name": c.User.Name,
			},
			"isTyping": isTyping,
		}

		if req.ChannelID != "" {
			updatePayload["channelId"] = req.ChannelID
			h.BroadcastToRoom(fmt.Sprintf("channel:%s", req.ChannelID), "typing:update", updatePayload, c.ID)
		} else if req.DMPartnerID != "" {
			updatePayload["dmPartnerId"] = c.User.ID
			h.BroadcastToUser(req.DMPartnerID, "typing:update", updatePayload)
		}

	// WebRTC Group Channel Voice
	case "webrtc:channel-voice-join":
		var req struct {
			ChannelID string `json:"channelId"`
		}
		_ = json.Unmarshal(data, &req)
		if req.ChannelID != "" {
			h.handleVoiceJoin(c, req.ChannelID)
		}

	case "webrtc:channel-voice-signal":
		var req struct {
			TargetSocketID string      `json:"targetSocketId"`
			TargetUserID   string      `json:"targetUserId"`
			ChannelID      string      `json:"channelId"`
			Signal         interface{} `json:"signal"`
		}
		_ = json.Unmarshal(data, &req)

		signalPayload := map[string]interface{}{
			"fromSocketId": c.ID,
			"fromUserId":   c.User.ID,
			"channelId":    req.ChannelID,
			"signal":       req.Signal,
		}

		if req.TargetSocketID != "" {
			h.SendToSocket(req.TargetSocketID, "webrtc:channel-voice-signal", signalPayload)
		} else if req.TargetUserID != "" {
			h.BroadcastToUser(req.TargetUserID, "webrtc:channel-voice-signal", signalPayload)
		}

	case "webrtc:channel-voice-leave":
		var req struct {
			ChannelID string `json:"channelId"`
		}
		_ = json.Unmarshal(data, &req)
		if req.ChannelID != "" {
			h.handleVoiceLeave(c, req.ChannelID)
		}

	case "webrtc:channel-voice-mute":
		var req struct {
			ChannelID string `json:"channelId"`
			Muted     bool   `json:"muted"`
			Deafened  bool   `json:"deafened"`
		}
		_ = json.Unmarshal(data, &req)
		if req.ChannelID != "" {
			h.handleVoiceMute(c, req.ChannelID, req.Muted, req.Deafened)
		}

	case "webrtc:channel-voice-speaking":
		var req struct {
			ChannelID  string `json:"channelId"`
			IsSpeaking bool   `json:"isSpeaking"`
		}
		_ = json.Unmarshal(data, &req)
		if req.ChannelID != "" {
			h.handleVoiceSpeaking(c, req.ChannelID, req.IsSpeaking)
		}

	case "webrtc:get-all-voice-states":
		states := h.GetAllVoiceStates()
		c.SendJSON("webrtc:all-voice-states", states)

	// WebRTC 1-on-1 DM Calls
	case "webrtc:call-user":
		var req struct {
			TargetUserID string `json:"targetUserId"`
		}
		_ = json.Unmarshal(data, &req)
		if req.TargetUserID != "" && req.TargetUserID != c.User.ID {
			h.handleCallUser(c, req.TargetUserID)
		}

	case "webrtc:accept-call":
		var req struct {
			CallID   string `json:"callId"`
			CallerID string `json:"callerId"`
		}
		_ = json.Unmarshal(data, &req)
		if req.CallerID != "" {
			h.BroadcastToUser(req.CallerID, "webrtc:call-accepted", map[string]interface{}{
				"callId": req.CallID,
				"callee": c.User,
			})
		}

	case "webrtc:decline-call":
		var req struct {
			CallID   string `json:"callId"`
			CallerID string `json:"callerId"`
			Reason   string `json:"reason"`
		}
		_ = json.Unmarshal(data, &req)
		if req.CallerID != "" {
			reason := req.Reason
			if reason == "" {
				reason = "declined"
			}
			h.BroadcastToUser(req.CallerID, "webrtc:call-declined", map[string]interface{}{
				"callId":   req.CallID,
				"calleeId": c.User.ID,
				"reason":   reason,
			})
		}

	case "webrtc:end-call":
		var req struct {
			TargetUserID string `json:"targetUserId"`
		}
		_ = json.Unmarshal(data, &req)
		if req.TargetUserID != "" {
			h.BroadcastToUser(req.TargetUserID, "webrtc:call-ended", map[string]string{
				"byUserId": c.User.ID,
			})
		}

	case "webrtc:signal-dm":
		var req struct {
			TargetUserID string      `json:"targetUserId"`
			Signal       interface{} `json:"signal"`
		}
		_ = json.Unmarshal(data, &req)
		if req.TargetUserID != "" {
			h.BroadcastToUser(req.TargetUserID, "webrtc:signal-dm", map[string]interface{}{
				"fromUserId": c.User.ID,
				"signal":     req.Signal,
			})
		}
	}
}

// Voice Helpers
func (h *Hub) handleVoiceJoin(c *Client, channelID string) {
	h.mu.Lock()
	if c.VoiceRoom != "" {
		h.leaveVoiceRoomLocked(c, c.VoiceRoom)
	}

	if h.voiceRooms[channelID] == nil {
		h.voiceRooms[channelID] = make(map[string]VoiceParticipant)
	}

	participant := VoiceParticipant{
		SocketID:   c.ID,
		UserID:     c.User.ID,
		User:       c.User,
		Muted:      false,
		Deafened:   false,
		IsSpeaking: false,
		JoinedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	h.voiceRooms[channelID][c.User.ID] = participant
	c.VoiceRoom = channelID
	voiceRoomName := fmt.Sprintf("voice:channel:%s", channelID)
	h.joinRoomLocked(c, voiceRoomName)

	var allParticipants []VoiceParticipant
	for _, p := range h.voiceRooms[channelID] {
		allParticipants = append(allParticipants, p)
	}
	h.mu.Unlock()

	// Send current participant list to joiner
	c.SendJSON("webrtc:channel-voice-users", map[string]interface{}{
		"channelId":    channelID,
		"participants": allParticipants,
	})

	// Notify other voice peers
	h.BroadcastToRoom(voiceRoomName, "webrtc:channel-voice-user-joined", map[string]interface{}{
		"channelId":   channelID,
		"participant": participant,
	}, c.ID)

	// Broadcast voice state update to text channel subscribers
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "webrtc:channel-voice-state", map[string]interface{}{
		"channelId":    channelID,
		"participants": allParticipants,
	}, "")
}

func (h *Hub) handleVoiceLeave(c *Client, channelID string) {
	h.mu.Lock()
	h.leaveVoiceRoomLocked(c, channelID)
	h.mu.Unlock()
}

func (h *Hub) leaveVoiceRoomLocked(c *Client, channelID string) {
	room, exists := h.voiceRooms[channelID]
	if !exists {
		return
	}

	if _, ok := room[c.User.ID]; ok {
		delete(room, c.User.ID)
		c.VoiceRoom = ""
		voiceRoomName := fmt.Sprintf("voice:channel:%s", channelID)
		h.leaveRoomLocked(c, voiceRoomName)

		var remaining []VoiceParticipant
		for _, p := range room {
			remaining = append(remaining, p)
		}
		if len(remaining) == 0 {
			delete(h.voiceRooms, channelID)
		}

		// Unlock temporarily or notify after
		go func(rem []VoiceParticipant) {
			h.BroadcastToRoom(voiceRoomName, "webrtc:channel-voice-user-left", map[string]string{
				"channelId": channelID,
				"userId":    c.User.ID,
			}, "")

			h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "webrtc:channel-voice-state", map[string]interface{}{
				"channelId":    channelID,
				"participants": rem,
			}, "")
		}(remaining)
	}
}

func (h *Hub) handleVoiceMute(c *Client, channelID string, muted, deafened bool) {
	h.mu.Lock()
	room, exists := h.voiceRooms[channelID]
	if !exists {
		h.mu.Unlock()
		return
	}
	p, ok := room[c.User.ID]
	if !ok {
		h.mu.Unlock()
		return
	}
	p.Muted = muted
	p.Deafened = deafened
	room[c.User.ID] = p
	h.mu.Unlock()

	h.BroadcastToRoom(fmt.Sprintf("voice:channel:%s", channelID), "webrtc:channel-voice-user-updated", map[string]interface{}{
		"channelId": channelID,
		"userId":    c.User.ID,
		"muted":     muted,
		"deafened":  deafened,
	}, "")
}

func (h *Hub) handleVoiceSpeaking(c *Client, channelID string, isSpeaking bool) {
	h.mu.Lock()
	room, exists := h.voiceRooms[channelID]
	if !exists {
		h.mu.Unlock()
		return
	}
	p, ok := room[c.User.ID]
	if !ok {
		h.mu.Unlock()
		return
	}
	p.IsSpeaking = isSpeaking
	room[c.User.ID] = p
	h.mu.Unlock()

	h.BroadcastToRoom(fmt.Sprintf("voice:channel:%s", channelID), "webrtc:channel-voice-speaking", map[string]interface{}{
		"channelId":  channelID,
		"userId":     c.User.ID,
		"isSpeaking": isSpeaking,
	}, c.ID)
}

func (h *Hub) GetAllVoiceStates() map[string][]VoiceParticipant {
	h.mu.RLock()
	defer h.mu.RUnlock()

	states := make(map[string][]VoiceParticipant)
	for chID, participants := range h.voiceRooms {
		var list []VoiceParticipant
		for _, p := range participants {
			list = append(list, p)
		}
		states[chID] = list
	}
	return states
}

func (h *Hub) handleCallUser(c *Client, targetUserID string) {
	callID := fmt.Sprintf("call_%s_%s_%d", c.User.ID, targetUserID, time.Now().UnixMilli())

	h.mu.Lock()
	h.activeCalls[callID] = ActiveCall{
		CallID:         callID,
		Caller:         c.User,
		CalleeID:       targetUserID,
		CallerSocketID: c.ID,
		StartedAt:      time.Now().UnixMilli(),
	}
	h.mu.Unlock()

	h.BroadcastToUser(targetUserID, "webrtc:incoming-call", map[string]interface{}{
		"callId":       callID,
		"caller":       c.User,
		"targetUserId": targetUserID,
	})
}

// Broadcasting & Messaging Core

func (h *Hub) SendToSocket(socketID, event string, data interface{}) {
	h.mu.RLock()
	c, ok := h.clients[socketID]
	h.mu.RUnlock()

	if ok {
		c.SendJSON(event, data)
	} else if h.pubsub != nil {
		raw, _ := json.Marshal(data)
		h.pubsub.Publish(RedisEnvelope{
			Type:   "socket",
			Target: socketID,
			Event:  event,
			Data:   raw,
		})
	}
}

func (h *Hub) BroadcastToUser(userID, event string, data interface{}) {
	h.mu.RLock()
	clients := h.userClients[userID]
	for _, c := range clients {
		c.SendJSON(event, data)
	}
	h.mu.RUnlock()

	if h.pubsub != nil {
		raw, _ := json.Marshal(data)
		h.pubsub.Publish(RedisEnvelope{
			Type:   "user",
			Target: userID,
			Event:  event,
			Data:   raw,
		})
	}
}

func (h *Hub) BroadcastToRoom(roomName, event string, data interface{}, excludeSocketID string) {
	h.mu.RLock()
	clients := h.rooms[roomName]
	for _, c := range clients {
		if excludeSocketID != "" && c.ID == excludeSocketID {
			continue
		}
		c.SendJSON(event, data)
	}
	h.mu.RUnlock()

	if h.pubsub != nil {
		raw, _ := json.Marshal(data)
		h.pubsub.Publish(RedisEnvelope{
			Type:            "room",
			Target:          roomName,
			Event:           event,
			Data:            raw,
			ExcludeSocketID: excludeSocketID,
		})
	}
}

func (h *Hub) BroadcastAll(event string, data interface{}, excludeSocketID string) {
	h.mu.RLock()
	for _, c := range h.clients {
		if excludeSocketID != "" && c.ID == excludeSocketID {
			continue
		}
		c.SendJSON(event, data)
	}
	h.mu.RUnlock()

	if h.pubsub != nil {
		raw, _ := json.Marshal(data)
		h.pubsub.Publish(RedisEnvelope{
			Type:            "all",
			Event:           event,
			Data:            raw,
			ExcludeSocketID: excludeSocketID,
		})
	}
}

// DeliverFromRedis handles cross-instance broadcast events received from Redis Pub/Sub
func (h *Hub) DeliverFromRedis(env *RedisEnvelope) {
	var payload interface{}
	if err := json.Unmarshal(env.Data, &payload); err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	switch env.Type {
	case "socket":
		if c, ok := h.clients[env.Target]; ok {
			c.SendJSON(env.Event, payload)
		}
	case "user":
		if clients, ok := h.userClients[env.Target]; ok {
			for _, c := range clients {
				c.SendJSON(env.Event, payload)
			}
		}
	case "room":
		if clients, ok := h.rooms[env.Target]; ok {
			for _, c := range clients {
				if env.ExcludeSocketID != "" && c.ID == env.ExcludeSocketID {
					continue
				}
				c.SendJSON(env.Event, payload)
			}
		}
	case "all":
		for _, c := range h.clients {
			if env.ExcludeSocketID != "" && c.ID == env.ExcludeSocketID {
				continue
			}
			c.SendJSON(env.Event, payload)
		}
	}
}

// REST Handlers Dispatch API

func (h *Hub) BroadcastNewMessage(channelID string, msg interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "message:new", msg, "")
}

func (h *Hub) BroadcastMessageReaction(channelID, messageID string, reactions interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "message:reaction", map[string]interface{}{
		"messageId": messageID,
		"reactions": reactions,
	}, "")
}

func (h *Hub) BroadcastMessageEdited(channelID string, msg interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "message:edited", msg, "")
}

func (h *Hub) BroadcastMessageDeleted(channelID, messageID string) {
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "message:deleted", map[string]interface{}{
		"channelId": channelID,
		"messageId": messageID,
	}, "")
}

func (h *Hub) BroadcastThreadReply(channelID, parentID string, reply, parentUpdate interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("channel:%s", channelID), "thread:reply", map[string]interface{}{
		"channelId":    channelID,
		"parentId":     parentID,
		"reply":        reply,
		"parentUpdate": parentUpdate,
	}, "")
}

func (h *Hub) BroadcastNewDM(senderID, receiverID string, dm interface{}) {
	h.BroadcastToUser(senderID, "dm:new", dm)
	h.BroadcastToUser(receiverID, "dm:new", dm)
}

func (h *Hub) BroadcastDmReaction(senderID, receiverID, messageID string, reactions interface{}) {
	payload := map[string]interface{}{
		"messageId": messageID,
		"reactions": reactions,
	}
	h.BroadcastToUser(senderID, "dm:reaction", payload)
	h.BroadcastToUser(receiverID, "dm:reaction", payload)
}

func (h *Hub) BroadcastDmEdited(senderID, receiverID string, dm interface{}) {
	h.BroadcastToUser(senderID, "dm:edited", dm)
	h.BroadcastToUser(receiverID, "dm:edited", dm)
}

func (h *Hub) BroadcastDmDeleted(senderID, receiverID, messageID string) {
	payload := map[string]interface{}{
		"messageId": messageID,
	}
	h.BroadcastToUser(senderID, "dm:deleted", payload)
	h.BroadcastToUser(receiverID, "dm:deleted", payload)
}

func (h *Hub) BroadcastDmRead(senderID, partnerID, readAt string) {
	h.BroadcastToUser(senderID, "dm:read", map[string]string{
		"partnerId": partnerID,
		"readAt":    readAt,
	})
}

func (h *Hub) BroadcastNotification(recipientID string, notif interface{}) {
	h.BroadcastToUser(recipientID, "notification:new", notif)
}

func (h *Hub) BroadcastTaskCreated(projectID string, task interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("project:%s", projectID), "task:created", task, "")
}

func (h *Hub) BroadcastTaskUpdated(projectID string, task interface{}) {
	h.BroadcastToRoom(fmt.Sprintf("project:%s", projectID), "task:updated", task, "")
}

func (h *Hub) BroadcastTaskDeleted(projectID, taskID string) {
	h.BroadcastToRoom(fmt.Sprintf("project:%s", projectID), "task:deleted", map[string]string{
		"projectId": projectID,
		"taskId":    taskID,
	}, "")
}
