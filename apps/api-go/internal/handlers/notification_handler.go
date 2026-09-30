package handlers

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type NotificationHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewNotificationHandler(db *db.Database, cfg *config.Config) *NotificationHandler {
	return &NotificationHandler{DB: db, Config: cfg}
}

func (h *NotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT id, "recipientId", "senderId", "senderName", "senderAvatar",
		       type, title, content, link, "isRead", "createdAt"
		FROM public.notifications
		WHERE "recipientId" = $1
		ORDER BY "createdAt" DESC
		LIMIT 50
	`

	rows, err := h.DB.Pool.Query(ctx, query, claims.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query notifications: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(
			&n.ID, &n.RecipientID, &n.SenderID, &n.SenderName, &n.SenderAvatar,
			&n.Type, &n.Title, &n.Content, &n.Link, &n.IsRead, &n.CreatedAt,
		); err != nil {
			continue
		}
		notifications = append(notifications, n)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      notifications,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()

	_, err := h.DB.Pool.Exec(ctx, `UPDATE public.notifications SET "isRead" = true WHERE id = $1`, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Notification marked as read"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	_, err := h.DB.Pool.Exec(ctx, `UPDATE public.notifications SET "isRead" = true WHERE "recipientId" = $1`, claims.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "All notifications marked as read"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
