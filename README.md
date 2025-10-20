# Kube Credential System

A production-ready microservice-based digital credential issuance and verification platform built with Node.js, TypeScript, React, and Kubernetes.

## Architecture Overview

The Kube Credential System consists of three main components:

- **Credential Issuance Service**: Issues and manages digital credentials
- **Credential Verification Service**: Verifies credential authenticity and integrity
- **React Frontend**: User interface for credential operations

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Issuance       │    │  Verification   │
│   (React)       │    │  Service        │    │  Service        │
│   Port: 3000    │    │  Port: 3001     │    │  Port: 3002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (ALB/Ingress) │
                    └─────────────────┘
```

## 🚀 Features

### Core Functionality
- **Secure Credential Issuance**: Create digitally signed credentials with cryptographic integrity
- **Comprehensive Verification**: Multi-layer validation including signature, expiration, and cross-service verification
- **Worker Identification**: Track which pod/worker handled each request for audit trails
- **Duplicate Prevention**: Prevent issuing duplicate credentials for the same holder and type

### Technical Features
- **Microservices Architecture**: Independent, scalable services
- **Production Security**: Rate limiting, input validation, CORS, helmet security headers
- **Database Persistence**: SQLite with migration path to PostgreSQL
- **Container Ready**: Docker containers with multi-stage builds
- **Kubernetes Native**: Full K8s manifests with HPA, health checks, and network policies
- **Comprehensive Testing**: Unit, integration, and API tests
- **Modern UI**: Material-UI React frontend with responsive design

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Kubernetes cluster (for production deployment)
- AWS CLI (for AWS deployment)

## 🛠️ Quick Start

### Local Development with Docker Compose

1. **Clone and setup**:
```bash
git clone <repository-url>
cd kube-cred
```

2. **Start all services**:
```bash
docker-compose up --build
```

3. **Access the application**:
- Frontend: http://localhost:3000
- Issuance API: http://localhost:3001
- Verification API: http://localhost:3002

### Manual Development Setup

1. **Install dependencies for each service**:
```bash
# Issuance Service
cd services/issuance-service
npm install
cp .env.example .env

# Verification Service
cd ../verification-service
npm install
cp .env.example .env

# Frontend
cd ../../frontend
npm install
```

2. **Start services in development mode**:
```bash
# Terminal 1 - Issuance Service
cd services/issuance-service
npm run dev

# Terminal 2 - Verification Service
cd services/verification-service
npm run dev

# Terminal 3 - Frontend
cd frontend
npm start
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Service-Specific Tests
```bash
# Issuance Service
cd services/issuance-service
npm test
npm run test:coverage

# Verification Service
cd services/verification-service
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
```

## 📦 API Documentation

### Credential Issuance Service (Port 3001)

#### Issue Credential
```http
POST /api/credentials
Content-Type: application/json

{
  "holder_name": "John Doe",
  "credential_type": "certificate",
  "expiry_date": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential issued by worker-1",
  "data": {
    "id": "uuid-v4",
    "holder_name": "John Doe",
    "issuer": "Kube Credential Authority",
    "issued_date": "2024-01-15T10:30:00.000Z",
    "credential_type": "certificate",
    "expiry_date": "2025-12-31T23:59:59.000Z",
    "signature": "cryptographic-signature",
    "worker_id": "worker-1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "worker_id": "worker-1",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Credential
```http
GET /api/credentials/{id}
```

#### List Credentials
```http
GET /api/credentials?page=1&limit=10
```

### Credential Verification Service (Port 3002)

#### Verify Credential
```http
POST /api/verifications
Content-Type: application/json

