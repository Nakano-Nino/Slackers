package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type DmHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewDmHandler(db *db.Database, cfg *config.Config) *DmHandler {
	return &DmHandler{DB: db, Config: cfg}
}

func (h *DmHandler) ListDms(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	withUserID := r.URL.Query().Get("withUserId")
	if withUserID == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "withUserId query parameter is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT id, "senderId", "receiverId", ciphertext, iv, "senderCopy", "isRead", "readAt",
		       "isEdited", "isDeleted", "editedAt", reactions, "createdAt", "expiresAt"
		FROM public.direct_messages
		WHERE ("senderId" = $1 AND "receiverId" = $2)
		   OR ("senderId" = $2 AND "receiverId" = $1)
		ORDER BY "createdAt" ASC
		LIMIT 100
	`

	rows, err := h.DB.Pool.Query(ctx, query, claims.ID, withUserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query direct messages: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	dms := []models.DirectMessage{}
	for rows.Next() {
		var dm models.DirectMessage
		if err := rows.Scan(
			&dm.ID, &dm.SenderID, &dm.ReceiverID, &dm.Ciphertext, &dm.IV, &dm.SenderCopy,
			&dm.IsRead, &dm.ReadAt, &dm.IsEdited, &dm.IsDeleted, &dm.EditedAt,
			&dm.Reactions, &dm.CreatedAt, &dm.ExpiresAt,
		); err != nil {
			continue
		}
		dms = append(dms, dm)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      dms,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *DmHandler) SendDm(w http.ResponseWriter, r *http.Request) {
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
		ReceiverID string  `json:"receiverId"`
		Ciphertext *string `json:"ciphertext"`
		IV         *string `json:"iv"`
		SenderCopy *string `json:"senderCopy"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if req.ReceiverID == "" || req.Ciphertext == nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "receiverId and ciphertext are required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	dmID := fmt.Sprintf("dm-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	ciphertext := ""
	if req.Ciphertext != nil {
		ciphertext = *req.Ciphertext
	}
	iv := ""
	if req.IV != nil {
		iv = *req.IV
	}
	senderCopy := ""
	if req.SenderCopy != nil {
		senderCopy = *req.SenderCopy
	}

	insertQuery := `
		INSERT INTO public.direct_messages (
			id, "senderId", "receiverId", ciphertext, iv, "senderCopy", "isRead", "isEdited", "isDeleted", "createdAt"
		)
		VALUES ($1, $2, $3, $4, $5, $6, false, false, false, $7)
	`
	_, err := h.DB.Pool.Exec(ctx, insertQuery,
		dmID, claims.ID, req.ReceiverID, ciphertext, iv, senderCopy, now,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to send direct message: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	dm := models.DirectMessage{
		ID:         dmID,
		SenderID:   claims.ID,
		ReceiverID: req.ReceiverID,
		Ciphertext: req.Ciphertext,
		IV:         req.IV,
		SenderCopy: req.SenderCopy,
		IsRead:     false,
		CreatedAt:  now,
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      dm,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
