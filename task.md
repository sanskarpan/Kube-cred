The goal of this assignment is to evaluate your ability to design, deploy, and test a 
microservice-based application. You will create both backend and frontend components
for a simple credential issuance and verification system named 'Kube Credential'

Assignment Objectives
• Deploy a Node.js (TypeScript) based API, containerized using Docker, and hosted 
on any cloud free tier (AWS recommended).
• Design two microservices — one for Credential Issuance and one for Credential 
Verification — each running as separate deployments.
• Create two React (TypeScript) pages — one for issuing credentials and one for 
verifying them.
• Each backend service must be independently scalable and properly documented.
• Both Issuance and Verification endpoints must accept credentials as JSON.
• The Issuance API should issue a credential (as JSON). If the credential is already 
issued, it must return a message indicating so.
• Each successful issuance must return which worker (pod) handled the request, in 
the format 'credential issued by worker-n'.
• The Verification API should accept a credential JSON and verify whether it has 
been issued, returning the worker ID and timestamp if valid.

System Requirements
• Backend APIs must be written in Node.js with TypeScript, and containerized using 
Docker.
• The Issuance and Verification APIs must handle JSON-based credentials.
• Each API should maintain its own persistence layer (SQLite, JSON file, or any 
simple free-tier DB is acceptable).
• Frontend must be built in React (TypeScript) with two pages — Issuance and 
Verification — connected to respective APIs.
• Proper error handling and clear UI feedback should be implemented

Testing & Deliverables
• All code must include unit tests.
• Provide Kubernetes YAML manifests for deployments, services, and ingress 
routing (if applicable).
• Provide screenshots or short screen recordings demonstrating successful 
issuance and verification flows.
• Host both frontend and backend (optional) on a free-tier cloud service (AWS 
recommended).
• Submit a Google Drive link containing the zipped project folder and cloud-hosted 
frontend URL.
• The README.md must include clear documentation of the architecture, design 
decisions, and codebase structure