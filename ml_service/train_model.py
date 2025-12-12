# ml_service/train_model.py
from pymongo import MongoClient
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

MONGO_URI = "mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/waterdb"

client = MongoClient(MONGO_URI)
db = client["waterdb"]
coll = db["readings"]

data = list(coll.find({}, {"_id": 0, "turb_idx": 1, "chl_ratio": 1, "bg_ratio": 1}))
df = pd.DataFrame(data)

if df.empty:
  print("❌ No data found. Run ESP32 + backend first to collect readings.")
  exit()

def classify(row):
    t = row["turb_idx"]
    c = row["chl_ratio"]
    b = row["bg_ratio"]

    # GOOD
    if t < 50 and c < 0.5 and b > 1.0:
        return "GOOD"

    # MODERATE
    if 50 <= t <= 150 and 0.5 <= c <= 1.0 and 0.6 <= b <= 1.0:
        return "MODERATE"

    # POOR
    if (150 <= t <= 300) or (1.0 <= c <= 1.5 and b < 0.6):
        return "POOR"

    # VERY POOR
    if (t > 300) or (c > 1.5 and b < 0.5):
        return "VERY_POOR"

    return "UNKNOWN"

df["label"] = df.apply(classify, axis=1)
df = df[df["label"] != "UNKNOWN"]

X = df[["turb_idx", "chl_ratio", "bg_ratio"]]
y = df["label"]

encoder = LabelEncoder()
y_enc = encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

acc = model.score(X_test, y_test)
print("✅ Model trained. Accuracy:", acc)

joblib.dump(model, "model.pkl")
joblib.dump(encoder, "label_encoder.pkl")
print("✅ Saved model.pkl and label_encoder.pkl")
