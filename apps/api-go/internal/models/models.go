package models

import "time"

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

type Message struct {
	ID         string     `json:"id"`
	ChannelID  string     `json:"channelId"`
	UserID     string     `json:"userId"`
	UserName   string     `json:"userName"`
	UserAvatar string     `json:"userAvatar"`
	Content    string     `json:"content"`
	Encrypted  bool       `json:"encrypted"`
	IV         *string    `json:"iv,omitempty"`
	KeyVersion *int       `json:"keyVersion,omitempty"`
	ParentID   *string    `json:"parentId,omitempty"`
	ReplyCount int        `json:"replyCount"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}
