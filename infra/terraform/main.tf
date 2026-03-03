terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # TODO: Configure GCS backend for shared state
  # backend "gcs" {
  #   bucket = "bluewirks-terraform-state"
  #   prefix = "intelligence-cloud"
  # }
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

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# --- Enable Required APIs ---

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "pubsub.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "aiplatform.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "errorreporting.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# --- Service Accounts ---

resource "google_service_account" "api_sa" {
  account_id   = "bluewirks-api-${var.environment}"
  display_name = "BlueWirks API (${var.environment})"
}

resource "google_service_account" "worker_sa" {
  account_id   = "bluewirks-worker-${var.environment}"
  display_name = "BlueWirks Worker (${var.environment})"
}

resource "google_service_account" "ci_sa" {
  account_id   = "bluewirks-ci-${var.environment}"
  display_name = "BlueWirks CI/CD (${var.environment})"
}

# --- IAM Bindings ---

# API SA: Cloud Run Invoker, Firestore User, Storage Creator
resource "google_project_iam_member" "api_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_project_iam_member" "api_storage" {
  project = var.project_id
  role    = "roles/storage.objectCreator"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

resource "google_project_iam_member" "api_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.api_sa.email}"
}

# Worker SA: Pub/Sub Subscriber, Vertex AI User, Storage Viewer
resource "google_project_iam_member" "worker_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

resource "google_project_iam_member" "worker_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.worker_sa.email}"
}

# CI SA: Cloud Build Editor, Artifact Registry Writer
resource "google_project_iam_member" "ci_build" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${google_service_account.ci_sa.email}"
}

resource "google_project_iam_member" "ci_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.ci_sa.email}"
}

# --- Pub/Sub ---

resource "google_pubsub_topic" "ingestion" {
  name = "ingestion-topic-${var.environment}"
}

resource "google_pubsub_subscription" "ingestion_sub" {
  name  = "ingestion-sub-${var.environment}"
  topic = google_pubsub_topic.ingestion.id

  push_config {
    push_endpoint = "https://placeholder-worker-url" # Updated after Cloud Run deploy
  }

  ack_deadline_seconds = 60
}

# --- Storage ---

resource "google_storage_bucket" "assets" {
  name     = "bluewirks-assets-${var.environment}-${var.project_id}"
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

# --- Outputs ---

output "api_service_account" {
  value = google_service_account.api_sa.email
}

output "worker_service_account" {
  value = google_service_account.worker_sa.email
}

output "ci_service_account" {
  value = google_service_account.ci_sa.email
}

output "asset_bucket" {
  value = google_storage_bucket.assets.name
}

output "ingestion_topic" {
  value = google_pubsub_topic.ingestion.id
}
