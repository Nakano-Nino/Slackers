package ws

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
)

const redisChannel = "slackers:ws:events"

type RedisPubSub struct {
	client *redis.Client
	ctx    context.Context
	cancel context.CancelFunc
}

func NewRedisPubSub(redisURL string) *RedisPubSub {
	if redisURL == "" {
		return nil
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("⚠️ Invalid REDIS_URL '%s': %v (running in-memory)", redisURL, err)
		return nil
	}

	client := redis.NewClient(opt)
	ctx, cancel := context.WithCancel(context.Background())

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis unavailable at %s: %v (running in-memory)", redisURL, err)
		cancel()
		_ = client.Close()
		return nil
	}

	log.Printf("⚡ Connected to Redis Pub/Sub at %s", opt.Addr)
	return &RedisPubSub{
		client: client,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (r *RedisPubSub) Publish(envelope RedisEnvelope) {
	if r == nil || r.client == nil {
		return
	}

	data, err := json.Marshal(envelope)
	if err != nil {
		log.Printf("❌ Failed to marshal Redis envelope: %v", err)
		return
	}

	if err := r.client.Publish(r.ctx, redisChannel, data).Err(); err != nil {
		log.Printf("⚠️ Failed to publish to Redis: %v", err)
	}
}

func (r *RedisPubSub) Subscribe(hub *Hub) {
	if r == nil || r.client == nil {
		return
	}

	pubsub := r.client.Subscribe(r.ctx, redisChannel)
	ch := pubsub.Channel()

	go func() {
		defer pubsub.Close()
		for {
			select {
			case <-r.ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				var envelope RedisEnvelope
				if err := json.Unmarshal([]byte(msg.Payload), &envelope); err != nil {
					continue
				}
				hub.DeliverFromRedis(&envelope)
			}
		}
	}()
}

func (r *RedisPubSub) Close() {
	if r == nil {
		return
	}
	r.cancel()
	if r.client != nil {
		_ = r.client.Close()
	}
}
