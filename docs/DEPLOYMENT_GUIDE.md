# FlowMind Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying FlowMind Chat App across different environments, from local development to production cloud deployment with Qdrant vector database integration.

---

## 🏗️ Infrastructure Requirements

### Minimum System Requirements

**Development Environment**:
- **Node.js**: 18.0.0 or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 1GB free space for dependencies
- **Network**: Stable internet for API calls

**Production Environment**:
- **Node.js**: 18.0.0 LTS or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB free space (includes logs, cache)
- **Network**: High-bandwidth connection
- **SSL Certificate**: Required for production

### External Services

**Required Services**:
- **OpenAI API**: For embeddings and chat completions
- **Qdrant Database**: Vector database for RAG functionality

**Optional Services**:
- **Redis**: For distributed caching (production)
- **PostgreSQL**: For user data and analytics (future)
- **Monitoring**: Application performance monitoring

---

## 🔧 Environment Configuration

### Environment Variables

Create `.env.local` for development or `.env.production` for production:

```bash
# Required - OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required - Qdrant Configuration
QDRANT_URL=https://your-qdrant-instance.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development  # or 'production'

# Optional - Performance Tuning
CACHE_TTL=300000                    # 5 minutes in milliseconds
MAX_SEARCH_RESULTS=10               # Maximum RAG results
EMBEDDING_DIMENSIONS=1536           # OpenAI embedding size
HYDE_CACHE_SIZE=200                 # HYDE result cache size

# Optional - Rate Limiting
RATE_LIMIT_WINDOW=60000            # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS=30         # Requests per window

# Optional - Debug Flags
DEBUG_RAG=false                    # Enable RAG debugging logs
DEBUG_HYDE=false                   # Enable HYDE debugging logs
DEBUG_CACHE=false                  # Enable cache debugging logs

# Optional - Security
CORS_ORIGIN=http://localhost:3000  # CORS allowed origins
API_SECRET_KEY=your-secret-key     # Future API authentication

# Optional - Monitoring
MONITORING_ENDPOINT=https://your-monitoring-service.com
ERROR_REPORTING_DSN=https://your-error-tracking-service.com
```

### Qdrant Configuration

**Local Qdrant Setup (Docker)**:
```bash
# Run Qdrant locally
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

**Cloud Qdrant Setup**:
1. Sign up at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a new cluster
3. Get connection URL and API key
4. Update environment variables

### OpenAI API Setup

1. Create account at [OpenAI Platform](https://platform.openai.com/)
2. Generate API key in API Keys section
3. Set up billing (required for production usage)
4. Configure usage limits and monitoring

---

## 🏠 Local Development Setup

### Quick Start

```bash
# 1. Clone repository
git clone [your-repository-url]
cd flowmind

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Initialize Qdrant database (if using local instance)
npm run init-qdrant

# 5. Start development server
npm run dev
```

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production testing
npm run build
npm run start

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Linting and type checking
npm run lint
npm run lint:fix
npm run type-check

# Database operations
npm run init-qdrant         # Initialize Qdrant collections
npm run seed-data           # Seed with sample course data
npm run backup-data         # Backup vector data
```

### Local Testing

**Test API Endpoint**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is Express.js?"}],
    "course": "nodejs"
  }'
```

**Test with Different Courses**:
```bash
# Node.js specific
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "How to create middleware?"}], "course": "nodejs"}'

# Python specific  
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "What are list comprehensions?"}], "course": "python"}'
```

---

## ☁️ Cloud Deployment Options

### Vercel Deployment (Recommended)

**Prerequisites**:
- Vercel account
- GitHub repository
- Environment variables configured

**Deployment Steps**:

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**:
   ```bash
   # Set environment variables via CLI
   vercel env add OPENAI_API_KEY
   vercel env add QDRANT_URL  
   vercel env add QDRANT_API_KEY
   
   # Or use Vercel dashboard
   # https://vercel.com/your-project/settings/environment-variables
   ```

3. **Custom Build Configuration** (`vercel.json`):
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "installCommand": "npm install",
     "regions": ["iad1"],
     "functions": {
       "app/api/chat/route.ts": {
         "maxDuration": 30
       }
     },
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "*"
           }
         ]
       }
     ]
   }
   ```

### AWS Deployment

**Using AWS Amplify**:

1. **Initialize Amplify**:
   ```bash
   npm install -g @aws-amplify/cli
   amplify init
   amplify add hosting
   amplify publish
   ```

