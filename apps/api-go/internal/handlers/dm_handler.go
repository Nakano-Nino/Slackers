package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type DmHandler struct {
	DB          *db.Database
	Config      *config.Config
	Broadcaster Broadcaster
}

func NewDmHandler(db *db.Database, cfg *config.Config) *DmHandler {
	return &DmHandler{DB: db, Config: cfg}
}

func (h *DmHandler) SetBroadcaster(b Broadcaster) {
	h.Broadcaster = b
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

	partnerID := chi.URLParam(r, "partnerId")
	if partnerID == "" {
		partnerID = r.URL.Query().Get("withUserId")
	}

	if partnerID == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "partnerId is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	ctx := r.Context()
	query := `
		SELECT id, "senderId", "receiverId", ciphertext, iv, "senderCopy", "isRead", "readAt",
		       "isEdited", "isDeleted", "editedAt", reactions, "createdAt", "expiresAt"
		FROM public.direct_messages
		WHERE (("senderId" = $1 AND "receiverId" = $2)
		   OR ("senderId" = $2 AND "receiverId" = $1))
		   AND "isDeleted" = false
		ORDER BY "createdAt" ASC
		LIMIT $3
	`

	rows, err := h.DB.Pool.Query(ctx, query, claims.ID, partnerID, limit)
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

	if h.Broadcaster != nil {
		h.Broadcaster.BroadcastNewDM(claims.ID, req.ReceiverID, dm)
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      dm,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// GetUnreadCounts handles GET /api/direct-messages/unread-counts
func (h *DmHandler) GetUnreadCounts(w http.ResponseWriter, r *http.Request) {
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
		SELECT "senderId", COUNT(*) as cnt
		FROM public.direct_messages
		WHERE "receiverId" = $1 AND "isRead" = false AND "isDeleted" = false
		GROUP BY "senderId"
	`

	rows, err := h.DB.Pool.Query(ctx, query, claims.ID)
	if err != nil {
		writeJSON(w, http.StatusOK, APIResponse{
			Success:   true,
			Data:      map[string]int{},
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var senderID string
		var cnt int
		if err := rows.Scan(&senderID, &cnt); err == nil {
			counts[senderID] = cnt
		}
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      counts,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// MarkAsRead handles PATCH /api/direct-messages/{partnerId}/read
func (h *DmHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	partnerID := chi.URLParam(r, "partnerId")
	ctx := r.Context()

	res, err := h.DB.Pool.Exec(ctx, `
		UPDATE public.direct_messages
		SET "isRead" = true, "readAt" = NOW()
		WHERE "senderId" = $1 AND "receiverId" = $2 AND "isRead" = false
	`, partnerID, claims.ID)

	marked := int(res.RowsAffected())
	if err != nil {
		marked = 0
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]int{"markedCount": marked},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// GetKeyVault handles GET /api/direct-messages/key-vault
func (h *DmHandler) GetKeyVault(w http.ResponseWriter, r *http.Request) {
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
	var pubKey, encPrivKey, salt, iv *string
	err := h.DB.Pool.QueryRow(ctx, `
		SELECT "publicKey", "encryptedPrivateKey", "keyVaultSalt", "keyVaultIv"
		FROM public.users
		WHERE id = $1
	`, claims.ID).Scan(&pubKey, &encPrivKey, &salt, &iv)

	if err != nil || pubKey == nil || encPrivKey == nil {
		writeJSON(w, http.StatusOK, APIResponse{
			Success:   true,
			Data:      nil,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"publicKey":           pubKey,
			"encryptedPrivateKey": encPrivKey,
			"keyVaultSalt":        salt,
			"keyVaultIv":          iv,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// SaveKeyVault handles POST /api/direct-messages/key-vault
func (h *DmHandler) SaveKeyVault(w http.ResponseWriter, r *http.Request) {
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
		PublicKey           string `json:"publicKey"`
		EncryptedPrivateKey string `json:"encryptedPrivateKey"`
		KeyVaultSalt        string `json:"keyVaultSalt"`
		KeyVaultIv          string `json:"keyVaultIv"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	_, err := h.DB.Pool.Exec(ctx, `
		UPDATE public.users
		SET "publicKey" = $1, "encryptedPrivateKey" = $2, "keyVaultSalt" = $3, "keyVaultIv" = $4, "updatedAt" = NOW()
		WHERE id = $5
	`, req.PublicKey, req.EncryptedPrivateKey, req.KeyVaultSalt, req.KeyVaultIv, claims.ID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to save key vault: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]bool{"updated": true},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// RegisterPublicKey handles POST /api/direct-messages/public-key
func (h *DmHandler) RegisterPublicKey(w http.ResponseWriter, r *http.Request) {
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
		PublicKey string `json:"publicKey"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PublicKey == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "publicKey is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	_, err := h.DB.Pool.Exec(ctx, `UPDATE public.users SET "publicKey" = $1, "updatedAt" = NOW() WHERE id = $2`, req.PublicKey, claims.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to register public key: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]bool{"updated": true},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// GetUserPublicKey handles GET /api/direct-messages/public-key/{userId}
func (h *DmHandler) GetUserPublicKey(w http.ResponseWriter, r *http.Request) {
	targetID := chi.URLParam(r, "userId")
	ctx := r.Context()

	var pubKey *string
	err := h.DB.Pool.QueryRow(ctx, `SELECT "publicKey" FROM public.users WHERE id = $1`, targetID).Scan(&pubKey)
	if err != nil && err != pgx.ErrNoRows {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Database error: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]*string{"publicKey": pubKey},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// DeleteDm handles DELETE /api/direct-messages/{id}
func (h *DmHandler) DeleteDm(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Unauthorized",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	id := chi.URLParam(r, "id")
	ctx := r.Context()

	_, _ = h.DB.Pool.Exec(ctx, `UPDATE public.direct_messages SET "isDeleted" = true, "updatedAt" = NOW() WHERE id = $1 AND "senderId" = $2`, id, claims.ID)

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"messageId": id},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
