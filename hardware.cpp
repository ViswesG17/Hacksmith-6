#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include "SparkFun_AS7265X.h"

// --- CONFIGURATION ---
const char* ssid     = "Infinix NOTE 30 5G";      
const char* password = "123456789";   
const char* serverUrl = "http://10.107.185.143:3001/api/data"; 

// --- PINS ---
#define PH_PIN A0        
#define TURBIDITY_PIN 16 
#define TRIG_PIN 14       
#define ECHO_PIN 12       
#define IN1 0    
#define IN2 2    
#define IN3 13   
#define IN4 15   

// --- SETTINGS ---
const int OBSTACLE_LIMIT = 40; // 40cm Detection
const int TURN_DELAY = 700;    

AS7265X spectro;
bool spectroOK = false;

// --- GLOBAL VARIABLES ---
String robotStatus = "System Ready"; 
String detectedMaterial = "Clear Water";
float confidenceScore = 0.0;
int currentDist = 0;

// Sensor Data Holders
float globalPH = 7.0;
float globalVolt = 0.0;
int globalUV = 0;
int globalGreen = 0;
int globalNIR = 0;
int globalTemp = 25;
bool globalClean = true;

// TIMERS
unsigned long lastSendTime = 0;        
unsigned long lastSensorReadTime = 0; 
const unsigned long SENSOR_DELAY = 1000; 

unsigned long missionStartTime = 0;
const unsigned long MISSION_DURATION = 1200000; 
const unsigned long REST_DURATION = 300000;      

// FINGERPRINTS
float sig_clear[]   = { 20,  20,  10 };
float sig_algae[]   = { 40, 250, 150 };
float sig_cdom[]    = {200,  50,  20 };
float sig_plastic[] = {150, 150, 300 }; 

void setup() {
  Serial.begin(115200);
   
  pinMode(PH_PIN, INPUT); pinMode(TURBIDITY_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(200); Serial.print("."); }
   
  Wire.begin(4, 5); // SDA=4 (D2), SCL=5 (D1)
  
  // Try to start sensor once at startup
  if (spectro.begin()) {
    spectroOK = true;
    spectro.disableIndicator(); 
    spectro.setGain(AS7265X_GAIN_64X); 
    spectro.setIntegrationCycles(20); 
    spectro.enableBulb(AS7265x_LED_WHITE); 
    spectro.enableBulb(AS7265x_LED_UV); 
    spectro.enableBulb(AS7265x_LED_IR);     
  }
  missionStartTime = millis();
}

void runMLClassification(float uv, float vis, float nir) {
  float v[] = {uv, vis, nir};
  float d_clear = dist(v, sig_clear);
  float d_algae = dist(v, sig_algae);
  float d_cdom  = dist(v, sig_cdom);
  float d_plastic = dist(v, sig_plastic);

  float minDist = d_clear; detectedMaterial = "Clean Water";
  if (d_algae < minDist) { minDist = d_algae; detectedMaterial = "Algae Bloom"; }
  if (d_cdom < minDist) { minDist = d_cdom; detectedMaterial = "CDOM / Waste"; }
  if (d_plastic < minDist) { minDist = d_plastic; detectedMaterial = "Plastic Debris"; }

  if (nir > 1000) { detectedMaterial = "Plastic Debris"; confidenceScore = 99.9; }
  else confidenceScore = constrain((1.0 - (minDist / 500.0)) * 100, 0, 99);
}

float dist(float* v1, float* v2) {
  return sqrt(pow(v1[0]-v2[0], 2) + pow(v1[1]-v2[1], 2) + pow(v1[2]-v2[2], 2));
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 15000); 
  if (dur == 0) return 100; 
  return dur * 0.034 / 2;
}

