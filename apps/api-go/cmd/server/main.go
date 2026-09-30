package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/Nakano-Nino/slackers-api-go/internal/config"
	"github.com/Nakano-Nino/slackers-api-go/internal/db"
	"github.com/Nakano-Nino/slackers-api-go/internal/handlers"
	"github.com/Nakano-Nino/slackers-api-go/internal/middleware"
)

func main() {
	cfg := config.Load()

	log.Printf("🚀 Starting Slackers API (Go) on port %s [%s]...", cfg.Port, cfg.Environment)

	// Connect to Supabase PostgreSQL
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(database, cfg)

	// Setup Chi Router
	r := chi.NewRouter()

	// Global Middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(middleware.CorsMiddleware(cfg.ClientURL))

	// Health Check Route
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		dbStatus := "connected"
		if err := database.Pool.Ping(ctx); err != nil {
			dbStatus = "error: " + err.Error()
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"service":   "slackers-api-go",
			"runtime":   "go",
			"database":  map[string]string{"postgres": dbStatus},
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Public Auth Routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/login", authHandler.Login)
		r.Post("/register", authHandler.Register)

		// Protected Auth Routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			r.Get("/me", authHandler.GetMe)
			r.Post("/logout", authHandler.Logout)
		})
	})

	// HTTP Server Configuration
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful Shutdown Channel
	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("⚡ Server listening on http://localhost:%s", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("❌ Error starting server: %v", err)
	case sig := <-shutdown:
		log.Printf("🛑 Initiating graceful shutdown (signal: %v)...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("⚠️ Graceful shutdown error: %v", err)
			_ = server.Close()
		}
		log.Println("✓ Server stopped gracefully.")
	}
}
