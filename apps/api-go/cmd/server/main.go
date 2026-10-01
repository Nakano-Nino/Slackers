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
	"github.com/Nakano-Nino/slackers-api-go/internal/ws"
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

	// Initialize Real-time WebSocket Hub
	hub := ws.NewHub(database, cfg.RedisURL)
	go hub.Run()
	wsHandler := ws.NewWSHandler(hub, database, cfg)

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(database, cfg)
	channelHandler := handlers.NewChannelHandler(database, cfg)
	projectHandler := handlers.NewProjectHandler(database, cfg)
	taskHandler := handlers.NewTaskHandler(database, cfg)
	taskHandler.SetBroadcaster(hub)
	bugHandler := handlers.NewBugHandler(database, cfg)
	messageHandler := handlers.NewMessageHandler(database, cfg)
	messageHandler.SetBroadcaster(hub)
	dmHandler := handlers.NewDmHandler(database, cfg)
	dmHandler.SetBroadcaster(hub)
	memberHandler := handlers.NewMemberHandler(database, cfg)
	notificationHandler := handlers.NewNotificationHandler(database, cfg)

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

	// Pure WebSocket Endpoint (WebRTC Signaling, Real-time Chat, Presence)
	r.Get("/ws", wsHandler.ServeWS)

	// Rate limiters for brute-force protection
	authRateLimiter := middleware.NewIPRateLimiter(10, time.Minute)
	inviteRateLimiter := middleware.NewIPRateLimiter(20, time.Minute)

	// Public Auth Routes
	r.Route("/api/auth", func(r chi.Router) {
		r.With(authRateLimiter.Limit).Post("/login", authHandler.Login)
		r.With(authRateLimiter.Limit).Post("/register", authHandler.Register)

		// Protected Auth Routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			r.Get("/me", authHandler.GetMe)
			r.Post("/logout", authHandler.Logout)
		})
	})

	// Public Invitation Routes
	r.With(inviteRateLimiter.Limit).Get("/api/members/invitations/verify/{token}", memberHandler.VerifyInvitation)
	r.With(inviteRateLimiter.Limit).Post("/api/members/invitations/accept", memberHandler.AcceptInvitation)

	// Protected Workspace API Routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(cfg.JWTSecret))

		// Channels
		r.Route("/api/channels", func(r chi.Router) {
			r.Get("/", channelHandler.ListChannels)
			r.Post("/", channelHandler.CreateChannel)
			r.Get("/{id}", channelHandler.GetChannel)
			r.Delete("/{id}", channelHandler.DeleteChannel)
		})

		// Projects
		r.Route("/api/projects", func(r chi.Router) {
			r.Get("/", projectHandler.ListProjects)
			r.Post("/", projectHandler.CreateProject)
			r.Get("/{id}", projectHandler.GetProject)
			r.Get("/{id}/stats", projectHandler.GetProjectStats)
		})

		// Tasks
		r.Route("/api/tasks", func(r chi.Router) {
			r.Get("/", taskHandler.ListTasks)
			r.Post("/", taskHandler.CreateTask)
			r.Put("/{id}", taskHandler.UpdateTask)
			r.Delete("/{id}", taskHandler.DeleteTask)
		})

		// Bugs
		r.Route("/api/bugs", func(r chi.Router) {
			r.Get("/", bugHandler.ListBugs)
			r.Post("/", bugHandler.CreateBug)
			r.Put("/{id}", bugHandler.UpdateBug)
			r.Delete("/{id}", bugHandler.DeleteBug)
		})

		// Channel Messages
		r.Route("/api/messages", func(r chi.Router) {
			r.Get("/", messageHandler.ListMessages)
			r.Post("/", messageHandler.CreateMessage)
			r.Delete("/{id}", messageHandler.DeleteMessage)
		})

		// Direct Messages & Key Vault
		r.Route("/api/direct-messages", func(r chi.Router) {
			r.Get("/", dmHandler.ListDms)
			r.Post("/", dmHandler.SendDm)
			r.Get("/unread-counts", dmHandler.GetUnreadCounts)
			r.Get("/key-vault", dmHandler.GetKeyVault)
			r.Post("/key-vault", dmHandler.SaveKeyVault)
			r.Post("/public-key", dmHandler.RegisterPublicKey)
			r.Get("/public-key/{userId}", dmHandler.GetUserPublicKey)
			r.Get("/{partnerId}", dmHandler.ListDms)
			r.Patch("/{partnerId}/read", dmHandler.MarkAsRead)
			r.Delete("/{id}", dmHandler.DeleteDm)
		})
		r.Route("/api/dm", func(r chi.Router) {
			r.Get("/", dmHandler.ListDms)
			r.Post("/", dmHandler.SendDm)
			r.Get("/{partnerId}", dmHandler.ListDms)
		})

		// Workspace Members & Invitations
		r.Route("/api/members", func(r chi.Router) {
			r.Get("/", memberHandler.ListMembers)
			r.Post("/", memberHandler.AddMember)
			r.Post("/invite", memberHandler.CreateInvitation)
			r.Get("/invitations", memberHandler.ListInvitations)
			r.Delete("/invitations/{id}", memberHandler.RevokeInvitation)
			r.Patch("/{id}/role", memberHandler.UpdateMemberRole)
			r.Put("/{id}/role", memberHandler.UpdateMemberRole)
		})
		r.Get("/api/users", memberHandler.ListMembers)

		// Notifications & Mutes
		r.Route("/api/notifications", func(r chi.Router) {
			r.Get("/", notificationHandler.ListNotifications)
			r.Put("/{id}/read", notificationHandler.MarkRead)
			r.Patch("/{id}/read", notificationHandler.MarkRead)
			r.Put("/read-all", notificationHandler.MarkAllRead)
			r.Patch("/read-all", notificationHandler.MarkAllRead)
			r.Get("/mutes", notificationHandler.GetMutedTargets)
			r.Post("/mute", notificationHandler.MuteTarget)
			r.Delete("/mute/{targetType}/{targetId}", notificationHandler.UnmuteTarget)
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