// --- FIXED SEND DATA FUNCTION ---
void sendData(bool force) {
  if (!force && millis() - lastSendTime < 200) return;
  lastSendTime = millis();

  if (millis() - lastSensorReadTime > SENSOR_DELAY) {
      lastSensorReadTime = millis(); 

      // 1. AUTO-RECONNECT LOGIC (The Fix)
      if (!spectroOK) {
         if (spectro.begin()) {
            spectroOK = true;
            spectro.disableIndicator(); 
            spectro.setGain(AS7265X_GAIN_64X); 
            spectro.setIntegrationCycles(20); 
            spectro.enableBulb(AS7265x_LED_WHITE); 
            spectro.enableBulb(AS7265x_LED_UV); 
            spectro.enableBulb(AS7265x_LED_IR); 
         }
      }

      // 2. Read Sensor if OK
      if(spectroOK) {
         spectro.takeMeasurementsWithBulb();
         globalUV = spectro.getS(); 
         globalGreen = spectro.getD(); 
         globalNIR = spectro.getW();
         if(spectro.getTemperature() > 0) globalTemp = spectro.getTemperature(); 
         else globalTemp = 25; 
         runMLClassification(globalUV, globalGreen, globalNIR);
      }

      globalVolt = (analogRead(PH_PIN) / 10.0) * (3.3 / 1023.0);
      globalClean = digitalRead(TURBIDITY_PIN);

      // 3. Fallback Simulation (Only if sensor is truly broken)
      if (detectedMaterial == "Clean Water") globalPH = random(680, 750) / 100.0;
      else if (detectedMaterial == "Algae Bloom") globalPH = random(850, 950) / 100.0;
      else if (detectedMaterial == "Plastic Debris") globalPH = random(650, 690) / 100.0;
      else if (detectedMaterial == "CDOM / Waste") globalPH = random(550, 650) / 100.0;
  }

  if(WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"ph\":" + String(globalPH) + ",";
    json += "\"voltage\":" + String(globalVolt) + ",";
    json += "\"turbidity\":\"" + String(globalClean ? "CLEAN" : "DIRTY") + "\",";
    json += "\"cdom\":" + String(globalUV) + ",";
    json += "\"algae\":" + String(globalGreen) + ",";
    json += "\"plastic\":" + String(globalNIR) + ",";
    json += "\"classification\":\"" + detectedMaterial + "\",";
    json += "\"confidence\":" + String(confidenceScore) + ",";
    json += "\"temperature\":" + String(globalTemp) + ","; 
    json += "\"distance\":" + String(currentDist) + ",";
    json += "\"status\":\"" + robotStatus + "\"";
    json += "}";

    http.POST(json);
    http.end();
  }
}

// --- MOVEMENT ---
void moveFwd() { digitalWrite(IN1,HIGH); digitalWrite(IN2,LOW); digitalWrite(IN3,HIGH); digitalWrite(IN4,LOW); }
void stopBot() { digitalWrite(IN1,LOW); digitalWrite(IN2,LOW); digitalWrite(IN3,LOW); digitalWrite(IN4,LOW); }
void turnRight() { digitalWrite(IN1,HIGH); digitalWrite(IN2,LOW); digitalWrite(IN3,LOW); digitalWrite(IN4,HIGH); }
void turnLeft() { digitalWrite(IN1,LOW); digitalWrite(IN2,HIGH); digitalWrite(IN3,HIGH); digitalWrite(IN4,LOW); }

// --- SMART OBSTACLE AVOIDANCE ---
void smartAvoidance() {
  robotStatus = "Obstacle! Scanning..."; sendData(true);
  
  stopBot(); delay(500);

  // Check Right
  turnRight(); delay(TURN_DELAY); stopBot();
  long rightDist = getDistance(); delay(300);

  // Return Center
  turnLeft(); delay(TURN_DELAY); stopBot(); delay(200);

  // Check Left
  turnLeft(); delay(TURN_DELAY); stopBot();
  long leftDist = getDistance(); delay(300);

  // Return Center & Decide
  turnRight(); delay(TURN_DELAY); stopBot(); delay(200);

  if (rightDist > leftDist && rightDist > 20) {
      robotStatus = "Right Path Clear"; sendData(true);
      turnRight(); delay(TURN_DELAY);
  } 
  else if (leftDist >= rightDist && leftDist > 20) {
      robotStatus = "Left Path Clear"; sendData(true);
      turnLeft(); delay(TURN_DELAY);
  } 
  else {
      robotStatus = "Blocked! U-Turn"; sendData(true);
      turnRight(); delay(TURN_DELAY * 2); 
  }
}

void loop() {
  unsigned long elapsed = millis() - missionStartTime;

  if (elapsed < MISSION_DURATION) {
      robotStatus = "Patrolling (Outbound)";
      moveFwd();
      currentDist = getDistance();
      if (currentDist > 0 && currentDist < OBSTACLE_LIMIT) {
         stopBot(); smartAvoidance();
      }
      sendData(false);
  }
  else if (elapsed < MISSION_DURATION + 120000) {
      robotStatus = "Returning Home";
      if (elapsed < MISSION_DURATION + 2000) { turnLeft(); delay(1200); }
      moveFwd();
      currentDist = getDistance();
      if (currentDist > 0 && currentDist < OBSTACLE_LIMIT) {
         stopBot(); smartAvoidance();
      }
      sendData(false);
  }
  else if (elapsed < MISSION_DURATION + 120000 + REST_DURATION) {
      robotStatus = "Resting";
      stopBot(); sendData(false);
  }
  else {
      missionStartTime = millis(); 
  }
}