{
  "credential": {
    "id": "uuid-v4",
    "holder_name": "John Doe",
    "issuer": "Kube Credential Authority",
    "issued_date": "2024-01-15T10:30:00.000Z",
    "credential_type": "certificate",
    "expiry_date": "2025-12-31T23:59:59.000Z",
    "signature": "cryptographic-signature",
    "worker_id": "worker-1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential verification completed by verification-worker-1",
  "data": {
    "verification_id": "verification-uuid",
    "credential_id": "uuid-v4",
    "is_valid": true,
    "is_expired": false,
    "verification_status": "valid",
    "verified_by": "verification-worker-1",
    "verified_at": "2024-01-15T10:35:00.000Z",
    "issuer_worker_id": "worker-1",
    "issued_date": "2024-01-15T10:30:00.000Z"
  },
  "worker_id": "verification-worker-1",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Health Endpoints
```http
GET /health
```

Both services provide health check endpoints that return service status, uptime, database connectivity, and worker information.

## 🚀 Deployment

### Kubernetes Deployment

1. **Prepare your cluster**:
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```

2. **Deploy persistent storage**:
```bash
# Update volume IDs in persistent-volume.yaml
kubectl apply -f k8s/persistent-volume.yaml
```

3. **Deploy services**:
```bash
kubectl apply -f k8s/issuance-deployment.yaml
kubectl apply -f k8s/verification-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

4. **Configure auto-scaling and ingress**:
```bash
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### AWS EKS Deployment

1. **Create EKS cluster**:
```bash
eksctl create cluster --name kube-credential --region us-west-2 --nodegroup-name workers --node-type t3.medium --nodes 3 --nodes-min 1 --nodes-max 4
```

2. **Install AWS Load Balancer Controller**:
```bash
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system --set clusterName=kube-credential
```

3. **Build and push images**:
```bash
# Build images
docker build -t your-registry/kube-credential-issuance:latest services/issuance-service/
docker build -t your-registry/kube-credential-verification:latest services/verification-service/
docker build -t your-registry/kube-credential-frontend:latest frontend/

# Push to registry
docker push your-registry/kube-credential-issuance:latest
docker push your-registry/kube-credential-verification:latest
docker push your-registry/kube-credential-frontend:latest
```

4. **Update manifests and deploy**:
```bash
# Update image references in deployment files
# Update domain and certificate ARN in ingress.yaml
kubectl apply -f k8s/
```

## 🔧 Configuration

### Environment Variables

#### Issuance Service
- `PORT`: Service port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for cryptographic operations
- `DB_PATH`: SQLite database file path
- `LOG_LEVEL`: Logging level (info/debug/error)
- `WORKER_ID`: Worker identifier (auto-generated if not set)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

#### Verification Service
- `PORT`: Service port (default: 3002)
- `ISSUANCE_SERVICE_URL`: URL of issuance service
- All other variables same as issuance service

#### Frontend
- `REACT_APP_ISSUANCE_SERVICE_URL`: Issuance service API URL
- `REACT_APP_VERIFICATION_SERVICE_URL`: Verification service API URL

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up network policies
- [ ] Enable audit logging
- [ ] Configure resource limits
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### Security Features
- **Cryptographic Signatures**: SHA-256 based credential signatures
- **Input Validation**: Comprehensive request validation using Joi
- **Rate Limiting**: Configurable rate limiting per IP
- **Security Headers**: Helmet.js security headers
- **Non-root Containers**: All containers run as non-root users
- **Network Policies**: Kubernetes network segmentation

## 📊 Monitoring & Observability

### Health Checks
All services provide `/health` endpoints with:
- Service status
- Database connectivity
- Uptime information
- Worker identification
- Inter-service connectivity (verification service)

### Logging
- Structured JSON logging with Winston
- Request/response logging
- Error tracking with stack traces
- Worker ID in all log entries

### Metrics
- Kubernetes resource metrics
- Application performance metrics
- Auto-scaling based on CPU/memory usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Services can't communicate**:
   - Check network connectivity between containers
   - Verify service URLs in environment variables
   - Check Kubernetes service DNS resolution

2. **Database connection errors**:
   - Ensure data directories have proper permissions
   - Check persistent volume claims status
   - Verify SQLite file permissions

3. **Frontend can't reach APIs**:
   - Check CORS configuration
   - Verify API URLs in frontend environment
   - Check ingress/load balancer configuration

4. **Health check failures**:
   - Check service startup time
   - Verify health endpoint responses
   - Check resource limits and requests

### Debug Commands
```bash
# Check pod status
kubectl get pods -n kube-credential

# View logs
kubectl logs -f deployment/issuance-service -n kube-credential

# Check service endpoints
kubectl get endpoints -n kube-credential

# Test service connectivity
kubectl exec -it pod-name -n kube-credential -- wget -qO- http://service-name:port/health
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Check Kubernetes events: `kubectl get events -n kube-credential`
4. Create an issue in the repository with detailed information

---

**Built with ❤️ for secure, scalable credential management**

