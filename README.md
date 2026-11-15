# RV Level

A mobile-first, installable two-axis digital leveling tool for RV setup.

## Features

- Live left/right and front/back tilt readings using device orientation sensors
- Adjustable tolerance (0.1°–1.0°)
- User calibration / zero point
- Two-second stability confirmation
- Repeating audible and haptic alerts while level
- Dark and light themes
- Screen wake lock while supported and active
- Offline app shell through a service worker

## Run locally

Serve this directory over HTTPS (or localhost). Motion sensor APIs require a secure context. For example:

```sh
python3 -m http.server 8080
```

Then open http://localhost:8080 from a browser on the same device or use an HTTPS deployment.

## Install on iPhone/iPad

1. Open the deployed HTTPS URL in Safari.
2. Tap **Start leveling** and allow motion access.
3. Use Share → **Add to Home Screen**.
4. Launch RV Level from the Home Screen.

## Important measurement notes

This is a convenience tool, not a certified measuring instrument. Device orientation conventions vary by device and how it is placed. The current interface assumes the device is flat, screen-up, in a consistent orientation. Calibrate on a known reference surface before use. Cases, soft countertops, device placement, sensor bias, and movement can affect readings. Verify the final result with a physical level before relying on it for safety-critical setup.

On iOS, motion permission must be requested from a user gesture. Keep the app open in the foreground while leveling; background sensor delivery and audio are not guaranteed. The browser may not support vibration.

## Deployment

GitHub Pages is configured through the workflow in `.github/workflows/deploy.yml`. Pushes to `main` publish the static app.
