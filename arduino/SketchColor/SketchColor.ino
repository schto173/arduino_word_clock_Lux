#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <TimeLib.h>

struct RGB {
    uint8_t r;
    uint8_t g;
    uint8_t b;
};


#define LED_PIN     D4
#define NUM_LEDS    156  // 13x12 matrix
#define LED_TYPE    WS2812B
#define COLOR_ORDER GRB

CRGB leds[NUM_LEDS];
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

// Colors
const CRGB TIME_COLOR = CRGB::Black;
const CRGB SPECIAL_COLOR = CRGB::White;

// Structure for LED coordinates
struct Coordinate {
    uint8_t x;
    uint8_t y;
};

unsigned long lastMinute = 0;
const int BOTTOM_LEDS[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}; // x coordinates of bottom row
const int BOTTOM_ROW = 11; // y coordinate of bottom row

// Define words with their exact coordinates
const Coordinate ET[] = {{0,0}, {1,0}};
const Coordinate ASS[] = {{2,1}, {3,1}, {4,1}};
const Coordinate OP[] = {{0,4}, {1,4}};
const Coordinate FIR[] = {{2,4}, {3,4}, {4,4}};
const Coordinate FENNEF1[] = {{6,1}, {7,1}, {8,1}, {9,1}, {10,1}, {11,1}};
const Coordinate ZENG1[] = {{12,0}, {12,1}, {12,2}, {12,3}};
const Coordinate VEIEREL[] = {{5,0}, {6,0}, {7,0}, {8,0}, {9,0}, {10,0}, {11,0}};
const Coordinate ZWANZEG[] = {{6,3}, {7,3}, {8,3}, {9,3}, {10,3}, {11,3}, {12,3}};
const Coordinate HALWER[] = {{7,4}, {8,4}, {9,4}, {10,4}, {11,4}, {12,4}};
const Coordinate ENG[] = {{3,7}, {4,7}, {5,7}};
const Coordinate ZWOU[] = {{1,6}, {1,7}, {1,8}, {1,9}};
const Coordinate DRAI[] = {{2,9}, {3,9}, {4,9}, {5,9}};
const Coordinate VEIER[] = {{8,7}, {9,7}, {10,7}, {11,7}, {12,7}};
const Coordinate FENNEF2[] = {{7,6}, {8,6}, {9,6}, {10,6}, {11,6}, {12,6}};
const Coordinate SECHS[] = {{0,6}, {0,7}, {0,8}, {0,9}, {0,10}};
const Coordinate SIEWEN[] = {{0,10}, {1,10}, {2,10}, {3,10}, {4,10}, {5,10}};
const Coordinate AACHT[] = {{8,8}, {9,8}, {10,8}, {11,8}, {12,8}};
const Coordinate NENG[] = {{2,7}, {3,7}, {4,7}, {5,7}};
const Coordinate ZENG2[] = {{7,7}, {7,8}, {7,9}, {7,10}};
const Coordinate EELEF[] = {{6,6}, {6,7}, {6,8}, {6,9}, {6,10}};
const Coordinate ZWIELEF[] = {{1,6}, {2,6}, {3,6}, {4,6}, {5,6}, {6,6}, {7,6}};
const Coordinate AUER[] = {{9,10}, {10,10}, {11,10}, {12,10}};

// Special words
const Coordinate DAG[] = {{10,9}, {11,9}, {12,9}};
const Coordinate KINNEKS[] = {{2,6}, {3,7}, {4,8}, {5,9}, {6,10}, {7,11}, {8,12}};
const Coordinate CHRESCHT[] = {{4,5}, {5,5}, {6,5}, {7,5}, {8,5}, {9,5}, {10,5}, {11,5}};
const Coordinate BRETZEL[] = {{0,2}, {1,2}, {2,2}, {3,2}, {4,2}, {5,2}, {6,2}};
const Coordinate SONDEN[] = {{7,2}, {8,2}, {9,2}, {10,2}, {11,2}, {12,2}};
const Coordinate NATIONAL[] = {{0,3}, {1,3}, {2,3}, {3,3}, {4,3}, {5,3}, {5,4}, {6,4}};
const Coordinate LIICHT[] = {{0,1}, {1,1}, {2,0}, {3,0}, {4,0}, {5,1}};
const Coordinate MES[] = {{2,8}, {3,8}, {4,8}};

int currentHour;
int currentMinute;
int currentSecond;

// Function to convert x,y to LED index
int xy(int x, int y) {
    if (y % 2 == 0) {
        return y * 13 + x;
    } else {
        return y * 13 + (12 - x);
    }
}

