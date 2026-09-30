package ws

import (
	"encoding/json"

	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

// VoiceParticipant represents an active participant in a voice channel
type VoiceParticipant struct {
	SocketID   string       `json:"socketId"`
	UserID     string       `json:"userId"`
	User       *models.User `json:"user"`
	Muted      bool         `json:"muted"`
	Deafened   bool         `json:"deafened"`
	IsSpeaking bool         `json:"isSpeaking"`
	JoinedAt   string       `json:"joinedAt"`
}

// ActiveCall tracks 1-on-1 DM calls
type ActiveCall struct {
	CallID         string       `json:"callId"`
	Caller         *models.User `json:"caller"`
	CalleeID       string       `json:"calleeId"`
	CallerSocketID string       `json:"callerSocketId"`
	StartedAt      int64        `json:"startedAt"`
}

// InboundMessage represents a message received from a WebSocket client
type InboundMessage struct {
	Event   string          `json:"event"`
	Action  string          `json:"action"`
	Data    json.RawMessage `json:"data"`
	Payload json.RawMessage `json:"payload"`
}

// GetEvent returns the event or action name
func (m *InboundMessage) GetEvent() string {
	if m.Event != "" {
		return m.Event
	}
	return m.Action
}

// GetData returns the raw json data or payload
func (m *InboundMessage) GetData() json.RawMessage {
	if len(m.Data) > 0 {
		return m.Data
	}
	return m.Payload
}

// OutboundMessage represents a message sent to a WebSocket client
type OutboundMessage struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

// RedisEnvelope represents an inter-instance broadcast message published to Redis
type RedisEnvelope struct {
	Type            string          `json:"type"` // "room", "user", "socket", "all"
	Target          string          `json:"target"`
	Event           string          `json:"event"`
	Data            json.RawMessage `json:"data"`
	ExcludeSocketID string          `json:"excludeSocketId,omitempty"`
}
