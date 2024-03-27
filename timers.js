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
// @grant        GM_listValues
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

    function setTimerInfo(timerName, timeString) {
        const totalSeconds = parseTimeString(timeString);
        const endTime = Date.now() + totalSeconds * 1000;
        if (!GM_getValue(`eventEndTime_${timerName}`, 0)) {
            GM_setValue(`eventEndTime_${timerName}`, endTime);
            console.log(`Remaining time set for ${timerName}:`, timeString);
        }
    }

    function setTimerInfo(timerName, timeString) {
        const remainingSeconds = parseTimeString(timeString);
        const endTime = Date.now() + remainingSeconds * 1000;
        const currentURL = window.location.href;
        if (!GM_getValue(`endTime_${timerName}`, 0)) {
            GM_setValue(`endTime_${timerName}`, endTime);
            GM_setValue(`url_${timerName}`, currentURL);
            console.log(`Remaining time set for ${timerName}:`, timeString);
            scheduleNextReminder();
        }
    }

    function setRemainingTime() {
        // Training
        if (window.location.href.includes('training.phtml?type=status' || 'academy.phtml?type=status')) {
            const timeElements = document.querySelectorAll('b');
            const timeRegex = /^\d+\s*(?:hrs?|hours?),?\s*\d+\s*(?:mins?|minutes?),?\s*\d+\s*(?:secs?|seconds?)$/;

            for (const element of timeElements) {
                const timeString = element.textContent.trim();
                if (timeRegex.test(timeString)) {
                    const tableRow = element.closest('tr');
                    if (tableRow) {
                        const prevRow = tableRow.previousElementSibling;
                        if (prevRow) {
                            const timerName = prevRow.textContent.trim().split(' ')[0];
                            setTimerInfo(timerName, timeString);
                        }
                    }
                }
            }
        }

        // Grave Danger
        if (window.location.href.includes('gravedanger')) {
            const gdRemainingElement = document.getElementById('gdRemaining');
            if (gdRemainingElement) {
                function checkGdRemaining() {
                    const timeString = gdRemainingElement.textContent.trim();
                    if (timeString === '...') {
                        setTimeout(checkGdRemaining, 100);
                    } else {
                        setTimerInfo('Grave Danger', timeString);
                    }
                }
                checkGdRemaining();
            }
        }
    }

    function scheduleNextReminder() {
        const timerNames = GM_listValues().filter(key => key.startsWith('endTime_')).map(key => key.replace('endTime_', ''));

        let earliestRemainingTime = Infinity;
        let earliestTimerName = null;

        for (const timerName of timerNames) {
            const endTime = GM_getValue(`endTime_${timerName}`, 0);
            if (endTime) {
                const remainingTime = endTime - Date.now();
                if (remainingTime < earliestRemainingTime) {
                    earliestRemainingTime = remainingTime;
                    earliestTimerName = timerName;
                }
            }
        }

        if (earliestTimerName) {
            const redirectURL = GM_getValue(`url_${earliestTimerName}`, '');
            setTimeout(() => {
                GM_notification({
                    title: 'Event Time Reminder',
                    text: `The event time for ${earliestTimerName} is up!`,
                    timeout: 5000,
                    onclick: () => {
                        window.open(redirectURL, '_blank');
                    }
                });
                GM_deleteValue(`endTime_${earliestTimerName}`);
                GM_deleteValue(`url_${earliestTimerName}`);
                scheduleNextReminder();
            }, earliestRemainingTime);
        }
    }

    setRemainingTime();
})();
