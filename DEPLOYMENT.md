# Deployment Guide

This guide provides step-by-step instructions for deploying the Kube Credential System to various environments.

## 🏠 Local Development Deployment

### Using Docker Compose (Recommended)

1. **Prerequisites**:
   - Docker Desktop installed and running
   - Git for cloning the repository

2. **Quick Start**:
   ```bash
   git clone <repository-url>
   cd kube-cred
   docker-compose up --build
   ```

3. **Access Services**:
   - Frontend: http://localhost:3000
   - Issuance API: http://localhost:3001
   - Verification API: http://localhost:3002
   - Health Checks: http://localhost:3001/health, http://localhost:3002/health

4. **Development Workflow**:
   ```bash
   # View logs
   docker-compose logs -f
   
   # Rebuild specific service
   docker-compose up --build issuance-service
   
   # Stop all services
   docker-compose down
   
   # Clean up volumes
   docker-compose down -v
   ```

### Manual Development Setup

1. **Install Node.js 18+** and npm

2. **Setup Services**:
   ```bash
   # Issuance Service
   cd services/issuance-service
   npm install
   cp .env.example .env
   npm run dev
   
   # Verification Service (new terminal)
   cd services/verification-service
   npm install
   cp .env.example .env
   npm run dev
   
   # Frontend (new terminal)
   cd frontend
   npm install
   npm start
   ```

## ☁️ AWS EKS Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **kubectl** installed
3. **eksctl** installed
4. **Helm** installed
5. **Docker** for building images

### Step 1: Create EKS Cluster

```bash
# Create cluster
eksctl create cluster \
  --name kube-credential \
  --region us-west-2 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 6 \
  --managed

# Verify cluster
kubectl get nodes
```

### Step 2: Install AWS Load Balancer Controller

```bash
# Install CRDs
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=kube-credential \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 3: Create Container Registry

```bash
# Create ECR repositories
aws ecr create-repository --repository-name kube-credential-issuance --region us-west-2
aws ecr create-repository --repository-name kube-credential-verification --region us-west-2
aws ecr create-repository --repository-name kube-credential-frontend --region us-west-2

# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
```

### Step 4: Build and Push Images

```bash
# Set variables
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-west-2
REGISTRY=${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Build images
docker build -t ${REGISTRY}/kube-credential-issuance:latest services/issuance-service/
docker build -t ${REGISTRY}/kube-credential-verification:latest services/verification-service/
docker build -t ${REGISTRY}/kube-credential-frontend:latest frontend/

# Push images
docker push ${REGISTRY}/kube-credential-issuance:latest
docker push ${REGISTRY}/kube-credential-verification:latest
docker push ${REGISTRY}/kube-credential-frontend:latest
```

### Step 5: Create EBS Volumes

```bash
# Create volumes for persistent storage
aws ec2 create-volume \
  --size 10 \
  --volume-type gp3 \
  --availability-zone us-west-2a \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=kube-credential-issuance-data}]'

aws ec2 create-volume \
  --size 10 \
  --volume-type gp3 \
  --availability-zone us-west-2a \
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=kube-credential-verification-data}]'

# Note the volume IDs for the next step
```

### Step 6: Update Kubernetes Manifests

1. **Update image references** in deployment files:
   ```bash
   # Update k8s/issuance-deployment.yaml
   sed -i "s|your-registry/kube-credential-issuance:latest|${REGISTRY}/kube-credential-issuance:latest|g" k8s/issuance-deployment.yaml
   
   # Update k8s/verification-deployment.yaml
   sed -i "s|your-registry/kube-credential-verification:latest|${REGISTRY}/kube-credential-verification:latest|g" k8s/verification-deployment.yaml
   
   # Update k8s/frontend-deployment.yaml
   sed -i "s|your-registry/kube-credential-frontend:latest|${REGISTRY}/kube-credential-frontend:latest|g" k8s/frontend-deployment.yaml
   ```

2. **Update volume IDs** in `k8s/persistent-volume.yaml`

3. **Update domain and certificate** in `k8s/ingress.yaml`

### Step 7: Deploy to Kubernetes

```bash
# Create namespace and configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy storage
kubectl apply -f k8s/persistent-volume.yaml

# Deploy services
kubectl apply -f k8s/issuance-deployment.yaml
kubectl apply -f k8s/verification-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Configure auto-scaling and ingress
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 8: Verify Deployment

```bash
# Check pod status
kubectl get pods -n kube-credential

# Check services
kubectl get svc -n kube-credential

# Check ingress
kubectl get ingress -n kube-credential

# View logs
kubectl logs -f deployment/issuance-service -n kube-credential
```

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development
```yaml
# k8s/configmap-dev.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-credential-config
  namespace: kube-credential
data:
  NODE_ENV: "development"
  LOG_LEVEL: "debug"
  REACT_APP_ISSUANCE_SERVICE_URL: "http://localhost:3001"
  REACT_APP_VERIFICATION_SERVICE_URL: "http://localhost:3002"
```

