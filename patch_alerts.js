const fs = require('fs');

let f = fs.readFileSync('frontend/src/components/GlobalAlerts.tsx', 'utf8');

// 1. Remove animate-bounce from the reminder alert div
f = f.replace(/z-\[9999\] animate-bounce w-80/g, 'z-[9999] shadow-lg animate-fade-in-up w-80');

// 2. Add setTimeout for 5 seconds when setting active alert
f = f.replace(
  /setActiveAlert\(due\);/,
  `setActiveAlert(due);
            setTimeout(() => {
              setActiveAlert((currentAlert) => {
                if (currentAlert && currentAlert.id === due.id) return null;
                return currentAlert;
              });
            }, 5000);`
);

fs.writeFileSync('frontend/src/components/GlobalAlerts.tsx', f);
console.log('GlobalAlerts.tsx patched');
