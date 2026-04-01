"""
Advanced ML Training Pipeline - GridSearchCV, XGBoost, Pipelines
"""

import os
import logging
import joblib
import pandas as pd
import numpy as np
import warnings
from datetime import datetime
from typing import Dict, Any

from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.exceptions import ConvergenceWarning

from app.core.config import settings

logger = logging.getLogger(__name__)

# Suppress annoying sklearn warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=ConvergenceWarning)

class MLTrainer:
    """Enterprise-grade ML training pipeline with auto-tuning and cross-validation."""

    def __init__(self, algorithm: str = "XGBoost", n_estimators: int = None):
        if algorithm not in ["RandomForest", "XGBoost"]:
            raise ValueError(f"Unsupported algorithm: {algorithm}. Choose 'XGBoost' or 'RandomForest'.")
        self.algorithm = algorithm
        self.target_encoder = LabelEncoder()
        self.feature_names = []

    def _build_pipeline(self, X: pd.DataFrame) -> Pipeline:
        """Construct a robust ColumnTransformer and Model pipeline."""
        num_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
        cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()

        # Numerics: Median Imputation -> Scaling
        num_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

        # Categoricals: Most Frequent Imputation -> OneHot Encoding
        cat_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])

        preprocessor = ColumnTransformer(transformers=[
            ("num", num_transformer, num_cols),
            ("cat", cat_transformer, cat_cols)
        ])

        # Base Model
        if self.algorithm == "RandomForest":
            model = RandomForestClassifier(random_state=42, n_jobs=-1, class_weight="balanced")
        else:
            model = XGBClassifier(random_state=42, n_jobs=-1, eval_metric="logloss")

        return Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", model)
        ])

    def _get_hyperparams(self) -> Dict[str, list]:
        """Define search space for RandomizedSearchCV."""
        if self.algorithm == "RandomForest":
            return {
                "classifier__n_estimators": [50, 100, 200],
                "classifier__max_depth": [None, 10, 20, 30],
                "classifier__min_samples_split": [2, 5, 10]
            }
        else: # XGBoost
            return {
                "classifier__n_estimators": [50, 100, 200],
                "classifier__max_depth": [3, 5, 7, 10],
                "classifier__learning_rate": [0.01, 0.1, 0.2]
            }

    def train(self, file_path: str, target_col: str, test_size: float = 0.2) -> Dict[str, Any]:
        """Execute full auto-tuned ML pipeline and return cross-validated metrics."""
        logger.info(f"Loading dataset from {file_path}")
        df = pd.read_csv(file_path)

        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found.")

        # Drop columns with >60% missing data right away
        df = df.dropna(axis=1, thresh=len(df)*0.4)

        y_raw = df[target_col]
        X = df.drop(columns=[target_col])
        self.feature_names = X.columns.tolist()

        # Encode target classes
        y = self.target_encoder.fit_transform(y_raw.astype(str))

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, 
            stratify=y if len(np.unique(y)) > 1 else None
        )

        pipeline = self._build_pipeline(X)
        param_dist = self._get_hyperparams()

        logger.info(f"Auto-tuning {self.algorithm} via RandomizedSearchCV on {len(X_train)} samples...")
        
        # Cross-validation Search (Auto-tuning hyperparameters for maximum accuracy)
        search = RandomizedSearchCV(
            pipeline,
            param_distributions=param_dist,
            n_iter=5, # 5 random combinations for speed (could be 50 for prod)
            cv=3,
            scoring="accuracy",
            n_jobs=-1,
            random_state=42,
            verbose=1
        )
        
        search.fit(X_train, y_train)
        best_pipeline = search.best_estimator_

        # Evaluate performance
        y_pred = best_pipeline.predict(X_test)
        average = "weighted" if len(np.unique(y)) > 2 else "binary"

        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, average=average, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, average=average, zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, average=average, zero_division=0)),
        }
        logger.info(f"Optimized Metrics: Acc: {metrics['accuracy']:.3f} | Best Params: {search.best_params_}")

        # Save model bundle
        version = f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        save_path = os.path.join(settings.MODEL_SAVE_PATH, f"model_{version}.joblib")
        
        bundle = {
            "pipeline": best_pipeline,
            "target_encoder": self.target_encoder,
            "feature_names": self.feature_names,
            "target_column": target_col,
            "algorithm": self.algorithm,
            "version": version,
        }
        joblib.dump(bundle, save_path)
        logger.info(f"Model saved to {save_path}")

        return {**metrics, "model_path": save_path, "version": version, "feature_names": self.feature_names}
