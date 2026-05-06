# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the project
# Note: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY 
# must be provided as build args (--build-arg) during build for Cloud Run
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# If build args are provided, write them to .env.production so Vite bakes them in.
# This prevents empty ENV vars from overwriting your local .env file inside the container.
RUN if [ -n "$VITE_SUPABASE_URL" ]; then echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" >> .env.production; fi
RUN if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env.production; fi

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
