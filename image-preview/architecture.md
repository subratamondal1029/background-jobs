# Image Upload and Preview Architecture

```text
REQUEST FLOW

[Client] --POST /images { image, metadata? }--> [Server]
[Server] --201 Created { imageId, jobId }-----> [Client]
[Client] --SSE subscribe /jobs/:jobId---------> [Server]


BACKGROUND FLOW

[Server]   --enqueue { jobId, imageId }--------> [RabbitMQ]
[RabbitMQ] --deliver job-----------------------> [Worker]
[Worker]   --read image by imageId
[Worker]   --process image
[Worker]   --store preview in storage
[Worker]   --update image.previewUrl + job.status (DB)
[Worker]   --publish completion { jobId, imageId? }--> [RabbitMQ]
[RabbitMQ] --notify completion------------------> [Server]
[Server]   --SSE send { imagePreviewUrl }------> [Client]
[Server]   --close SSE connection

Retrieval endpoints:
- GET /images/preview/:id -> returns imagePreviewUrl
- GET /images/:id         -> streams original image binary
```