// Add this function before setup()
int calculateBrightness(int hour) {
    // Evening dimming
    if (hour >= 23 || hour < 6) {
        return 1;  // 10% brightness
    } else if (hour >= 20) {
        return 38;  // 30% brightness
    } else if (hour >= 19) {
        return 77;  // 60% brightness
    } 
    // Morning brightening
    else if (hour == 6) {
        return 13;  // 10% brightness
    } else if (hour == 7) {
        return 38;  // 30% brightness
    } else if (hour == 8) {
        return 77;  // 60% brightness
    }
    // Default brightness during the day (8:00-19:00)
    return 128;  // 100% brightness
}


// Change this to use CRGB instead
CRGB colorMatrix[13][13];
float angle = 0;

// Update the updateColorMatrix function
void updateColorMatrix() {
    float rad = angle * (PI / 180.0);
    
    for(int i = 0; i < 13; i++) {
        for(int j = 0; j < 13; j++) {
            float x = j - 6.0;  // Center point
            float y = i - 6.0;
            float rotatedX = x * cos(rad) - y * sin(rad);
            float rotatedY = x * sin(rad) + y * cos(rad);
            
            int red = ((rotatedY + 6.0) * 255) / 12.0;
            int green = ((rotatedX + 6.0) * 255) / 12.0;
            
            colorMatrix[i][j] = CRGB(
                constrain(red, 0, 255),
                constrain(green, 0, 255),
                255
            );
        }
    }
    
    angle = fmod((angle + 3), 360);
}

// Update the lightCoordinates function
void lightCoordinates(const Coordinate coords[], int length, CRGB userColor = CRGB::Black) {
    for(int i = 0; i < length; i++) {
        int x = coords[i].x;
        int y = coords[i].y;
        int idx = xy(x, y);
        
        if(userColor == CRGB::Black && y < 12) {  // No user color specified and not bottom row
            leds[idx] = colorMatrix[y][x];  // CRGB can be directly assigned
        } else {
            leds[idx] = userColor;  // Use user-specified color
        }
    }
}

// Check for special days
bool isSpecialDay(int day, int month) {
    // Kinneksdag (June 23)
    if (day == 23 && month == 6) return true;
    // Christmas (December 25)
    if (day == 25 && month == 12) return true;
    // Bretzel Sunday (simplified)
    if (month == 3 && day > 14 && day < 22) return true;
    // National Day (June 23)
    if (day == 23 && month == 6) return true;
    // Liichtmëssdag (February 2)
    if (day == 2 && month == 2) return true;
    
    return false;
}

// Add these global variables at the top
struct DroppingDot {
    float yPos;        // Current Y position
    int xPos;          // X position (target)
    bool isActive;     // Whether this dot is currently dropping
    bool hasLanded;    // Whether the dot has completed its drop
};

static DroppingDot droppingDot = {-1, -1, false, false};

void updateProgressBar() {

    int secondsInCycle = (currentMinute % 5) * 60 + currentSecond;
    Serial.println( secondsInCycle);
    // Calculate which LED should be the progress indicator
    int ledsToLight = secondsInCycle / 23;
    Serial.println(ledsToLight);

    // Check if we need to start a new dropping dot
    if ((secondsInCycle % 23) > 18 && !droppingDot.isActive) {
        // Start new dropping animation
        droppingDot.yPos = 0;  // Start from top
        droppingDot.xPos = BOTTOM_LEDS[ledsToLight];  // Target X position
        droppingDot.isActive = true;
        droppingDot.hasLanded = false;
    }
    
    // Update dropping animation
    if (droppingDot.isActive) {
        droppingDot.yPos += 0.07;
        if (droppingDot.yPos >= BOTTOM_ROW) {
            droppingDot.yPos = BOTTOM_ROW;
            droppingDot.isActive = false;
            droppingDot.hasLanded = true;
        }
    }

    // Draw the current time words
    displayTime(currentHour, currentMinute);
    // Draw progress bar (already lit dots)
    for(int i = 0; i < ledsToLight ; i++) {
        int idx = xy(BOTTOM_LEDS[i], BOTTOM_ROW);
        leds[idx] = CRGB::White;  // Or your preferred color
    }

    // Draw dropping dot and its trail
    if (droppingDot.isActive) {
        // Main dropping dot
        int dropIdx = xy(droppingDot.xPos, (int)droppingDot.yPos);
        if (dropIdx >= 0 && dropIdx < NUM_LEDS) {
            leds[dropIdx] = CRGB::White;
        }
        
        // Trail effect
        for(int trail = 1; trail <= 3; trail++) {
            int trailY = (int)droppingDot.yPos - trail;
            if(trailY >= 0) {
                int trailIdx = xy(droppingDot.xPos, trailY);
                if (trailIdx >= 0 && trailIdx < NUM_LEDS) {
                    leds[trailIdx] = CRGB::White;
                    leds[trailIdx].nscale8(255 >> trail);  // Fade trail intensity
                }
            }
        }
    } else if (droppingDot.hasLanded && ledsToLight > 0) {
        // Draw the landed dot in its final position
        int idx = xy(BOTTOM_LEDS[ledsToLight - 1], BOTTOM_ROW);
        leds[idx] = CRGB::White;  // Or your preferred color
    }
}

