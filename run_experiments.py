import os
import sys
import json
import time

# Add backend to path
sys.path.append(r"c:\Users\adijd\OneDrive\Desktop\DASHBOARD\Project\PBL DS\EDUNEXUS\EDUNEXUS\backend")

from ml_hub.trainer import get_available_models, train_model

def main():
    models = get_available_models()
    results = {}
    print(f"Models to train: {models}")
    
    for model_name in models:
        print(f"Training {model_name}...")
        start_time = time.time()
        try:
            res = train_model(model_name)
            duration = time.time() - start_time
            print(f"Successfully trained {model_name} in {duration:.2f}s")
            metrics = res["metrics"]
            metrics["training_time_seconds"] = duration
            results[model_name] = res
        except Exception as e:
            print(f"Failed to train {model_name}: {e}")
            
    # Save to a json file
    with open(r"c:\Users\adijd\OneDrive\Desktop\DASHBOARD\Project\PBL DS\EDUNEXUS\EDUNEXUS\experiment_results.json", "w") as f:
        json.dump(results, f, indent=4)
        
    print("All done.")

if __name__ == "__main__":
    main()
