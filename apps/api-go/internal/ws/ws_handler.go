package ws

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/Nakano-Nino/slackers-api-go/internal/auth"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type WSHandler struct {
	Hub      *Hub
	DB       *db.Database
	Config   *config.Config
	Upgrader websocket.Upgrader
}

func NewWSHandler(hub *Hub, database *db.Database, cfg *config.Config) *WSHandler {
	return &WSHandler{
		Hub:    hub,
		DB:     database,
		Config: cfg,
		Upgrader: websocket.Upgrader{
			ReadBufferSize:  1024 * 64,
			WriteBufferSize: 1024 * 64,
			CheckOrigin: func(r *http.Request) bool {
				// Allow dynamic origin mirroring; JWT auth protects the endpoint
				return true
			},
		},
	}
}

func (h *WSHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	// Extract token from query params or Authorization header
	token := r.URL.Query().Get("token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if token == "" {
		http.Error(w, `{"error":"Authentication error: Missing token"}`, http.StatusUnauthorized)
		return
	}

	claims, err := auth.VerifyToken(token, h.Config.JWTSecret)
	if err != nil {
		http.Error(w, `{"error":"Authentication error: Invalid or expired token"}`, http.StatusUnauthorized)
		return
	}

	// Fetch user details from database
	var u models.User
	var devRole *string
	row := h.DB.Pool.QueryRow(r.Context(), `
		SELECT id, email, name, avatar, role, "developerRole", status, "createdAt", "updatedAt"
		FROM public.users
		WHERE id = $1
	`, claims.ID)

	if err := row.Scan(&u.ID, &u.Email, &u.Name, &u.Avatar, &u.Role, &devRole, &u.Status, &u.CreatedAt, &u.UpdatedAt); err != nil {
		http.Error(w, `{"error":"Authentication error: User not found"}`, http.StatusUnauthorized)
		return
	}
	u.DeveloperRole = devRole

	// Upgrade HTTP connection to WebSocket
	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ Failed to upgrade WebSocket connection: %v", err)
		return
	}

	// Generate unique socket ID
	randBytes := make([]byte, 8)
	_, _ = rand.Read(randBytes)
	socketID := fmt.Sprintf("sock_%d_%s", time.Now().UnixMilli(), hex.EncodeToString(randBytes))

	client := &Client{
		Hub:   h.Hub,
		Conn:  conn,
		Send:  make(chan []byte, 256),
		ID:    socketID,
		User:  &u,
		Rooms: make(map[string]bool),
	}

	h.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
