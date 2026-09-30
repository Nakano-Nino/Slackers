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

type TaskHandler struct {
	DB          *db.Database
	Config      *config.Config
	Broadcaster Broadcaster
}

func NewTaskHandler(db *db.Database, cfg *config.Config) *TaskHandler {
	return &TaskHandler{DB: db, Config: cfg}
}

func (h *TaskHandler) SetBroadcaster(b Broadcaster) {
	h.Broadcaster = b
}

func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("projectId")
	ctx := r.Context()

	var rows pgx.Rows
	var err error

	if projectID != "" {
		query := `
			SELECT id, "projectId", title, description, status::text, priority::text,
			       "storyPoints", tags, "dueDate", "assigneeId", "creatorId",
			       "qaSteps", "qaVerdict", subtasks, attachments, "createdAt", "updatedAt"
			FROM public.tasks
			WHERE "projectId" = $1
			ORDER BY "createdAt" DESC
		`
		rows, err = h.DB.Pool.Query(ctx, query, projectID)
	} else {
		query := `
			SELECT id, "projectId", title, description, status::text, priority::text,
			       "storyPoints", tags, "dueDate", "assigneeId", "creatorId",
			       "qaSteps", "qaVerdict", subtasks, attachments, "createdAt", "updatedAt"
			FROM public.tasks
			ORDER BY "createdAt" DESC
		`
		rows, err = h.DB.Pool.Query(ctx, query)
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to query tasks: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var t models.Task
		var st, pr string
		var tags []string
		if err := rows.Scan(
			&t.ID, &t.ProjectID, &t.Title, &t.Description, &st, &pr,
			&t.StoryPoints, &tags, &t.DueDate, &t.AssigneeID, &t.CreatorID,
			&t.QASteps, &t.QAVerdict, &t.Subtasks, &t.Attachments, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			continue
		}
		t.Status = strings.ToLower(st)
		t.Priority = strings.ToLower(pr)
		t.Tags = tags
		if t.Tags == nil {
			t.Tags = []string{}
		}
		tasks = append(tasks, t)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      tasks,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
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
		ProjectID   string   `json:"projectId"`
		Title       string   `json:"title"`
		Description string   `json:"description"`
		Status      string   `json:"status"`
		Priority    string   `json:"priority"`
		StoryPoints int      `json:"storyPoints"`
		Tags        []string `json:"tags"`
		AssigneeID  *string  `json:"assigneeId"`
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

	status := strings.ToUpper(req.Status)
	if status == "" {
		status = "TODO"
	}

	priority := strings.ToUpper(req.Priority)
	if priority == "" {
		priority = "MEDIUM"
	}

	ctx := r.Context()
	taskID := fmt.Sprintf("task-%d", time.Now().UnixNano())
	now := time.Now().UTC()

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	insertQuery := `
		INSERT INTO public.tasks (id, "projectId", title, description, status, priority, "storyPoints", tags, "assigneeId", "creatorId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5::"TaskStatus", $6::"TaskPriority", $7, $8, $9, $10, $11, $12)
	`
	_, err := h.DB.Pool.Exec(ctx, insertQuery, taskID, req.ProjectID, req.Title, req.Description, status, priority, req.StoryPoints, tags, req.AssigneeID, claims.ID, now, now)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to create task: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	task := models.Task{
		ID:          taskID,
		ProjectID:   req.ProjectID,
		Title:       req.Title,
		Description: req.Description,
		Status:      strings.ToLower(status),
		Priority:    strings.ToLower(priority),
		StoryPoints: req.StoryPoints,
		Tags:        tags,
		AssigneeID:  req.AssigneeID,
		CreatorID:   claims.ID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if h.Broadcaster != nil {
		h.Broadcaster.BroadcastTaskCreated(task.ProjectID, task)
	}

	writeJSON(w, http.StatusCreated, APIResponse{
		Success:   true,
		Data:      task,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	ctx := r.Context()

	var req struct {
		Title       *string  `json:"title"`
		Description *string  `json:"description"`
		Status      *string  `json:"status"`
		Priority    *string  `json:"priority"`
		StoryPoints *int     `json:"storyPoints"`
		AssigneeID  *string  `json:"assigneeId"`
		Tags        []string `json:"tags"`
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
	args := []interface{}{taskID, now}
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
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf(`status = $%d::"TaskStatus"`, argIdx))
		args = append(args, strings.ToUpper(*req.Status))
		argIdx++
	}
	if req.Priority != nil {
		updates = append(updates, fmt.Sprintf(`priority = $%d::"TaskPriority"`, argIdx))
		args = append(args, strings.ToUpper(*req.Priority))
		argIdx++
	}
	if req.StoryPoints != nil {
		updates = append(updates, fmt.Sprintf(`"storyPoints" = $%d`, argIdx))
		args = append(args, *req.StoryPoints)
		argIdx++
	}
	if req.AssigneeID != nil {
		updates = append(updates, fmt.Sprintf(`"assigneeId" = $%d`, argIdx))
		args = append(args, *req.AssigneeID)
		argIdx++
	}
	if req.Tags != nil {
		updates = append(updates, fmt.Sprintf(`tags = $%d`, argIdx))
		args = append(args, req.Tags)
		argIdx++
	}

	query := fmt.Sprintf(`UPDATE public.tasks SET %s WHERE id = $1 RETURNING "projectId"`, strings.Join(updates, ", "))
	var projectID string
	err := h.DB.Pool.QueryRow(ctx, query, args...).Scan(&projectID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to update task: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if h.Broadcaster != nil && projectID != "" {
		h.Broadcaster.BroadcastTaskUpdated(projectID, map[string]interface{}{
			"id":        taskID,
			"projectId": projectID,
			"updatedAt": now,
		})
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Task updated successfully", "id": taskID},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	ctx := r.Context()

	var projectID string
	_ = h.DB.Pool.QueryRow(ctx, `SELECT "projectId" FROM public.tasks WHERE id = $1`, taskID).Scan(&projectID)

	_, err := h.DB.Pool.Exec(ctx, `DELETE FROM public.tasks WHERE id = $1`, taskID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, APIResponse{
			Success:   false,
			Error:     "Failed to delete task: " + err.Error(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	if h.Broadcaster != nil && projectID != "" {
		h.Broadcaster.BroadcastTaskDeleted(projectID, taskID)
	}

	writeJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Data:      map[string]string{"message": "Task deleted successfully"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
