package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/Nakano-Nino/slackers-api-go/internal/auth"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/models"
)

type AuthHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewAuthHandler(db *db.Database, cfg *config.Config) *AuthHandler {
	return &AuthHandler{DB: db, Config: cfg}
}

type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp string      `json:"timestamp"`
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Email and password are required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	query := `
		SELECT id, email, "passwordHash", name, avatar, "publicKey", "encryptedPrivateKey", 
		       "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
		FROM public.users
		WHERE LOWER(email) = LOWER($1)
		LIMIT 1
	`

	var user models.User
	var roleStr, statusStr string

	err := h.DB.Pool.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Avatar,
		&user.PublicKey,
		&user.EncryptedPrivateKey,
		&user.KeyVaultSalt,
		&user.KeyVaultIv,
		&roleStr,
		&user.DeveloperRole,
		&statusStr,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusUnauthorized, APIResponse{
				Success:   false,
				Error:     "Invalid credentials",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
			return
		}
		log.Printf("ERROR: Database error during user lookup: %v", err)
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Authentication service temporarily unavailable. Please try again later.",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	user.Role = strings.ToLower(roleStr)
	user.Status = strings.ToLower(statusStr)

	// Verify bcrypt password
	if !auth.ComparePassword(req.Password, user.PasswordHash) {
		writeJSON(w, http.StatusUnauthorized, APIResponse{
			Success:   false,
			Error:     "Invalid credentials",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Generate JWT Token
	token, err := auth.GenerateToken(&user, "session-"+time.Now().Format("20060102150405"), h.Config.JWTSecret)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to generate authentication token",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Data: models.LoginResponse{
			Token: token,
			User:  &user,
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
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
		SELECT id, email, "passwordHash", name, avatar, "publicKey", "encryptedPrivateKey", 
		       "keyVaultSalt", "keyVaultIv", role::text, "developerRole", status::text, "createdAt", "updatedAt"
		FROM public.users
		WHERE id = $1
		LIMIT 1
	`

	var user models.User
	var roleStr, statusStr string

	err := h.DB.Pool.QueryRow(ctx, query, claims.ID).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Avatar,
		&user.PublicKey,
		&user.EncryptedPrivateKey,
		&user.KeyVaultSalt,
		&user.KeyVaultIv,
		&roleStr,
		&user.DeveloperRole,
		&statusStr,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		writeJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Error:     "User not found",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	user.Role = strings.ToLower(roleStr)
	user.Status = strings.ToLower(statusStr)

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      &user,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Logged out successfully"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusForbidden, APIResponse{
		Success:   false,
		Error:     "Public registration is disabled. You can only join the workspace via an invitation link.",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
