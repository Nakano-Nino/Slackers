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

type BugHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewBugHandler(db *db.Database, cfg *config.Config) *BugHandler {
	return &BugHandler{DB: db, Config: cfg}
}

func (h *BugHandler) ListBugs(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("projectId")
	ctx := r.Context()

	var rows pgx.Rows
	var err error

	if projectID != "" {
		query := `
			SELECT id, "projectId", title, description, severity::text, status::text, environment::text,
			       "reproductionSteps", "expectedBehavior", "actualBehavior", "reportedById", "assignedToId",
			       "taskId", "createdAt", "updatedAt"
			FROM public.bugs
			WHERE "projectId" = $1
			ORDER BY "createdAt" DESC
		`
		rows, err = h.DB.Pool.Query(ctx, query, projectID)
	} else {
		query := `
			SELECT id, "projectId", title, description, severity::text, status::text, environment::text,
			       "reproductionSteps", "expectedBehavior", "actualBehavior", "reportedById", "assignedToId",
			       "taskId", "createdAt", "updatedAt"
			FROM public.bugs
			ORDER BY "createdAt" DESC
		`
		rows, err = h.DB.Pool.Query(ctx, query)
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query bugs: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	bugs := []models.Bug{}
	for rows.Next() {
		var b models.Bug
		var sev, st, env string
		if err := rows.Scan(
			&b.ID, &b.ProjectID, &b.Title, &b.Description, &sev, &st, &env,
			&b.ReproductionSteps, &b.ExpectedBehavior, &b.ActualBehavior,
			&b.ReportedByID, &b.AssignedToID, &b.TaskID, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			continue
		}
		b.Severity = strings.ToLower(sev)
		b.Status = strings.ToLower(st)
		b.Environment = strings.ToLower(env)
		bugs = append(bugs, b)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      bugs,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *BugHandler) CreateBug(w http.ResponseWriter, r *http.Request) {
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
		ProjectID          string  `json:"projectId"`
		Title              string  `json:"title"`
		Description        string  `json:"description"`
		Severity           string  `json:"severity"`
		Status             string  `json:"status"`
		Environment        string  `json:"environment"`
		ReproductionSteps  string  `json:"reproductionSteps"`
		ExpectedBehavior   string  `json:"expectedBehavior"`
		ActualBehavior     string  `json:"actualBehavior"`
		AssignedToID       *string `json:"assignedToId"`
		TaskID             *string `json:"taskId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if req.ProjectID == "" || strings.TrimSpace(req.Title) == "" {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Project ID and title are required",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	severity := strings.ToUpper(req.Severity)
	if severity == "" {
		severity = "MAJOR"
	}
	status := strings.ToUpper(req.Status)
	if status == "" {
		status = "OPEN"
	}
	env := strings.ToUpper(req.Environment)
	if env == "" {
		env = "PRODUCTION"
	}

	ctx := r.Context()
	bugID := fmt.Sprintf("bug-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	insertQuery := `
		INSERT INTO public.bugs (
			id, "projectId", title, description, severity, status, environment,
			"reproductionSteps", "expectedBehavior", "actualBehavior", "reportedById",
			"assignedToId", "taskId", "createdAt", "updatedAt"
		)
		VALUES (
			$1, $2, $3, $4, $5::"BugSeverity", $6::"BugStatus", $7::"BugEnvironment",
			$8, $9, $10, $11, $12, $13, $14, $15
		)
	`
	_, err := h.DB.Pool.Exec(ctx, insertQuery,
		bugID, req.ProjectID, req.Title, req.Description, severity, status, env,
		req.ReproductionSteps, req.ExpectedBehavior, req.ActualBehavior, claims.ID,
		req.AssignedToID, req.TaskID, now, now,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to report bug: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	bug := models.Bug{
		ID:                 bugID,
		ProjectID:          req.ProjectID,
		Title:              req.Title,
		Description:        req.Description,
		Severity:           strings.ToLower(severity),
		Status:             strings.ToLower(status),
		Environment:        strings.ToLower(env),
		ReproductionSteps:  req.ReproductionSteps,
		ExpectedBehavior:   req.ExpectedBehavior,
		ActualBehavior:     req.ActualBehavior,
		ReportedByID:       claims.ID,
		AssignedToID:       req.AssignedToID,
		TaskID:             req.TaskID,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      bug,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *BugHandler) UpdateBug(w http.ResponseWriter, r *http.Request) {
	bugID := chi.URLParam(r, "id")
	ctx := r.Context()

	var req struct {
		Title        *string `json:"title"`
		Description  *string `json:"description"`
		Severity     *string `json:"severity"`
		Status       *string `json:"status"`
		AssignedToID *string `json:"assignedToId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Error:     "Invalid request body",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	now := time.Now().UTC()
	updates := []string{`"updatedAt" = $2`}
	args := []interface{}{bugID, now}
	argIdx := 3

	if req.Title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Severity != nil {
		updates = append(updates, fmt.Sprintf(`severity = $%d::"BugSeverity"`, argIdx))
		args = append(args, strings.ToUpper(*req.Severity))
		argIdx++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf(`status = $%d::"BugStatus"`, argIdx))
		args = append(args, strings.ToUpper(*req.Status))
		argIdx++
	}
	if req.AssignedToID != nil {
		updates = append(updates, fmt.Sprintf(`"assignedToId" = $%d`, argIdx))
		args = append(args, *req.AssignedToID)
		argIdx++
	}

	query := fmt.Sprintf(`UPDATE public.bugs SET %s WHERE id = $1`, strings.Join(updates, ", "))
	_, err := h.DB.Pool.Exec(ctx, query, args...)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to update bug: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Bug updated successfully", "id": bugID},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *BugHandler) DeleteBug(w http.ResponseWriter, r *http.Request) {
	bugID := chi.URLParam(r, "id")
	ctx := r.Context()

	_, err := h.DB.Pool.Exec(ctx, `DELETE FROM public.bugs WHERE id = $1`, bugID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to delete bug: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Bug deleted successfully"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
