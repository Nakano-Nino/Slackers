package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
)

// Client represents a connected WebSocket user session
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	ID       string // Unique socket ID
	User     *models.User
	Rooms    map[string]bool // Set of joined rooms
	VoiceRoom string         // Currently active voice channel ID (if any)
}

// ReadPump handles incoming WebSocket frames from the peer
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("⚠️ WebSocket client read error [%s]: %v", c.ID, err)
			}
			break
		}

		var inMsg InboundMessage
		if err := json.Unmarshal(message, &inMsg); err != nil {
			// Might be a raw ping or malformed JSON
			continue
		}

		c.Hub.HandleClientMessage(c, &inMsg)
	}
}

// WritePump pushes messages from the Send channel to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The Hub closed the channel
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Queue any pending messages in buffer into this frame
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// SendJSON encodes any struct into JSON and queues it for transmission
func (c *Client) SendJSON(event string, data interface{}) {
	payload, err := json.Marshal(OutboundMessage{
		Event: event,
		Data:  data,
	})
	if err != nil {
		log.Printf("❌ Failed to marshal WS message: %v", err)
		return
	}

	select {
	case c.Send <- payload:
	default:
		// Client buffer full; disconnect slow reader
		log.Printf("⚠️ Client buffer full for [%s], disconnecting", c.ID)
		close(c.Send)
	}
}
