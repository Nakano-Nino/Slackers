package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type clientVisitor struct {
	lastSeen time.Time
	count    int
}

type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*clientVisitor
	limit    int
	window   time.Duration
}

// NewIPRateLimiter creates an IP-based rate limiter that allows up to `limit` requests per `window`.
func NewIPRateLimiter(limit int, window time.Duration) *IPRateLimiter {
	limiter := &IPRateLimiter{
		visitors: make(map[string]*clientVisitor),
		limit:    limit,
		window:   window,
	}

	// Periodically evict expired entries to prevent memory leaks
	go func() {
		ticker := time.NewTicker(window * 2)
		for range ticker.C {
			limiter.mu.Lock()
			now := time.Now()
			for ip, v := range limiter.visitors {
				if now.Sub(v.lastSeen) > window {
					delete(limiter.visitors, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return limiter
}

// getClientIP extracts the real client IP considering reverse proxy headers.
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For (first IP in comma-separated list)
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		parts := strings.Split(xff, ",")
		ip := strings.TrimSpace(parts[0])
		if ip != "" {
			return ip
		}
	}

	// Check X-Real-IP
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fallback to RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

// Limit returns a middleware handler enforcing the rate limit.
func (rl *IPRateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		rl.mu.Lock()
		now := time.Now()
		v, exists := rl.visitors[ip]
		if !exists || now.Sub(v.lastSeen) > rl.window {
			rl.visitors[ip] = &clientVisitor{
				lastSeen: now,
				count:    1,
			}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		v.count++
		if v.count > rl.limit {
			rl.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success":   false,
				"error":     "Too many requests. Please slow down and try again later.",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			return
		}

		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}
