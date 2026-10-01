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

type ProjectHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewProjectHandler(db *db.Database, cfg *config.Config) *ProjectHandler {
	return &ProjectHandler{DB: db, Config: cfg}
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	query := `
		SELECT id, name, key, description, "isPrivate", "memberIds", "ownerId", "createdAt", "updatedAt"
		FROM public.projects
		ORDER BY name ASC
	`

	rows, err := h.DB.Pool.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query projects: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		var memberIDs []string
		if err := rows.Scan(&p.ID, &p.Name, &p.Key, &p.Description, &p.IsPrivate, &memberIDs, &p.OwnerID, &p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		p.MemberIDs = memberIDs
		if p.MemberIDs == nil {
			p.MemberIDs = []string{}
		}
		projects = append(projects, p)
	}

	if len(projects) == 0 {
		_, _ = h.DB.Pool.Exec(ctx, `
			INSERT INTO public.projects (id, name, key, description, "isPrivate", "ownerId", "memberIds", "createdAt", "updatedAt")
			VALUES ('proj-core', 'Core Platform', 'CORE', 'Primary workspace engineering project', false, 'u-admin', '{}', NOW(), NOW())
			ON CONFLICT (id) DO NOTHING;
		`)
		projects = append(projects, models.Project{
			ID:          "proj-core",
			Name:        "Core Platform",
			Key:         "CORE",
			Description: "Primary workspace engineering project",
			IsPrivate:   false,
			OwnerID:     "u-admin",
			MemberIDs:   []string{},
			CreatedAt:   time.Now().UTC(),
			UpdatedAt:   time.Now().UTC(),
		})
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      projects,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserFromContext(r.Context())
	if claims == nil || (claims.Role != "admin" && claims.Role != "manager") {
		writeJSON(w, http.StatusForbidden, APIResponse{
			Success:   false,
			Error:     "Only admins and managers can create projects",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	var req struct {
		Name        string   `json:"name"`
		Key         string   `json:"key"`
		Description string   `json:"description"`
		IsPrivate   bool     `json:"isPrivate"`
		MemberIDs   []string `json:"memberIds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	name := strings.TrimSpace(req.Name)
	key := strings.ToUpper(strings.TrimSpace(req.Key))
	if name == "" || key == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Project name and key are required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	ctx := r.Context()
	projectID := fmt.Sprintf("proj-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	members := req.MemberIDs
	if len(members) == 0 {
		members = []string{claims.ID}
	}

	insertQuery := `
		INSERT INTO public.projects (id, name, key, description, "isPrivate", "memberIds", "ownerId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := h.DB.Pool.Exec(ctx, insertQuery, projectID, name, key, req.Description, req.IsPrivate, members, claims.ID, now, now)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create project: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	project := models.Project{
		ID:          projectID,
		Name:        name,
		Key:         key,
		Description: req.Description,
		IsPrivate:   req.IsPrivate,
		OwnerID:     claims.ID,
		MemberIDs:   members,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      project,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	ctx := r.Context()

	query := `
		SELECT id, name, key, description, "isPrivate", "memberIds", "ownerId", "createdAt", "updatedAt"
		FROM public.projects
		WHERE id = $1
		LIMIT 1
	`

	var p models.Project
	var memberIDs []string
	err := h.DB.Pool.QueryRow(ctx, query, projectID).Scan(
		&p.ID, &p.Name, &p.Key, &p.Description, &p.IsPrivate, &memberIDs, &p.OwnerID, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			writeJSON(w, http.StatusNotFound, APIResponse{
				Success:   false,
				Error:     "Project not found",
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

	p.MemberIDs = memberIDs
	if p.MemberIDs == nil {
		p.MemberIDs = []string{}
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      p,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *ProjectHandler) GetProjectStats(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	ctx := r.Context()

	var totalTasks, doneTasks, inProgressTasks, todoTasks, backlogTasks int
	var totalBugs, resolvedBugs int

	taskQuery := `
		SELECT status::text, count(*) 
		FROM public.tasks 
		WHERE "projectId" = $1 
		GROUP BY status
	`
	rows, err := h.DB.Pool.Query(ctx, taskQuery, projectID)
	if err == nil {
		for rows.Next() {
			var st string
			var count int
			if err := rows.Scan(&st, &count); err == nil {
				totalTasks += count
				switch strings.ToUpper(st) {
				case "DONE":
					doneTasks += count
				case "IN_PROGRESS":
					inProgressTasks += count
				case "TODO":
					todoTasks += count
				case "BACKLOG":
					backlogTasks += count
				}
			}
		}
		rows.Close()
	}

	bugQuery := `
		SELECT status::text, count(*) 
		FROM public.bugs 
		WHERE "projectId" = $1 
		GROUP BY status
	`
	bRows, bErr := h.DB.Pool.Query(ctx, bugQuery, projectID)
	if bErr == nil {
		for bRows.Next() {
			var st string
			var count int
			if err := bRows.Scan(&st, &count); err == nil {
				totalBugs += count
				if strings.ToUpper(st) == "RESOLVED" || strings.ToUpper(st) == "CLOSED" {
					resolvedBugs += count
				}
			}
		}
		bRows.Close()
	}

	var progress int
	if totalTasks > 0 {
		progress = (doneTasks * 100) / totalTasks
	}

	stats := map[string]interface{}{
		"projectId":       projectID,
		"totalTasks":      totalTasks,
		"doneTasks":       doneTasks,
		"inProgressTasks": inProgressTasks,
		"todoTasks":       todoTasks,
		"backlogTasks":    backlogTasks,
		"totalBugs":       totalBugs,
		"resolvedBugs":    resolvedBugs,
		"progress":        progress,
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      stats,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