void handleSpecialDay(int day, int month) {
    if (day == 23 && month == 6) {
        lightCoordinates(DRAI, sizeof(DRAI)/sizeof(DRAI[0]), SPECIAL_COLOR);
        lightCoordinates(KINNEKS, sizeof(KINNEKS)/sizeof(KINNEKS[0]), SPECIAL_COLOR);
        lightCoordinates(DAG, sizeof(DAG)/sizeof(DAG[0]), SPECIAL_COLOR);
    }
    if (day == 25 && month == 12) {
        lightCoordinates(CHRESCHT, sizeof(CHRESCHT)/sizeof(CHRESCHT[0]), SPECIAL_COLOR);
        lightCoordinates(DAG, sizeof(DAG)/sizeof(DAG[0]), SPECIAL_COLOR);
    }
    if (month == 3 && day > 14 && day < 22) {
        lightCoordinates(BRETZEL, sizeof(BRETZEL)/sizeof(BRETZEL[0]), SPECIAL_COLOR);
        lightCoordinates(SONDEN, sizeof(SONDEN)/sizeof(SONDEN[0]), SPECIAL_COLOR);
    }
    if (day == 23 && month == 6) {
        lightCoordinates(NATIONAL, sizeof(NATIONAL)/sizeof(NATIONAL[0]), SPECIAL_COLOR);
        lightCoordinates(VEIER, sizeof(VEIER)/sizeof(VEIER[0]), SPECIAL_COLOR);
        lightCoordinates(DAG, sizeof(DAG)/sizeof(DAG[0]), SPECIAL_COLOR);
    }
    if (day == 2 && month == 2) {
        lightCoordinates(LIICHT, sizeof(LIICHT)/sizeof(LIICHT[0]), SPECIAL_COLOR);
        lightCoordinates(MES, sizeof(MES)/sizeof(MES[0]), SPECIAL_COLOR);
        lightCoordinates(DAG, sizeof(DAG)/sizeof(DAG[0]), SPECIAL_COLOR);
    }
}

