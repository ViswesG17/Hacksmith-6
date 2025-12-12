# ml_service/ml_api.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

model = joblib.load("model.pkl")
encoder = joblib.load("label_encoder.pkl")

class Reading(BaseModel):
    turb_idx: float
    chl_ratio: float
    bg_ratio: float

@app.post("/predict")
def predict(reading: Reading):
    x = np.array([[reading.turb_idx, reading.chl_ratio, reading.bg_ratio]])
    pred = model.predict(x)
    label = encoder.inverse_transform(pred)[0]
    return {"quality": label}
