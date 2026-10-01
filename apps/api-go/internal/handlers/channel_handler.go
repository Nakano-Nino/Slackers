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

type ChannelHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewChannelHandler(db *db.Database, cfg *config.Config) *ChannelHandler {
	return &ChannelHandler{DB: db, Config: cfg}
}

func (h *ChannelHandler) ListChannels(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := `
		SELECT c.id, c.name, c.description, c."isPrivate", c."createdAt", c."updatedAt",
		       COALESCE(COUNT(cm.id), 0) as member_count
		FROM public.channels c
		LEFT JOIN public.channel_members cm ON c.id = cm."channelId"
		GROUP BY c.id, c.name, c.description, c."isPrivate", c."createdAt", c."updatedAt"
		ORDER BY c.name ASC
	`

	rows, err := h.DB.Pool.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query channels: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	channels := []models.Channel{}
	for rows.Next() {
		var c models.Channel
		var memberCount int64
		if err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.IsPrivate, &c.CreatedAt, &c.UpdatedAt, &memberCount); err != nil {
			continue
		}
		c.MemberCount = int(memberCount)
		channels = append(channels, c)
	}

	if len(channels) == 0 {
		_, _ = h.DB.Pool.Exec(ctx, `
			INSERT INTO public.channels (id, name, description, "isPrivate", "createdAt", "updatedAt")
			VALUES ('general', 'general', 'Company-wide announcements and general discussion', false, NOW(), NOW())
			ON CONFLICT (id) DO NOTHING;
		`)
		channels = append(channels, models.Channel{
			ID:          "general",
			Name:        "general",
			Description: "Company-wide announcements and general discussion",
			IsPrivate:   false,
			MemberCount: 1,
			CreatedAt:   time.Now().UTC(),
			UpdatedAt:   time.Now().UTC(),
		})
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      channels,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ChannelHandler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil || (claims.Role != "admin" && claims.Role != "manager") {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Only admins and managers can create channels",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		IsPrivate   bool   `json:"isPrivate"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	name := strings.ToLower(strings.TrimSpace(req.Name))
	name = strings.ReplaceAll(name, " ", "-")
	if name == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Channel name is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	channelID := fmt.Sprintf("c-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	tx, err := h.DB.Pool.Begin(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to start transaction: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer tx.Rollback(ctx)

	insertQuery := `
		INSERT INTO public.channels (id, name, description, "isPrivate", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = tx.Exec(ctx, insertQuery, channelID, name, req.Description, req.IsPrivate, now, now)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create channel: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Add creator as channel member
	memberID := fmt.Sprintf("cm-%d", time.Now().UnixNano())
	memberQuery := `
		INSERT INTO public.channel_members (id, "channelId", "userId", role, "joinedAt")
		VALUES ($1, $2, $3, $4, $5)
	`
	_, _ = tx.Exec(ctx, memberQuery, memberID, channelID, claims.ID, "ADMIN", now)

	if err := tx.Commit(ctx); err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to commit channel transaction: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	channel := models.Channel{
		ID:          channelID,
		Name:        name,
		Description: req.Description,
		IsPrivate:   req.IsPrivate,
		MemberCount: 1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      channel,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ChannelHandler) GetChannel(w http.ResponseWriter, r *http.Request) {
	channelID := chi.URLParam(r, "id")
	ctx := r.Context()

	query := `
		SELECT c.id, c.name, c.description, c."isPrivate", c."createdAt", c."updatedAt",
		       COALESCE(COUNT(cm.id), 0) as member_count
		FROM public.channels c
		LEFT JOIN public.channel_members cm ON c.id = cm."channelId"
		WHERE c.id = $1
		GROUP BY c.id, c.name, c.description, c."isPrivate", c."createdAt", c."updatedAt"
		LIMIT 1
	`

	var c models.Channel
	var memberCount int64
	err := h.DB.Pool.QueryRow(ctx, query, channelID).Scan(
		&c.ID, &c.Name, &c.Description, &c.IsPrivate, &c.CreatedAt, &c.UpdatedAt, &memberCount,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusNotFound, APIResponse{
				Success:   false,
				Error:     "Channel not found",
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

	c.MemberCount = int(memberCount)
	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      c,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ChannelHandler) DeleteChannel(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil || strings.ToLower(claims.Role) != "admin" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Only admins can delete channels",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	channelID := chi.URLParam(r, "id")
	if channelID == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Channel ID is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if strings.ToLower(channelID) == "general" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "The default #general channel cannot be deleted",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	tx, err := h.DB.Pool.Begin(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to start transaction: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, `DELETE FROM public.messages WHERE "channelId" = $1`, channelID)
	_, _ = tx.Exec(ctx, `DELETE FROM public.channel_members WHERE "channelId" = $1`, channelID)
	_, _ = tx.Exec(ctx, `DELETE FROM public.channel_keys WHERE "channelId" = $1`, channelID)
	_, _ = tx.Exec(ctx, `DELETE FROM public.webhooks WHERE "channelId" = $1`, channelID)

	res, err := tx.Exec(ctx, `DELETE FROM public.channels WHERE id = $1`, channelID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to delete channel: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if res.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Error:     "Channel not found",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to commit deletion: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"id": channelID, "message": "Channel deleted successfully"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
