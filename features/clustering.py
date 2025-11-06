"""
Unsupervised clustering for player and team archetypes.
Identifies QB styles, offensive schemes, and defensive strategies.
"""

import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from typing import Dict, List
from utils import Config, save_parquet, save_json, ensure_dir

logger = logging.getLogger(__name__)


class ArchetypeClustering:
    """Unsupervised clustering for archetypes."""
    
    def __init__(self):
        self.config = Config()
        self.config.load()
        
        self.n_clusters = self.config.get('clustering.n_clusters', {
            'qb': 5,
            'coach': 4,
            'defense': 4
        })
        self.random_state = self.config.get('clustering.random_state', 42)
        
        self.scalers = {}
        self.pca_models = {}
        self.kmeans_models = {}
        self.cluster_labels = {}
    
    def cluster_qbs(self, qb_features: pd.DataFrame) -> pd.DataFrame:
        """
        Cluster QBs into archetypes.
        
        Args:
            qb_features: DataFrame with QB statistical features
            
        Returns:
            DataFrame with cluster assignments
        """
        logger.info("Clustering QB archetypes")
        
        # Select features for clustering
        feature_cols = [
            'scramble_rate',
            'designed_run_rate',
            'deep_pass_rate',
            'play_action_rate',
            'time_to_throw',
            'sack_avoidance',
            'short_pass_rate'
        ]
        
        # Filter to columns that exist
        available_cols = [c for c in feature_cols if c in qb_features.columns]
        
        if not available_cols:
            logger.warning("No QB features available for clustering")
            return qb_features
        
        X = qb_features[available_cols].fillna(0).values
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['qb'] = scaler
        
        # PCA for dimensionality reduction
        pca = PCA(n_components=min(len(available_cols), 10), random_state=self.random_state)
        X_pca = pca.fit_transform(X_scaled)
        self.pca_models['qb'] = pca
        
        # K-Means clustering
        n_clusters = min(self.n_clusters['qb'], len(qb_features))
        kmeans = KMeans(n_clusters=n_clusters, random_state=self.random_state, n_init=10)
        clusters = kmeans.fit_predict(X_pca)
        self.kmeans_models['qb'] = kmeans
        
        # Assign human-readable labels
        cluster_labels = self._label_qb_clusters(kmeans, scaler, available_cols)
        self.cluster_labels['qb'] = cluster_labels
        
        # Add to dataframe
        qb_features = qb_features.copy()
        qb_features['cluster_id'] = clusters
        qb_features['cluster_label'] = [cluster_labels.get(c, f'QB_Type_{c}') for c in clusters]
        
        logger.info(f"Identified {n_clusters} QB archetypes")
        
        return qb_features
    
    def _label_qb_clusters(self, kmeans, scaler, feature_cols: List[str]) -> Dict[int, str]:
        """Assign human-readable labels to QB clusters."""
        labels = {}
        
        # Get cluster centers in original feature space
        centers = kmeans.cluster_centers_
        
        # If PCA was used, we need to inverse transform
        if 'qb' in self.pca_models:
            # Approximate original centers (not exact due to PCA)
            centers_scaled = self.pca_models['qb'].inverse_transform(centers)
            centers_original = scaler.inverse_transform(centers_scaled)
        else:
            centers_original = scaler.inverse_transform(centers)
        
        # Create labels based on prominent features
        for i, center in enumerate(centers_original):
            feature_dict = {feature_cols[j]: center[j] for j in range(len(feature_cols))}
            
            # Heuristic labeling
            if feature_dict.get('scramble_rate', 0) > 0.15:
                if feature_dict.get('deep_pass_rate', 0) > 0.15:
                    labels[i] = "Mobile_DeepThreat"
                else:
                    labels[i] = "Scrambler"
            elif feature_dict.get('designed_run_rate', 0) > 0.10:
                labels[i] = "DualThreat"
            elif feature_dict.get('deep_pass_rate', 0) > 0.18:
                labels[i] = "DeepBall_Specialist"
            elif feature_dict.get('short_pass_rate', 0) > 0.60:
                labels[i] = "WestCoast_Distributor"
            else:
                labels[i] = f"Balanced_QB_{i}"
        
        return labels
    
    def cluster_coaches(self, coach_features: pd.DataFrame) -> pd.DataFrame:
        """Cluster offensive schemes/coach tendencies."""
        logger.info("Clustering coach/offense archetypes")
        
        feature_cols = [
            'run_rate',
            'pass_rate',
            'play_action_rate',
            'under_center_rate',
            'pace',
            'early_down_run_rate'
        ]
        
        return self._generic_cluster(
            coach_features,
            feature_cols,
            'coach',
            self.n_clusters['coach']
        )
    
    def cluster_defenses(self, defense_features: pd.DataFrame) -> pd.DataFrame:
        """Cluster defensive schemes."""
        logger.info("Clustering defense archetypes")
        
        feature_cols = [
            'blitz_rate',
            'pressure_rate',
            'two_high_rate',
            'man_coverage_rate',
            'explosive_plays_allowed',
            'red_zone_defense'
        ]
        
        return self._generic_cluster(
            defense_features,
            feature_cols,
            'defense',
            self.n_clusters['defense']
        )
    
    def _generic_cluster(
        self,
        features_df: pd.DataFrame,
        feature_cols: List[str],
        entity_type: str,
        n_clusters: int
    ) -> pd.DataFrame:
        """Generic clustering pipeline."""
        available_cols = [c for c in feature_cols if c in features_df.columns]
        
        if not available_cols:
            logger.warning(f"No {entity_type} features available for clustering")
            return features_df
        
        X = features_df[available_cols].fillna(0).values
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        pca = PCA(n_components=min(len(available_cols), 10), random_state=self.random_state)
        X_pca = pca.fit_transform(X_scaled)
        
        n_clusters = min(n_clusters, len(features_df))
        kmeans = KMeans(n_clusters=n_clusters, random_state=self.random_state, n_init=10)
        clusters = kmeans.fit_predict(X_pca)
        
        features_df = features_df.copy()
        features_df['cluster_id'] = clusters
        features_df['cluster_label'] = [f'{entity_type}_type_{c}' for c in clusters]
        
        return features_df
    
    def save_clusters(self, entity_type: str, clusters_df: pd.DataFrame, output_dir: str):
        """Save cluster assignments."""
        ensure_dir(output_dir)
        
        # Save cluster assignments
        output_path = f"{output_dir}/{entity_type}_clusters.parquet"
        save_parquet(clusters_df, output_path)
        
        # Save cluster labels
        if entity_type in self.cluster_labels:
            labels_path = f"{output_dir}/{entity_type}_cluster_labels.json"
            save_json(self.cluster_labels[entity_type], labels_path)
        
        logger.info(f"Saved {entity_type} clusters to {output_dir}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test clustering
    clusterer = ArchetypeClustering()
    
    # Create synthetic QB features
    np.random.seed(42)
    qb_features = pd.DataFrame({
        'player_id': [f'QB{i}' for i in range(20)],
        'scramble_rate': np.random.uniform(0.05, 0.25, 20),
        'designed_run_rate': np.random.uniform(0.02, 0.15, 20),
        'deep_pass_rate': np.random.uniform(0.10, 0.25, 20),
        'play_action_rate': np.random.uniform(0.15, 0.35, 20),
        'time_to_throw': np.random.uniform(2.3, 3.0, 20),
        'sack_avoidance': np.random.uniform(0.5, 0.8, 20),
        'short_pass_rate': np.random.uniform(0.40, 0.65, 20)
    })
    
    qb_clustered = clusterer.cluster_qbs(qb_features)
    print("\nQB Clusters:")
    print(qb_clustered[['player_id', 'cluster_id', 'cluster_label']].head(10))
    
    # Save
    clusterer.save_clusters('qb', qb_clustered, 'artifacts/clusters')
    
    print("\nClustering test complete!")
