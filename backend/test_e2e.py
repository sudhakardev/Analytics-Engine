import time
import httpx

API = "http://localhost:8000/api"
headers = {}

def test_flow():
    with httpx.Client(timeout=10.0) as client:
        # 1. Register
        print("[1] Registering user...")
        res = client.post(f"{API}/auth/register", json={
            "email": "test@fde.ai",
            "password": "password123",
            "full_name": "Test User"
        })
        if res.status_code == 400 and "already registered" in res.text:
            print("User exists, falling back to login")
            res = client.post(f"{API}/auth/login", json={
                "email": "test@fde.ai",
                "password": "password123"
            })
        assert res.status_code in [200, 201], f"Auth failed: {res.text}"
        token = res.json()["access_token"]
        headers["Authorization"] = f"Bearer {token}"
        print("Auth OK!")

        # 2. Upload dataset
        print("\n[2] Uploading dataset...")
        with open("sample_loan_data.csv", "rb") as f:
            files = {"file": ("sample_loan_data.csv", f, "text/csv")}
            res = client.post(f"{API}/datasets/upload", headers=headers, files=files)
            assert res.status_code == 201, f"Upload failed: {res.text}"
            dataset_id = res.json()["id"]
            print(f"Dataset uploaded! ID: {dataset_id}")

        # 3. Train model
        # Increase timeout here
        print("\n[3] Training model...")
        with httpx.Client(timeout=120.0) as long_client:
            res = long_client.post(f"{API}/models/train", headers=headers, json={
                "dataset_id": dataset_id,
                "target_column": "loan_approved",
                "algorithm": "XGBoost",
                "test_size": 0.2,
                "n_estimators": 100
            })
            assert res.status_code == 200, f"Training failed: {res.text}"
            model_id = res.json()["id"]
            print(f"Model trained! ID: {model_id}, Accuracy: {res.json()['accuracy']}")

        # 4. Predict
        print("\n[4] Running prediction...")
        res = client.post(f"{API}/predictions/predict", headers=headers, json={
            "model_id": model_id,
            "input_data": {
                "age": 35,
                "income": 70000,
                "credit_score": 750,
                "loan_amount": 25000,
                "employment_years": 5,
                "debt_ratio": 0.3,
                "num_credit_lines": 4,
                "marital_status": "Married",
                "education": "Bachelor",
                "loan_purpose": "Home"
            }
        })
        assert res.status_code == 200, f"Predict failed: {res.text}"
        print(f"Prediction successful: {res.json()['prediction']} at {res.json()['confidence_percent']}% confidence")

        # 5. Analytics
        print("\n[5] Fetching analytics...")
        res = client.get(f"{API}/predictions/analytics", headers=headers)
        assert res.status_code == 200, f"Analytics failed: {res.text}"
        print(f"Analytics fetched! Total predictions: {res.json()['total']}")
        
        print("\n✅ All systems are fully operational and error-free!")

if __name__ == "__main__":
    test_flow()
