// ==UserScript==
// @name         Neopets - Timers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Timers for Neopets
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    function parseTimeString(timeString) {
        const regex = /(?:(\d+)\s*(?:hrs?|hours?))?\s*,?\s*(?:(\d+)\s*(?:mins?|minutes?))?\s*,?\s*(?:(\d+)\s*(?:secs?|seconds?))?/;
        const matches = timeString.match(regex);
        if (matches) {
            const hours = parseInt(matches[1]) || 0;
            const minutes = parseInt(matches[2]) || 0;
            const seconds = parseInt(matches[3]) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    }

    function setRemainingTime() {
        let timerIndex = 0;

        // Training
        if (window.location.href.includes('training.phtml?type=status' || 'academy.phtml?type=status')) {
            const timeElements = document.querySelectorAll('b');
            const timeRegex = /^\d+\s*(?:hrs?|hours?),?\s*\d+\s*(?:mins?|minutes?),?\s*\d+\s*(?:secs?|seconds?)$/;

            for (const element of timeElements) {
                const timeString = element.textContent.trim();
                if (timeRegex.test(timeString)) {
                    const totalSeconds = parseTimeString(timeString);
                    const endTime = Date.now() + totalSeconds * 1000;

                    // get pet name from the previous element
                    const tableRow = element.closest('tr');
                    if (tableRow) {
                        const prevRow = tableRow.previousElementSibling;
                        if (prevRow) {
                            const timerName = prevRow.textContent.trim().split(' ')[0];
                            GM_setValue(`timer_${timerIndex}`, timerName);
                            GM_setValue(`eventEndTime_${timerName}`, endTime);
                            console.log(`Remaining time set for ${timerName}:`, timeString);
                            timerIndex++;
                        }
                    }
                }
            }
        }

        // Grave Danger
        if (window.location.href.includes('gravedanger')) {
            const gdRemainingElement = document.getElementById('gdRemaining');
            if (gdRemainingElement) {
                // retry until the timer loads
                function checkGdRemaining() {
                    const timeString = gdRemainingElement.textContent.trim();
                    if (timeString === '...') {
                        setTimeout(checkGdRemaining, 100);
                    } else {
                        const totalSeconds = parseTimeString(timeString);
                        if (totalSeconds > 0) {
                            const endTime = Date.now() + totalSeconds * 1000;
                            const timerName = 'Grave Danger';
                            GM_setValue(`timer_${timerIndex}`, timerName);
                            GM_setValue(`eventEndTime_${timerName}`, endTime);
                            console.log(`Remaining time set for ${timerName}:`, timeString);
                        }
                    }
                }
                
                checkGdRemaining();
            }
        }
    }

    function checkRemainingTime() {
        const timerNames = [];
        let i = 0;
        let timerName = GM_getValue(`timer_${i}`, null);
        while (timerName !== null) {
            timerNames.push(timerName);
            i++;
            timerName = GM_getValue(`timer_${i}`, null);
        }

        for (const timerName of timerNames) {
            const endTime = GM_getValue(`eventEndTime_${timerName}`, 0);
            if (endTime) {
                const remainingTime = endTime - Date.now();
                if (remainingTime <= 0) {
                    GM_notification({
                        title: 'Event Time Reminder',
                        text: `The event time for ${timerName} is up!`,
                        timeout: 5000
                    });
                    GM_deleteValue(`eventEndTime_${timerName}`);
                    GM_deleteValue(`timer_${timerNames.indexOf(timerName)}`);
                }
            }
        }
    }

    setRemainingTime();

    setInterval(checkRemainingTime, 1000);
})();