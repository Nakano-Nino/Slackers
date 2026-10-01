package models

import (
	"encoding/json"
	"time"
)

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleManager UserRole = "manager"
	RoleMember  UserRole = "member"
	RoleViewer  UserRole = "viewer"
)

type UserStatus string

const (
	StatusOnline  UserStatus = "online"
	StatusOffline UserStatus = "offline"
	StatusAway    UserStatus = "away"
)

type User struct {
	ID                  string     `json:"id"`
	Email               string     `json:"email"`
	PasswordHash        string     `json:"-"`
	Name                string     `json:"name"`
	Avatar              string     `json:"avatar"`
	PublicKey           *string    `json:"publicKey,omitempty"`
	EncryptedPrivateKey *string    `json:"encryptedPrivateKey,omitempty"`
	KeyVaultSalt        *string    `json:"keyVaultSalt,omitempty"`
	KeyVaultIv          *string    `json:"keyVaultIv,omitempty"`
	Role                string     `json:"role"`
	DeveloperRole       *string    `json:"developerRole,omitempty"`
	Status              string     `json:"status"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"updatedAt"`
}

type Channel struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsPrivate   bool      `json:"isPrivate"`
	MemberCount int       `json:"memberCount"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Key         string    `json:"key"`
	Description string    `json:"description"`
	IsPrivate   bool      `json:"isPrivate"`
	OwnerID     string    `json:"ownerId"`
	MemberIDs   []string  `json:"memberIds"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Task struct {
	ID          string          `json:"id"`
	ProjectID   string          `json:"projectId"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Status      string          `json:"status"`
	Priority    string          `json:"priority"`
	StoryPoints int             `json:"storyPoints"`
	Tags        []string        `json:"tags"`
	DueDate     *time.Time      `json:"dueDate,omitempty"`
	AssigneeID  *string         `json:"assigneeId,omitempty"`
	CreatorID   string          `json:"creatorId"`
	QASteps     json.RawMessage `json:"qaSteps,omitempty"`
	QAVerdict   *string         `json:"qaVerdict,omitempty"`
	Subtasks    json.RawMessage `json:"subtasks,omitempty"`
	Attachments json.RawMessage `json:"attachments,omitempty"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

type Bug struct {
	ID                 string     `json:"id"`
	ProjectID          string     `json:"projectId"`
	Title              string     `json:"title"`
	Description        string     `json:"description"`
	Severity           string     `json:"severity"`
	Status             string     `json:"status"`
	Environment        string     `json:"environment"`
	ReproductionSteps  string     `json:"reproductionSteps"`
	ExpectedBehavior   string     `json:"expectedBehavior"`
	ActualBehavior     string     `json:"actualBehavior"`
	ReportedByID       string     `json:"reportedById"`
	AssignedToID       *string    `json:"assignedToId,omitempty"`
	TaskID             *string    `json:"taskId,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type Message struct {
	ID          string          `json:"id"`
	ChannelID   string          `json:"channelId"`
	UserID      string          `json:"userId"`
	UserName    string          `json:"userName,omitempty"`
	UserAvatar  string          `json:"userAvatar,omitempty"`
	Content     string          `json:"content"`
	Ciphertext  *string         `json:"ciphertext,omitempty"`
	IV          *string         `json:"iv,omitempty"`
	TaskID      *string         `json:"taskId,omitempty"`
	BugID       *string         `json:"bugId,omitempty"`
	ParentID    *string         `json:"parentId,omitempty"`
	ReplyCount  int             `json:"replyCount"`
	LastReplyAt *time.Time      `json:"lastReplyAt,omitempty"`
	IsEdited    bool            `json:"isEdited"`
	IsDeleted   bool            `json:"isDeleted"`
	EditedAt    *time.Time      `json:"editedAt,omitempty"`
	Reactions   json.RawMessage `json:"reactions,omitempty"`
	CreatedAt   time.Time       `json:"createdAt"`
	ExpiresAt   *time.Time      `json:"expiresAt,omitempty"`
}

type DirectMessage struct {
	ID         string          `json:"id"`
	SenderID   string          `json:"senderId"`
	ReceiverID string          `json:"receiverId"`
	Ciphertext *string         `json:"ciphertext,omitempty"`
	IV         *string         `json:"iv,omitempty"`
	SenderCopy *string         `json:"senderCopy,omitempty"`
	IsRead     bool            `json:"isRead"`
	ReadAt     *time.Time      `json:"readAt,omitempty"`
	IsEdited   bool            `json:"isEdited"`
	IsDeleted  bool            `json:"isDeleted"`
	EditedAt   *time.Time      `json:"editedAt,omitempty"`
	Reactions  json.RawMessage `json:"reactions,omitempty"`
	CreatedAt  time.Time       `json:"createdAt"`
	ExpiresAt  *time.Time      `json:"expiresAt,omitempty"`
}

type Notification struct {
	ID           string          `json:"id"`
	RecipientID  string          `json:"recipientId"`
	SenderID     *string         `json:"senderId,omitempty"`
	SenderName   *string         `json:"senderName,omitempty"`
	SenderAvatar *string         `json:"senderAvatar,omitempty"`
	Type         string          `json:"type"`
	Title        string          `json:"title"`
	Content      string          `json:"content"`
	Link         json.RawMessage `json:"link,omitempty"`
	IsRead       bool            `json:"isRead"`
	CreatedAt    time.Time       `json:"createdAt"`
}

type TaskComment struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"taskId"`
	UserID    string    `json:"userId"`
	UserName  string    `json:"userName,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type Invitation struct {
	ID            string     `json:"id"`
	Token         string     `json:"token"`
	Email         *string    `json:"email,omitempty"`
	Role          string     `json:"role"`
	DeveloperRole *string    `json:"developerRole,omitempty"`
	InvitedByID   string     `json:"invitedById"`
	InvitedByName *string    `json:"invitedByName,omitempty"`
	ExpiresAt     time.Time  `json:"expiresAt"`
	IsUsed        bool       `json:"isUsed"`
	UsedByID      *string    `json:"usedById,omitempty"`
	UsedAt        *time.Time `json:"usedAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
}

type AddMemberRequest struct {
	Name          string  `json:"name"`
	Email         string  `json:"email"`
	Password      *string `json:"password,omitempty"`
	Role          *string `json:"role,omitempty"`
	DeveloperRole *string `json:"developerRole,omitempty"`
}

type AddMemberResponse struct {
	User         *User   `json:"user"`
	TempPassword *string `json:"tempPassword,omitempty"`
}

type CreateInvitationRequest struct {
	Email         *string `json:"email,omitempty"`
	Role          *string `json:"role,omitempty"`
	DeveloperRole *string `json:"developerRole,omitempty"`
	ExpiresInDays *int    `json:"expiresInDays,omitempty"`
}

type AcceptInvitationRequest struct {
	Token         string  `json:"token"`
	Name          string  `json:"name"`
	Email         *string `json:"email,omitempty"`
	Password      string  `json:"password"`
	DeveloperRole *string `json:"developerRole,omitempty"`
}

type UpdateMemberRoleRequest struct {
	Role          *string `json:"role,omitempty"`
	DeveloperRole *string `json:"developerRole,omitempty"`
}

