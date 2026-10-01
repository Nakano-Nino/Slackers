package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/Nakano-Nino/slackers-api-go/internal/auth"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

var avatarPresets = []string{
	"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
}

func getAvatarForEmail(email string) string {
	idx := 0
	for _, c := range email {
		idx = (idx + int(c)) % len(avatarPresets)
	}
	return avatarPresets[idx]
}

func generateTempPassword(length int) string {
	const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "TempPass@12345"
	}
	for i, v := range b {
		b[i] = chars[int(v)%len(chars)]
	}
	return string(b)
}

func generateRandomToken(prefix string, byteLen int) string {
	b := make([]byte, byteLen)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s%s", prefix, hex.EncodeToString(b))
}

type MemberHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewMemberHandler(database *db.Database, cfg *config.Config) *MemberHandler {
	// Ensure invitations table exists in PostgreSQL
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	schemaSQL := `
		CREATE TABLE IF NOT EXISTS public.invitations (
			id TEXT PRIMARY KEY,
			email TEXT,
			role TEXT NOT NULL DEFAULT 'member',
			"developerRole" TEXT,
			token TEXT NOT NULL UNIQUE,
			"inviterId" TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			"expiresAt" TIMESTAMPTZ NOT NULL,
			"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			"acceptedAt" TIMESTAMPTZ
		);
		CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
	`
	_, _ = database.Pool.Exec(ctx, schemaSQL)

	return &MemberHandler{DB: database, Config: cfg}
}