2. **Environment Configuration**:
   ```yaml
   # amplify.yml
   version: 1
   backend:
     phases:
       build:
         commands:
           - echo "Backend build completed"
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

**Using AWS Lambda + API Gateway**:

1. **Serverless Framework Setup**:
   ```yaml
   # serverless.yml
   service: flowmind-chat
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
     environment:
       OPENAI_API_KEY: ${env:OPENAI_API_KEY}
       QDRANT_URL: ${env:QDRANT_URL}
       QDRANT_API_KEY: ${env:QDRANT_API_KEY}
   
   functions:
     chat:
       handler: src/lambda/chat.handler
       timeout: 30
       memorySize: 1024
       events:
         - http:
             path: /chat
             method: post
             cors: true
   ```

### Google Cloud Platform

**Using Cloud Run**:

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source code
   COPY . .
   
   # Build application
   RUN npm run build
   
   # Expose port
   EXPOSE 3000
   
   # Start server
   CMD ["npm", "start"]
   ```

2. **Deploy to Cloud Run**:
   ```bash
   # Build and deploy
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/flowmind
   gcloud run deploy flowmind \
     --image gcr.io/[PROJECT-ID]/flowmind \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=[key],QDRANT_URL=[url]
   ```

### Digital Ocean App Platform

1. **Create App Spec** (`.do/app.yaml`):
   ```yaml
   name: flowmind-chat
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/flowmind
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: OPENAI_API_KEY
       value: ${OPENAI_API_KEY}
       type: SECRET
     - key: QDRANT_URL
       value: ${QDRANT_URL}
       type: SECRET
     - key: QDRANT_API_KEY
       value: ${QDRANT_API_KEY}
       type: SECRET
     routes:
     - path: /
   ```

---

## 🗄️ Database Deployment

### Qdrant Cloud Setup

**Production Configuration**:
1. **Create Qdrant Cloud Account**:
   - Visit [Qdrant Cloud](https://cloud.qdrant.io/)
   - Create account and verify email
   - Create new cluster

2. **Cluster Configuration**:
   ```json
   {
     "cluster_name": "flowmind-prod",
     "node_type": "1x.small",
     "disk_size": "20GB",
     "replicas": 1,
     "region": "us-east-1"
   }
   ```

3. **Initialize Collections**:
   ```bash
   # Run initialization script
   npm run init-production-db
   ```

### Self-Hosted Qdrant

**Docker Compose Setup**:
```yaml
# docker-compose.yml
version: '3.7'

services:
  qdrant:
    image: qdrant/qdrant:v1.7.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_data:/qdrant/storage
      - ./qdrant_config:/qdrant/config
    environment:
      - QDRANT_STORAGE__OPTIMIZERS__DELETED_THRESHOLD=0.2
      - QDRANT_STORAGE__OPTIMIZERS__VACUUM_MIN_VECTOR_NUMBER=1000
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - ./redis_data:/data
    restart: unless-stopped
```

**Production Qdrant Configuration**:
```yaml
# qdrant_config/production.yaml
storage:
  optimizers:
    deleted_threshold: 0.2
    vacuum_min_vector_number: 1000
    default_segment_number: 0
  performance:
    max_optimization_threads: 4

service:
  http_port: 6333
  grpc_port: 6334
  enable_cors: true
  max_request_size_mb: 32

cluster:
  enabled: false

telemetry:
  disabled: true
```

---

## 🔒 Security Configuration

### SSL/TLS Setup

**Let's Encrypt with Nginx**:
```nginx
# /etc/nginx/sites-available/flowmind
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Environment Security

**Production Environment Variables**:
```bash
# Never commit these to version control!
# Use secure secret management services

# OpenAI - Use API key with appropriate limits
OPENAI_API_KEY=sk-proj-...

# Qdrant - Use read-only keys where possible
QDRANT_URL=https://your-cluster.qdrant.io:6333
QDRANT_API_KEY=your-secure-api-key

# Security configurations
CORS_ORIGIN=https://your-domain.com
API_SECRET_KEY=your-long-random-secret-key
RATE_LIMIT_MAX_REQUESTS=20  # Lower for production

# Disable debug in production
DEBUG_RAG=false
DEBUG_HYDE=false
DEBUG_CACHE=false
NODE_ENV=production
```

---

## 📊 Monitoring and Analytics

### Application Monitoring

**Performance Monitoring Setup**:
```typescript
// lib/monitoring.ts
import { performance } from 'perf_hooks';

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export class ApplicationMonitor {
  private metrics: MetricData[] = [];

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService({ name, value, timestamp: Date.now(), tags });
    }
  }

  recordResponseTime(operation: string, startTime: number, tags?: Record<string, string>) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.recordMetric(`response_time_${operation}`, duration, tags);
  }

  recordCacheHit(hit: boolean, tags?: Record<string, string>) {
    this.recordMetric('cache_hit_rate', hit ? 1 : 0, tags);
  }

  recordError(operation: string, error: Error, tags?: Record<string, string>) {
    this.recordMetric(`error_${operation}`, 1, { 
      ...tags, 
      error_type: error.name,
      error_message: error.message.substring(0, 100)
    });
  }

  private async sendToMonitoringService(metric: MetricData) {
    // Implement your monitoring service integration
    // Examples: DataDog, New Relic, CloudWatch, etc.
  }
}