#### Production
```yaml
# k8s/configmap-prod.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-credential-config
  namespace: kube-credential
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  REACT_APP_ISSUANCE_SERVICE_URL: "https://your-domain.com/api/issuance"
  REACT_APP_VERIFICATION_SERVICE_URL: "https://your-domain.com/api/verification"
```

### Secrets Management

```bash
# Create production secret
kubectl create secret generic kube-credential-secrets \
  --from-literal=JWT_SECRET="your-production-jwt-secret-key" \
  -n kube-credential

# Or use sealed secrets for GitOps
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
```

## 📊 Monitoring Setup

### Prometheus & Grafana

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Install Grafana
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set adminPassword=admin123
```

### Application Metrics

Add to your services:

```typescript
// metrics.ts
import client from 'prom-client';

const register = new client.Registry();
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDuration);
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to EKS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push images
      run: |
        docker build -t $ECR_REGISTRY/kube-credential-issuance:$GITHUB_SHA services/issuance-service/
        docker push $ECR_REGISTRY/kube-credential-issuance:$GITHUB_SHA
        
        docker build -t $ECR_REGISTRY/kube-credential-verification:$GITHUB_SHA services/verification-service/
        docker push $ECR_REGISTRY/kube-credential-verification:$GITHUB_SHA
        
        docker build -t $ECR_REGISTRY/kube-credential-frontend:$GITHUB_SHA frontend/
        docker push $ECR_REGISTRY/kube-credential-frontend:$GITHUB_SHA
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name kube-credential --region us-west-2
        kubectl set image deployment/issuance-service issuance-service=$ECR_REGISTRY/kube-credential-issuance:$GITHUB_SHA -n kube-credential
        kubectl set image deployment/verification-service verification-service=$ECR_REGISTRY/kube-credential-verification:$GITHUB_SHA -n kube-credential
        kubectl set image deployment/frontend frontend=$ECR_REGISTRY/kube-credential-frontend:$GITHUB_SHA -n kube-credential
```

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Pod CrashLoopBackOff**:
   ```bash
   # Check pod logs
   kubectl logs pod-name -n kube-credential
   
   # Check pod events
   kubectl describe pod pod-name -n kube-credential
   ```

2. **Service Discovery Issues**:
   ```bash
   # Check service endpoints
   kubectl get endpoints -n kube-credential
   
   # Test DNS resolution
   kubectl exec -it pod-name -n kube-credential -- nslookup issuance-service
   ```

3. **Ingress Issues**:
   ```bash
   # Check ingress status
   kubectl describe ingress kube-credential-ingress -n kube-credential
   
   # Check ALB controller logs
   kubectl logs -n kube-system deployment/aws-load-balancer-controller
   ```

4. **Persistent Volume Issues**:
   ```bash
   # Check PV status
   kubectl get pv
   
   # Check PVC status
   kubectl get pvc -n kube-credential
   
   # Check storage class
   kubectl get storageclass
   ```

### Health Check Commands

```bash
# Check all resources
kubectl get all -n kube-credential

# Check resource usage
kubectl top pods -n kube-credential
kubectl top nodes

# Check HPA status
kubectl get hpa -n kube-credential

# Test service connectivity
kubectl exec -it deployment/frontend -n kube-credential -- wget -qO- http://issuance-service:3001/health
```

## 🔐 Security Hardening

### Network Policies

```yaml
# Restrict network traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: kube-credential
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### Pod Security Standards

```yaml
# Add to deployment specs
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault
containers:
- securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
      - ALL
```

### RBAC Configuration

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: kube-credential
  name: kube-credential-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
```

## 📈 Scaling Considerations

### Horizontal Pod Autoscaler

```yaml
# Custom metrics scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: issuance-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: issuance-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

### Cluster Autoscaler

```bash
# Install cluster autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Configure for your cluster
kubectl -n kube-system annotate deployment.apps/cluster-autoscaler cluster-autoscaler.kubernetes.io/safe-to-evict="false"
kubectl -n kube-system edit deployment.apps/cluster-autoscaler
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup job
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: alpine
            command:
            - /bin/sh
            - -c
            - |
              apk add --no-cache aws-cli
              tar -czf /tmp/backup-$(date +%Y%m%d).tar.gz /app/data
              aws s3 cp /tmp/backup-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
            volumeMounts:
            - name: data
              mountPath: /app/data
          restartPolicy: OnFailure
```

This deployment guide provides comprehensive instructions for deploying the Kube Credential System across different environments with proper security, monitoring, and scaling considerations.