// ListMembers handles GET /api/members and GET /api/users
func (h *MemberHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := `
		SELECT id, email, name, avatar, "publicKey", role::text, "developerRole", status::text, "createdAt", "updatedAt"
		FROM public.users
		ORDER BY name ASC
	`

	rows, err := h.DB.Pool.Query(ctx, query)
	if err != nil {
		log.Printf("ERROR: Failed to query members: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query workspace members. Please try again later.",
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
			&u.ID, &u.Email, &u.Name, &u.Avatar, &u.PublicKey,
			&roleStr, &u.DeveloperRole, &statusStr,
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

// AddMember handles POST /api/members (Direct Member Creation)
func (h *MemberHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Authentication required to add members.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	callerRole := strings.ToLower(claims.Role)
	if callerRole != "admin" && callerRole != "manager" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Permission denied: Only Admins and Managers have permission to add members.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req models.AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if name == "" || email == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Name and email are required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()

	// Check if email already exists
	var existingID string
	err := h.DB.Pool.QueryRow(ctx, `SELECT id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email).Scan(&existingID)
	if err == nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     fmt.Sprintf("Email \"%s\" is already registered in this workspace.", email),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	} else if err != pgx.ErrNoRows {
		log.Printf("ERROR: Database check failed in AddMember: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "An unexpected error occurred while verifying the email.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Prepare password
	tempPassword := ""
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		tempPassword = strings.TrimSpace(*req.Password)
	} else {
		tempPassword = generateTempPassword(12)
	}

	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to secure password",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Role & DeveloperRole
	role := "member"
	if req.Role != nil && strings.TrimSpace(*req.Role) != "" {
		rLower := strings.ToLower(strings.TrimSpace(*req.Role))
		if rLower == "admin" || rLower == "manager" || rLower == "member" || rLower == "viewer" {
			role = rLower
		}
	}

	devRole := "fullstack_developer"
	if req.DeveloperRole != nil && strings.TrimSpace(*req.DeveloperRole) != "" {
		devRole = strings.TrimSpace(*req.DeveloperRole)
	}

	avatar := getAvatarForEmail(email)
	userID := fmt.Sprintf("u-%d", time.Now().UnixMilli())

	insertQuery := `
		INSERT INTO public.users (
			id, email, "passwordHash", name, avatar, role, "developerRole", status, "createdAt", "updatedAt"
		) VALUES (
			$1, $2, $3, $4, $5, UPPER($6)::"UserRole", $7, 'ONLINE'::"UserStatus", NOW(), NOW()
		)
		RETURNING id, email, name, avatar, "publicKey", "encryptedPrivateKey",
		          "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
	`

	var newUser models.User
	var roleStr, statusStr string
	err = h.DB.Pool.QueryRow(ctx, insertQuery, userID, email, hash, name, avatar, role, devRole).Scan(
		&newUser.ID, &newUser.Email, &newUser.Name, &newUser.Avatar, &newUser.PublicKey, &newUser.EncryptedPrivateKey,
		&newUser.KeyVaultSalt, &newUser.KeyVaultIv, &roleStr, &newUser.DeveloperRole, &statusStr,
		&newUser.CreatedAt, &newUser.UpdatedAt,
	)
	if err != nil {
		log.Printf("ERROR: Failed to create user in database: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create user in database. Please verify input data and try again.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	newUser.Role = strings.ToLower(roleStr)
	newUser.Status = strings.ToLower(statusStr)
	newUser.EncryptedPrivateKey = nil
	newUser.KeyVaultSalt = nil
	newUser.KeyVaultIv = nil

	writeJSON(w, http.StatusCreated, APIResponse{
		Success: true,
		Data: models.AddMemberResponse{
			User:         &newUser,
			TempPassword: &tempPassword,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// UpdateMemberRole handles PATCH or PUT /api/members/{id}/role
func (h *MemberHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Authentication required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	callerRole := strings.ToLower(claims.Role)
	if callerRole != "admin" && callerRole != "manager" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Permission denied: Only Admins and Managers can update member roles.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	targetID := chi.URLParam(r, "id")
	if targetID == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Member ID is required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var newRoleUpper string
	if req.Role != nil && *req.Role != "" {
		rLower := strings.ToLower(*req.Role)
		if rLower != "admin" && rLower != "manager" && rLower != "member" && rLower != "viewer" {
			writeJSON(w, http.StatusBadRequest, APIResponse{
				Success:   false,
				Error:     "Invalid role specified",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
		newRoleUpper = strings.ToUpper(rLower)
	}

	ctx := r.Context()
	query := `
		UPDATE public.users
		SET role = CASE WHEN $1 != '' THEN $1::"UserRole" ELSE role END,
		    "developerRole" = COALESCE($2, "developerRole"),
		    "updatedAt" = NOW()
		WHERE id = $3
		RETURNING id, email, name, avatar, "publicKey", "encryptedPrivateKey",
		          "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
	`

	var u models.User
	var roleStr, statusStr string
	err := h.DB.Pool.QueryRow(ctx, query, newRoleUpper, req.DeveloperRole, targetID).Scan(
		&u.ID, &u.Email, &u.Name, &u.Avatar, &u.PublicKey, &u.EncryptedPrivateKey,
		&u.KeyVaultSalt, &u.KeyVaultIv, &roleStr, &u.DeveloperRole, &statusStr,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		log.Printf("ERROR: Failed to update member role: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to update member role. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	u.Role = strings.ToLower(roleStr)
	u.Status = strings.ToLower(statusStr)
	u.EncryptedPrivateKey = nil
	u.KeyVaultSalt = nil
	u.KeyVaultIv = nil

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      &u,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// CreateInvitation handles POST /api/members/invite
func (h *MemberHandler) CreateInvitation(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Authentication required to generate invitations.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	callerRole := strings.ToLower(claims.Role)
	if callerRole != "admin" && callerRole != "manager" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Permission denied: Only Admins and Managers have permission to generate invite links.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req models.CreateInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	role := "member"
	if req.Role != nil && strings.TrimSpace(*req.Role) != "" {
		role = strings.ToLower(strings.TrimSpace(*req.Role))
	}

	devRole := "fullstack_developer"
	if req.DeveloperRole != nil && strings.TrimSpace(*req.DeveloperRole) != "" {
		devRole = strings.TrimSpace(*req.DeveloperRole)
	}

	days := 7
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		days = *req.ExpiresInDays
	}

	expiresAt := time.Now().AddDate(0, 0, days)
	token := generateRandomToken("inv_", 16)
	inviteID := fmt.Sprintf("inv-%d-%s", time.Now().UnixMilli(), generateRandomToken("", 4))

	var targetEmail *string
	if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		norm := strings.ToLower(strings.TrimSpace(*req.Email))
		targetEmail = &norm
	}

	ctx := r.Context()
	query := `
		INSERT INTO public.invitations (
			id, token, email, role, "developerRole", "inviterId", status, "expiresAt", "createdAt"
		) VALUES (
			$1, $2, $3, $4, $5, $6, 'pending', $7, NOW()
		)
		RETURNING id, token, email, role, "developerRole", "inviterId", status, "expiresAt", "createdAt"
	`

	var inv models.Invitation
	var statusStr string
	err := h.DB.Pool.QueryRow(ctx, query, inviteID, token, targetEmail, role, devRole, claims.ID, expiresAt).Scan(
		&inv.ID, &inv.Token, &inv.Email, &inv.Role, &inv.DeveloperRole, &inv.InvitedByID,
		&statusStr, &inv.ExpiresAt, &inv.CreatedAt,
	)
	if err != nil {
		log.Printf("ERROR: Failed to persist invitation: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create invitation. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	inv.InvitedByName = &claims.Name
	inv.IsUsed = (statusStr == "accepted")

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      &inv,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// ListInvitations handles GET /api/members/invitations
func (h *MemberHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Authentication required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	callerRole := strings.ToLower(claims.Role)
	if callerRole != "admin" && callerRole != "manager" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Permission denied: Only Admins and Managers can view active invitations.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT i.id, i.token, i.email, i.role, i."developerRole", i."inviterId", u.name,
		       i.status, i."expiresAt", i."createdAt", i."acceptedAt"
		FROM public.invitations i
		LEFT JOIN public.users u ON i."inviterId" = u.id
		WHERE i.status = 'pending' AND i."expiresAt" > NOW()
		ORDER BY i."createdAt" DESC
	`

	rows, err := h.DB.Pool.Query(ctx, query)
	if err != nil {
		log.Printf("ERROR: Failed to query invitations: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query invitations. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	invites := []models.Invitation{}
	for rows.Next() {
		var inv models.Invitation
		var statusStr string
		var inviterName *string
		if err := rows.Scan(
			&inv.ID, &inv.Token, &inv.Email, &inv.Role, &inv.DeveloperRole, &inv.InvitedByID,
			&inviterName, &statusStr, &inv.ExpiresAt, &inv.CreatedAt, &inv.UsedAt,
		); err != nil {
			continue
		}
		inv.InvitedByName = inviterName
		inv.IsUsed = (statusStr == "accepted")
		invites = append(invites, inv)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      invites,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// RevokeInvitation handles DELETE /api/members/invitations/{id}
func (h *MemberHandler) RevokeInvitation(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Authentication required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	callerRole := strings.ToLower(claims.Role)
	if callerRole != "admin" && callerRole != "manager" {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Permission denied: Only Admins and Managers can revoke invitations.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	id := chi.URLParam(r, "id")
	ctx := r.Context()

	result, err := h.DB.Pool.Exec(ctx, `DELETE FROM public.invitations WHERE id = $1 OR token = $1`, id)
	if err != nil {
		log.Printf("ERROR: Failed to revoke invitation: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to revoke invitation. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if result.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Error:     fmt.Sprintf("Invitation \"%s\" not found.", id),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"id": id},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// VerifyInvitation handles public GET /api/members/invitations/verify/{token}
func (h *MemberHandler) VerifyInvitation(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(chi.URLParam(r, "token"))
	if token == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invitation token is required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT i.id, i.token, i.email, i.role, i."developerRole", i."inviterId", u.name,
		       i.status, i."expiresAt", i."createdAt"
		FROM public.invitations i
		LEFT JOIN public.users u ON i."inviterId" = u.id
		WHERE i.token = $1
		LIMIT 1
	`

	var inv models.Invitation
	var statusStr string
	var inviterName *string
	err := h.DB.Pool.QueryRow(ctx, query, token).Scan(
		&inv.ID, &inv.Token, &inv.Email, &inv.Role, &inv.DeveloperRole, &inv.InvitedByID,
		&inviterName, &statusStr, &inv.ExpiresAt, &inv.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusBadRequest, APIResponse{
				Success:   false,
				Error:     "Invitation link is invalid or does not exist.",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
		log.Printf("ERROR: Database error verifying invitation: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "An error occurred while verifying the invitation. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if statusStr == "accepted" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "This invitation has already been used to join the workspace.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if inv.ExpiresAt.Before(time.Now()) {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "This invitation link has expired. Please request a new invite.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	inv.InvitedByName = inviterName
	inv.IsUsed = false

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"valid":      true,
			"invitation": inv,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// AcceptInvitation handles public POST /api/members/invitations/accept
func (h *MemberHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	var req models.AcceptInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	token := strings.TrimSpace(req.Token)
	name := strings.TrimSpace(req.Name)
	if token == "" || name == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Token, name, and password are required.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()

	// Verify Invitation
	query := `
		SELECT id, token, email, role, "developerRole", status, "expiresAt"
		FROM public.invitations
		WHERE token = $1
		LIMIT 1
	`
	var invID, invToken, invRole, invStatus string
	var invEmail, invDevRole *string
	var expiresAt time.Time
	err := h.DB.Pool.QueryRow(ctx, query, token).Scan(
		&invID, &invToken, &invEmail, &invRole, &invDevRole, &invStatus, &expiresAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusBadRequest, APIResponse{
				Success:   false,
				Error:     "Invalid invitation link.",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
		log.Printf("ERROR: Database error in AcceptInvitation: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "An error occurred while processing the invitation. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if invStatus == "accepted" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "This invitation has already been accepted.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if expiresAt.Before(time.Now()) {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "This invitation link has expired.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	targetEmail := ""
	if invEmail != nil && strings.TrimSpace(*invEmail) != "" {
		targetEmail = strings.ToLower(strings.TrimSpace(*invEmail))
	} else if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		targetEmail = strings.ToLower(strings.TrimSpace(*req.Email))
	}

	if targetEmail == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "An email address is required to accept this invitation.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Check if targetEmail already registered
	var existingID string
	err = h.DB.Pool.QueryRow(ctx, `SELECT id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`, targetEmail).Scan(&existingID)
	if err == nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     fmt.Sprintf("An account with email \"%s\" already exists. Please log in instead.", targetEmail),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Hash password
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to secure password",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	devRole := "fullstack_developer"
	if invDevRole != nil && *invDevRole != "" {
		devRole = *invDevRole
	} else if req.DeveloperRole != nil && *req.DeveloperRole != "" {
		devRole = *req.DeveloperRole
	}

	avatar := getAvatarForEmail(targetEmail)
	userID := fmt.Sprintf("u-%d", time.Now().UnixMilli())

	insertQuery := `
		INSERT INTO public.users (
			id, email, "passwordHash", name, avatar, role, "developerRole", status, "createdAt", "updatedAt"
		) VALUES (
			$1, $2, $3, $4, $5, UPPER($6)::"UserRole", $7, 'ONLINE'::"UserStatus", NOW(), NOW()
		)
		RETURNING id, email, name, avatar, "publicKey", "encryptedPrivateKey",
		          "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
	`

	var newUser models.User
	var roleStr, statusStr string
	err = h.DB.Pool.QueryRow(ctx, insertQuery, userID, targetEmail, hash, name, avatar, invRole, devRole).Scan(
		&newUser.ID, &newUser.Email, &newUser.Name, &newUser.Avatar, &newUser.PublicKey, &newUser.EncryptedPrivateKey,
		&newUser.KeyVaultSalt, &newUser.KeyVaultIv, &roleStr, &newUser.DeveloperRole, &statusStr,
		&newUser.CreatedAt, &newUser.UpdatedAt,
	)
	if err != nil {
		log.Printf("ERROR: Failed to create user in AcceptInvitation: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create user account. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	newUser.Role = strings.ToLower(roleStr)
	newUser.Status = strings.ToLower(statusStr)
	newUser.EncryptedPrivateKey = nil
	newUser.KeyVaultSalt = nil
	newUser.KeyVaultIv = nil

	// Mark invitation accepted
	_, _ = h.DB.Pool.Exec(ctx, `UPDATE public.invitations SET status = 'accepted', "acceptedAt" = NOW() WHERE id = $1`, invID)

	// Generate JWT Token
	tokenString, err := auth.GenerateToken(&newUser, "session-"+time.Now().Format("20060102150405"), h.Config.JWTSecret)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to generate authentication token",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success: true,
		Data: models.LoginResponse{
			Token: tokenString,
			User:  &newUser,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
