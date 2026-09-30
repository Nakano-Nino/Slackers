package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	DirectURL   string
	RedisURL    string
	JWTSecret   string
	ClientURL   string
	Environment string
}

func Load() *Config {
	// Attempt to load .env from current directory or parent directories
	_ = godotenv.Load(".env", "../api/.env", "../../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "5001"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("WARNING: DATABASE_URL is not set")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_slackers_jwt_secret_key_change_in_production"
	}

	clientURL := os.Getenv("CLIENT_URL")
	if clientURL == "" {
		clientURL = "http://localhost:3000"
	}

	env := os.Getenv("NODE_ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		DirectURL:   os.Getenv("DIRECT_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		JWTSecret:   jwtSecret,
		ClientURL:   clientURL,
		Environment: env,
	}
}
