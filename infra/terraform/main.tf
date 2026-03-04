terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    bucket = "bluewirks-intelligence-cloud-tfstate"
    prefix = "intelligence-cloud/dev"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "workload_identity_pool" {
  description = "Optional workload identity pool name"
  type        = string
  default     = ""
}

# --- Enable Required APIs ---

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "pubsub.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "aiplatform.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# --- Service Accounts ---

resource "google_service_account" "api_sa" {
  account_id   = "bluewirks-api-sa"
  display_name = "BlueWirks API SA"
}

resource "google_service_account" "worker_sa" {
  account_id   = "bluewirks-worker-sa"
  display_name = "BlueWirks Worker SA"
}

# --- IAM Bindings ---

# --- Pub/Sub ---

resource "google_pubsub_topic" "ingestion" {
  name = "ingest-assets"
}

resource "google_pubsub_subscription" "ingestion_sub" {
  name  = "ingest-sub"
  topic = google_pubsub_topic.ingestion.id

  # Pull subscription first for MVP
  ack_deadline_seconds = 60
}

# --- Storage ---

resource "google_storage_bucket" "assets" {
  name     = "bluewirks-intelligence-cloud-assets"
  location = var.region

  uniform_bucket_level_access = true

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 365
    }
  }
}

# --- Artifact Registry ---

resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "bluewirks"
  description   = "BlueWirks container images"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# --- Cloud Run services (stubs) ---

resource "google_cloud_run_v2_service" "api" {
  name     = "bluewirks-api"
  location = var.region

  template {
    service_account = google_service_account.api_sa.email
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      env {
        name  = "ASSETS_BUCKET"
        value = google_storage_bucket.assets.name
      }
      env {
        name  = "INGEST_TOPIC"
        value = google_pubsub_topic.ingestion.name
      }
    }
  }
}

resource "google_cloud_run_v2_service" "worker" {
  name     = "bluewirks-worker"
  location = var.region

  template {
    service_account = google_service_account.worker_sa.email
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      env {
        name  = "ASSETS_BUCKET"
        value = google_storage_bucket.assets.name
      }
      env {
        name  = "INGEST_TOPIC"
        value = google_pubsub_topic.ingestion.name
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "api_invoker" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- Least privilege IAM for ingestion slice ---

# api-sa
resource "google_storage_bucket_iam_member" "api_storage_creator" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_pubsub_topic_iam_member" "api_pubsub_publisher" {
  topic  = google_pubsub_topic.ingestion.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_project_iam_member" "api_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_service_account_iam_member" "api_sa_token_creator_self" {
  service_account_id = google_service_account.api_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.api_sa.email}"
}

# worker-sa
resource "google_pubsub_subscription_iam_member" "worker_pubsub_subscriber" {
  subscription = google_pubsub_subscription.ingestion_sub.name
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_storage_bucket_iam_member" "worker_storage_viewer" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

# --- Outputs ---

output "api_service_account" {
  value = google_service_account.api_sa.email
}

output "worker_service_account" {
  value = google_service_account.worker_sa.email
}

output "asset_bucket" {
  value = google_storage_bucket.assets.name
}

output "ingestion_topic" {
  value = google_pubsub_topic.ingestion.name
}

output "ingestion_subscription" {
  value = google_pubsub_subscription.ingestion_sub.name
}

output "artifact_registry_repo" {
  value = google_artifact_registry_repository.containers.repository_id
}

output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "worker_url" {
  value = google_cloud_run_v2_service.worker.uri
}
