package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/Nakano-Nino/slackers-api-go/internal/auth"
)

type contextKey string

const UserContextKey contextKey = "user_claims"

func AuthMiddleware(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"success":false,"error":"Authorization header missing"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"success":false,"error":"Invalid token format"}`, http.StatusUnauthorized)
				return
			}

			claims, err := auth.VerifyToken(parts[1], secret)
			if err != nil {
				http.Error(w, `{"success":false,"error":"Invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(ctx context.Context) *auth.Claims {
	claims, ok := ctx.Value(UserContextKey).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}
