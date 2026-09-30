package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type MessageHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewMessageHandler(db *db.Database, cfg *config.Config) *MessageHandler {
	return &MessageHandler{DB: db, Config: cfg}
}

func (h *MessageHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channelId")
	if channelID == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "channelId query parameter is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT m.id, m."channelId", m."userId", u.name, u.avatar, m.content, m.ciphertext, m.iv,
		       m."taskId", m."bugId", m."parentId", m."replyCount", m."lastReplyAt",
		       m."isEdited", m."isDeleted", m."editedAt", m.reactions, m."createdAt", m."expiresAt"
		FROM public.messages m
		LEFT JOIN public.users u ON m."userId" = u.id
		WHERE m."channelId" = $1 AND m."isDeleted" = false
		ORDER BY m."createdAt" ASC
		LIMIT 100
	`

	rows, err := h.DB.Pool.Query(ctx, query, channelID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query messages: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	messages := []models.Message{}
	for rows.Next() {
		var m models.Message
		var uName, uAvatar *string
		if err := rows.Scan(
			&m.ID, &m.ChannelID, &m.UserID, &uName, &uAvatar, &m.Content, &m.Ciphertext, &m.IV,
			&m.TaskID, &m.BugID, &m.ParentID, &m.ReplyCount, &m.LastReplyAt,
			&m.IsEdited, &m.IsDeleted, &m.EditedAt, &m.Reactions, &m.CreatedAt, &m.ExpiresAt,
		); err != nil {
			continue
		}
		if uName != nil {
			m.UserName = *uName
		}
		if uAvatar != nil {
			m.UserAvatar = *uAvatar
		}
		messages = append(messages, m)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      messages,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *MessageHandler) CreateMessage(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req struct {
		ChannelID  string  `json:"channelId"`
		Content    string  `json:"content"`
		Ciphertext *string `json:"ciphertext"`
		IV         *string `json:"iv"`
		TaskID     *string `json:"taskId"`
		BugID      *string `json:"bugId"`
		ParentID   *string `json:"parentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if req.ChannelID == "" || (strings.TrimSpace(req.Content) == "" && req.Ciphertext == nil) {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "channelId and content or ciphertext are required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	msgID := fmt.Sprintf("msg-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	ciphertext := ""
	if req.Ciphertext != nil {
		ciphertext = *req.Ciphertext
	} else if req.Content != "" {
		ciphertext = req.Content
	}

	iv := ""
	if req.IV != nil {
		iv = *req.IV
	}

	insertQuery := `
		INSERT INTO public.messages (
			id, "channelId", "userId", content, ciphertext, iv, "taskId", "bugId", "parentId",
			"replyCount", "isEdited", "isDeleted", "createdAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, false, false, $10)
	`
	_, err := h.DB.Pool.Exec(ctx, insertQuery,
		msgID, req.ChannelID, claims.ID, req.Content, ciphertext, iv,
		req.TaskID, req.BugID, req.ParentID, now,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to send message: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// If replying to thread, increment replyCount
	if req.ParentID != nil && *req.ParentID != "" {
		_, _ = h.DB.Pool.Exec(ctx, `
			UPDATE public.messages 
			SET "replyCount" = "replyCount" + 1, "lastReplyAt" = $2 
			WHERE id = $1
		`, *req.ParentID, now)
	}

	msg := models.Message{
		ID:         msgID,
		ChannelID:  req.ChannelID,
		UserID:     claims.ID,
		UserName:   claims.Name,
		Content:    req.Content,
		Ciphertext: req.Ciphertext,
		IV:         req.IV,
		TaskID:     req.TaskID,
		BugID:      req.BugID,
		ParentID:   req.ParentID,
		ReplyCount: 0,
		CreatedAt:  now,
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      msg,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	msgID := chi.URLParam(r, "id")
	ctx := r.Context()

	// Admins can delete any message; members can delete their own
	var ownerID string
	err := h.DB.Pool.QueryRow(ctx, `SELECT "userId" FROM public.messages WHERE id = $1`, msgID).Scan(&ownerID)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusNotFound, APIResponse{
				Success:   false,
				Error:     "Message not found",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if claims.Role != "admin" && claims.ID != ownerID {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "You can only delete your own messages",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	_, err = h.DB.Pool.Exec(ctx, `UPDATE public.messages SET "isDeleted" = true, content = '[Message deleted]' WHERE id = $1`, msgID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to delete message: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Message deleted successfully", "id": msgID},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