export const monitor = new ApplicationMonitor();
```

**Health Check Endpoint**:
```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { qdrantRAG } from '@/lib/qdrant-rag';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      qdrant: false,
      openai: false,
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  };

  try {
    // Check Qdrant connection
    await qdrantRAG.initialize();
    checks.services.qdrant = true;
  } catch (error) {
    checks.services.qdrant = false;
    checks.status = 'degraded';
  }

  try {
    // Check OpenAI API (simple test call)
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    checks.services.openai = testResponse.ok;
  } catch (error) {
    checks.services.openai = false;
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
}
```

### Logging Strategy

**Production Logging**:
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy FlowMind

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        QDRANT_URL: ${{ secrets.QDRANT_URL }}
        QDRANT_API_KEY: ${{ secrets.QDRANT_API_KEY }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Automated Testing

**Test Configuration** (`jest.config.js`):
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

---

## 📈 Performance Optimization

### Production Build Optimization

**Next.js Configuration** (`next.config.js`):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  
  // Performance optimizations
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };
    }
    return config;
  },
  
  // API routes optimization
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/((?!api).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Database Optimization

**Qdrant Performance Tuning**:
```typescript
// lib/qdrant-config.ts
export const productionConfig = {
  // Collection configuration
  collection: {
    vectors: {
      size: 1536,
      distance: 'Cosine',
      hnsw_config: {
        m: 16,                    // Higher for better recall
        ef_construct: 200,        // Higher for better index quality
        full_scan_threshold: 20000, // Higher threshold for production
      }
    },
    optimizers_config: {
      deleted_threshold: 0.2,
      vacuum_min_vector_number: 1000,
      default_segment_number: 4,  // More segments for better performance
    },
    replication_factor: 2,        // Replication for high availability
    write_consistency_factor: 1,
  },
  
  // Search configuration
  search: {
    params: {
      hnsw_ef: 128,              // Higher for better search quality
      exact: false,              // Use approximate search for speed
    },
    limit: 10,                   // Reasonable default limit
  },
};
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures**:
```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install

# Check environment variables
echo $OPENAI_API_KEY | wc -c  # Should be > 50 characters
```

**Runtime Errors**:
```bash
# Check application logs
tail -f logs/combined.log

# Test API connectivity
curl https://your-domain.com/api/health

# Check Qdrant connection
curl -H "api-key: $QDRANT_API_KEY" \
     "$QDRANT_URL/collections"
```

**Performance Issues**:
```bash
# Monitor resource usage
top -p $(pgrep node)

# Check response times
curl -w "@curl-format.txt" -s -o /dev/null \
     -X POST https://your-domain.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"test"}],"course":"nodejs"}'
```

### Recovery Procedures

**Database Recovery**:
```bash
# Backup current state
curl -X POST "$QDRANT_URL/collections/programming_courses/snapshots" \
     -H "api-key: $QDRANT_API_KEY"

# Restore from snapshot
curl -X PUT "$QDRANT_URL/collections/programming_courses/snapshots/upload" \
     -H "api-key: $QDRANT_API_KEY" \
     -H "Content-Type:application/snapshot" \
     --data-binary @snapshot.snapshot
```

**Application Recovery**:
```bash
# Restart application
pm2 restart flowmind

# Or with systemd
sudo systemctl restart flowmind

# Check health after restart
curl https://your-domain.com/api/health
```

---

This deployment guide provides comprehensive instructions for deploying FlowMind across various platforms while maintaining security, performance, and reliability standards.