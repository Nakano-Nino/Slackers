package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type MemberHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewMemberHandler(db *db.Database, cfg *config.Config) *MemberHandler {
	return &MemberHandler{DB: db, Config: cfg}
}

func (h *MemberHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := `
		SELECT id, email, name, avatar, "publicKey", "encryptedPrivateKey",
		       "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
		FROM public.users
		ORDER BY name ASC
	`

	rows, err := h.DB.Pool.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query members: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	members := []models.User{}
	for rows.Next() {
		var u models.User
		var roleStr, statusStr string
		if err := rows.Scan(
			&u.ID, &u.Email, &u.Name, &u.Avatar, &u.PublicKey, &u.EncryptedPrivateKey,
			&u.KeyVaultSalt, &u.KeyVaultIv, &roleStr, &u.DeveloperRole, &statusStr,
			&u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			continue
		}
		u.Role = strings.ToLower(roleStr)
		u.Status = strings.ToLower(statusStr)
		members = append(members, u)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      members,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