void displayTime(int hours, int minutes) {
    FastLED.clear();
    if (minutes > 29) hours++;
    
    // Always show "ET ASS"
    lightCoordinates(ET, sizeof(ET)/sizeof(ET[0]), TIME_COLOR);
    lightCoordinates(ASS, sizeof(ASS)/sizeof(ASS[0]), TIME_COLOR);
    
    // Convert 24h to 12h format
    if (hours > 12) hours -= 12;
    if (hours == 0) hours = 12;
    
    // Handle hours
    switch(hours) {
        case 1: lightCoordinates(ENG, sizeof(ENG)/sizeof(ENG[0]), TIME_COLOR); break;
        case 2: lightCoordinates(ZWOU, sizeof(ZWOU)/sizeof(ZWOU[0]), TIME_COLOR); break;
        case 3: lightCoordinates(DRAI, sizeof(DRAI)/sizeof(DRAI[0]), TIME_COLOR); break;
        case 4: lightCoordinates(VEIER, sizeof(VEIER)/sizeof(VEIER[0]), TIME_COLOR); break;
        case 5: lightCoordinates(FENNEF2, sizeof(FENNEF2)/sizeof(FENNEF2[0]), TIME_COLOR); break;
        case 6: lightCoordinates(SECHS, sizeof(SECHS)/sizeof(SECHS[0]), TIME_COLOR); break;
        case 7: lightCoordinates(SIEWEN, sizeof(SIEWEN)/sizeof(SIEWEN[0]), TIME_COLOR); break;
        case 8: lightCoordinates(AACHT, sizeof(AACHT)/sizeof(AACHT[0]), TIME_COLOR); break;
        case 9: lightCoordinates(NENG, sizeof(NENG)/sizeof(NENG[0]), TIME_COLOR); break;
        case 10: lightCoordinates(ZENG2, sizeof(ZENG2)/sizeof(ZENG2[0]), TIME_COLOR); break;
        case 11: lightCoordinates(EELEF, sizeof(EELEF)/sizeof(EELEF[0]), TIME_COLOR); break;
        case 12: lightCoordinates(ZWIELEF, sizeof(ZWIELEF)/sizeof(ZWIELEF[0]), TIME_COLOR); break;
    }




   if (minutes >= 55) {
    lightCoordinates(FENNEF1, sizeof(FENNEF1)/sizeof(FENNEF1[0]), TIME_COLOR);
    lightCoordinates(FIR, sizeof(FIR)/sizeof(FIR[0]), TIME_COLOR);
} else if (minutes >= 50) {
    lightCoordinates(ZENG1, sizeof(FENNEF1)/sizeof(ZENG1[0]), TIME_COLOR);
    lightCoordinates(FIR, sizeof(FIR)/sizeof(FIR[0]), TIME_COLOR);
}
  else if (minutes >= 45) {
    lightCoordinates(VEIEREL, sizeof(VEIEREL)/sizeof(VEIEREL[0]), TIME_COLOR);
    lightCoordinates(FIR, sizeof(FIR)/sizeof(FIR[0]), TIME_COLOR);
} else if (minutes >= 40) {
    lightCoordinates(ZWANZEG, sizeof(ZWANZEG)/sizeof(ZWANZEG[0]), TIME_COLOR);
    lightCoordinates(FIR, sizeof(FIR)/sizeof(FIR[0]), TIME_COLOR);
} else if (minutes >= 35) {
    lightCoordinates(FENNEF1, sizeof(FENNEF1)/sizeof(FENNEF1[0]), TIME_COLOR);
    lightCoordinates(OP, sizeof(OP)/sizeof(OP[0]), TIME_COLOR);
    lightCoordinates(HALWER, sizeof(HALWER)/sizeof(HALWER[0]), TIME_COLOR);
} else if (minutes >= 30) {
    lightCoordinates(HALWER, sizeof(HALWER)/sizeof(HALWER[0]), TIME_COLOR);
} else if (minutes >= 25) {
    lightCoordinates(FENNEF1, sizeof(FENNEF1)/sizeof(FENNEF1[0]), TIME_COLOR);
    lightCoordinates(FIR, sizeof(FIR)/sizeof(FIR[0]), TIME_COLOR);
    lightCoordinates(HALWER, sizeof(HALWER)/sizeof(HALWER[0]), TIME_COLOR);
} else if (minutes >= 20) {
    lightCoordinates(ZWANZEG, sizeof(ZWANZEG)/sizeof(ZWANZEG[0]), TIME_COLOR);
    lightCoordinates(OP, sizeof(OP)/sizeof(OP[0]), TIME_COLOR);
} else if (minutes >= 15) {
    lightCoordinates(VEIEREL, sizeof(VEIEREL)/sizeof(VEIEREL[0]), TIME_COLOR);
    lightCoordinates(OP, sizeof(OP)/sizeof(OP[0]), TIME_COLOR);
} else if (minutes >= 10) {
    lightCoordinates(ZENG1, sizeof(ZENG1)/sizeof(ZENG1[0]), TIME_COLOR);
    lightCoordinates(OP, sizeof(OP)/sizeof(OP[0]), TIME_COLOR);
} else if (minutes >= 5) {
    lightCoordinates(FENNEF1, sizeof(FENNEF1)/sizeof(FENNEF1[0]), TIME_COLOR);
    lightCoordinates(OP, sizeof(OP)/sizeof(OP[0]), TIME_COLOR);
}else{
   lightCoordinates(AUER, sizeof(AUER)/sizeof(AUER[0]), TIME_COLOR);
}
    
    // Check for special days
    time_t now = timeClient.getEpochTime();
    int currentDay = day(now);
    int currentMonth = month(now);
    
    if (isSpecialDay(currentDay, currentMonth)) {
        handleSpecialDay(currentDay, currentMonth);
    }
    
    FastLED.show();
}

void setup() {

  Serial.begin(115200);
    FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
    FastLED.setBrightness(50);
    
    WiFi.begin("The Black Gate of Mordor", "myprecious");
while (WiFi.status() != WL_CONNECTED) {
    delay(500);
}
    
    timeClient.begin();
    timeClient.setTimeOffset(3600); // UTC+1 for Luxembourg
}

void loop() {
    static unsigned long lastUpdate = 0;
    unsigned long currentMillis = millis();
    
    if (currentMillis - lastUpdate >= 3600000 || lastUpdate == 0) {
        timeClient.update();
        lastUpdate = currentMillis;
    }

    updateColorMatrix();  // Update the color matrix
    
    currentHour = timeClient.getHours();
    currentMinute = timeClient.getMinutes();
    currentSecond = timeClient.getSeconds();

    // Set brightness based on time
    FastLED.setBrightness(calculateBrightness(currentHour));

        // Calculate seconds since last 5-minute mark
    updateProgressBar();
    FastLED.show();
    delay(10);
}