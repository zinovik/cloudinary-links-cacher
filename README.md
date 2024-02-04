# media-urls-updater

## google cloud setup

### create bucket, setup cors, check the bucket's cors:

```bash
gcloud storage buckets create gs://zinovik-gallery --location=us-central1
gcloud storage buckets update gs://zinovik-gallery --cors-file=cors_file.json
gcloud storage buckets describe gs://zinovik-gallery --format="default(cors_config)"
gcloud storage buckets update gs://zinovik-gallery --versioning
```

### create service account

```bash
gcloud iam service-accounts create github-actions
```

### add roles (`Service Account User` and `Cloud Functions Admin`) to the service account you want to use to deploy the function

```
gcloud projects add-iam-policy-binding zinovik-project --member="serviceAccount:github-actions@zinovik-project.iam.gserviceaccount.com" --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding zinovik-project --member="serviceAccount:github-actions@zinovik-project.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser"
```

### creating keys for service account for github-actions `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_FILE`

```bash
gcloud iam service-accounts keys create key-file.json --iam-account=github-actions@appspot.gserviceaccount.com
cat key-file.json | base64
```

### add access to secrets

```
gcloud projects add-iam-policy-binding zinovik-project --member="serviceAccount:306312319198-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

### add secrets

```
printf "CLOUDINARY_CREDENTIALS" | gcloud secrets create media-urls-updater-cloudinary-credentials --locations=us-central1 --replication-policy="user-managed" --data-file=-
```
